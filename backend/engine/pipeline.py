"""
判定パイプライン（全体オーケストレーション）。

フロー（CLAUDE.md）:
  Market Detection → Strategy Selection → Signal Scoring
  → Risk Evaluation（独立した拒否権）→ 出力組み立て

出力は「シグナル専用」：推奨・根拠・スコア・リスクスコア・実行可否。
Phase 1 では一切発注しない（助言のみ）。
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Optional

from .events import EconomicEvent
from .regime import detect_regime, RegimeResult
from .risk_gate import evaluate_risk, RiskResult
from .scorer import score_signal, ScoreResult
from .sizing import calculate_size, SizingResult
from .strategy import select_strategy, StrategySelection
from .types import AccountState, Candle, Reason, RiskConfig, RiskFlag

DISCLAIMER = (
    "本出力はAIによる参考情報であり、投資助言ではありません。利益を保証するものではなく、"
    "為替取引には元本を割り込むリスクがあります。最終的な売買判断はご自身の責任で行ってください。"
)


@dataclass
class EngineResult:
    pair: str
    # 環境
    regime: str
    direction: str
    regime_confidence: float
    regime_note: str
    event: Optional[str]
    # 戦略・シグナル
    strategy: str
    recommendation: str          # BUY / SELL / HOLD
    signal_score: float          # 0-100
    score_threshold: float
    # リスク
    risk_score: float            # 0-100（高いほど危険）
    executable: bool             # 閾値到達 かつ Risk Gate 全通過
    risk_flags: List[dict] = field(default_factory=list)
    # サイズ（参考）
    suggested_lot: Optional[float] = None
    stop_distance: Optional[float] = None
    # 根拠ログ
    reasoning: List[dict] = field(default_factory=list)
    disclaimer: str = DISCLAIMER

    def to_dict(self) -> dict:
        return {
            "pair": self.pair,
            "regime": self.regime,
            "direction": self.direction,
            "regime_confidence": self.regime_confidence,
            "regime_note": self.regime_note,
            "event": self.event,
            "strategy": self.strategy,
            "recommendation": self.recommendation,
            "signal_score": self.signal_score,
            "score_threshold": self.score_threshold,
            "risk_score": self.risk_score,
            "executable": self.executable,
            "risk_flags": self.risk_flags,
            "suggested_lot": self.suggested_lot,
            "stop_distance": self.stop_distance,
            "reasoning": self.reasoning,
            "disclaimer": self.disclaimer,
        }


def analyze(
    pair: str,
    candles: List[Candle],
    account: AccountState,
    config: Optional[RiskConfig] = None,
    calendar: Optional[List[EconomicEvent]] = None,
) -> EngineResult:
    cfg = config or RiskConfig()

    # 1. 市場環境判定
    regime: RegimeResult = detect_regime(candles, calendar)

    # 2. 戦略選択
    strat: StrategySelection = select_strategy(regime)

    # 3. シグナルスコアリング
    score: ScoreResult = score_signal(candles, regime, strat)

    # 4. リスク評価（独立。スコアと無関係に拒否権を持つ）
    risk: RiskResult = evaluate_risk(candles, account, cfg)

    # 5. 実行可否：スコア閾値到達 かつ HOLDでない かつ Risk Gate 全通過
    meets_threshold = score.score >= cfg.entry_score_threshold and score.recommendation != "HOLD"
    executable = bool(meets_threshold and risk.executable)

    # スコアが閾値未満なら推奨を HOLD に落とす（条件不足は見送り）
    recommendation = score.recommendation if meets_threshold else "HOLD"

    # 6. サイズ（発注可能な場合のみ参考値を計算）
    sizing: Optional[SizingResult] = None
    if executable:
        sizing = calculate_size(candles, account, cfg, regime)

    # 根拠ログの組み立て（data と opinion を分離して記録）
    reasoning = [
        {"factor": r.factor, "detail": r.detail, "weight": r.weight}
        for r in score.reasons
    ]
    reasoning.insert(0, {
        "factor": "市場環境",
        "detail": f"{regime.regime} / {regime.note}",
        "weight": 0.0,
    })
    if not meets_threshold and score.recommendation != "HOLD":
        reasoning.append({
            "factor": "閾値判定",
            "detail": f"スコア {score.score} が閾値 {cfg.entry_score_threshold} 未満のため見送り。",
            "weight": 0.0,
        })

    return EngineResult(
        pair=pair,
        regime=regime.regime,
        direction=regime.direction,
        regime_confidence=round(regime.confidence, 1),
        regime_note=regime.note,
        event=(regime.event.name if regime.event else None),
        strategy=strat.strategy,
        recommendation=recommendation,
        signal_score=score.score,
        score_threshold=cfg.entry_score_threshold,
        risk_score=risk.risk_score,
        executable=executable,
        risk_flags=[
            {"code": f.code, "message": f.message, "blocking": f.blocking}
            for f in risk.flags
        ],
        suggested_lot=(sizing.lot_units if sizing else None),
        stop_distance=(sizing.stop_distance if sizing else None),
        reasoning=reasoning,
    )

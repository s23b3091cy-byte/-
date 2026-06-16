"""
シグナルスコアリング（0-100）。

採用戦略の「条件一致率」を数値化する。各条件の合致を加点し、根拠を記録する。
スコアが閾値未満なら候補を生成しない（= HOLD / 見送り）。

データ（指標値）と意見（点数・推奨）を明確に分離して返す。
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Literal, Optional

from . import indicators as ind
from .regime import RegimeResult
from .strategy import StrategySelection
from .types import Candle, Reason

Recommendation = Literal["BUY", "SELL", "HOLD"]


@dataclass
class ScoreResult:
    recommendation: Recommendation
    score: float                 # 0-100（条件一致率）
    reasons: List[Reason] = field(default_factory=list)


def _clamp(x: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, x))


def score_signal(
    candles: List[Candle],
    regime: RegimeResult,
    strategy: StrategySelection,
) -> ScoreResult:
    closes = [c.close for c in candles]
    reasons: List[Reason] = []

    # 新規エントリーが許可されない環境（event / high_vol）は常に HOLD
    if not strategy.allow_new_entry:
        reasons.append(Reason(
            factor="環境フィルタ",
            detail=strategy.note,
            weight=0.0,
        ))
        return ScoreResult(recommendation="HOLD", score=0.0, reasons=reasons)

    if strategy.strategy == "trend_following":
        return _score_trend(candles, closes, regime, reasons)
    return _score_range(closes, reasons)


def _score_trend(
    candles: List[Candle],
    closes: List[float],
    regime: RegimeResult,
    reasons: List[Reason],
) -> ScoreResult:
    score = 0.0
    direction = regime.direction
    rec: Recommendation = "BUY" if direction == "up" else "SELL"

    # (1) トレンド強度（ADX）— 最大40点
    if regime.adx is not None:
        adx_pts = _clamp((regime.adx - 20.0) * 2.0, 0.0, 40.0)
        score += adx_pts
        reasons.append(Reason(
            "ADXトレンド強度",
            f"ADX={regime.adx:.1f}（25超で明確なトレンド）",
            round(adx_pts, 1),
        ))

    # (2) 方向の一貫性：短期SMA vs 長期SMA — 最大30点
    sma_fast = ind.sma(closes, 10)
    sma_slow = ind.sma(closes, 30)
    if sma_fast is not None and sma_slow is not None:
        aligned = (sma_fast > sma_slow) if direction == "up" else (sma_fast < sma_slow)
        pts = 30.0 if aligned else 0.0
        score += pts
        reasons.append(Reason(
            "移動平均の方向一致",
            f"SMA10={sma_fast:.3f} / SMA30={sma_slow:.3f}（{'一致' if aligned else '不一致'}）",
            pts,
        ))

    # (3) ブレイク：直近20本の高値/安値更新 — 最大30点
    if len(candles) >= 21:
        window = candles[-21:-1]
        recent_high = max(c.high for c in window)
        recent_low = min(c.low for c in window)
        last = closes[-1]
        broke = (last >= recent_high) if direction == "up" else (last <= recent_low)
        pts = 30.0 if broke else 10.0
        score += pts
        ref = recent_high if direction == "up" else recent_low
        reasons.append(Reason(
            "ブレイクアウト",
            f"終値={last:.3f} vs 直近{'高値' if direction=='up' else '安値'}={ref:.3f}"
            f"（{'更新' if broke else '未更新'}）",
            pts,
        ))

    return ScoreResult(recommendation=rec, score=round(_clamp(score), 1), reasons=reasons)


def _score_range(closes: List[float], reasons: List[Reason]) -> ScoreResult:
    boll = ind.bollinger(closes, 20)
    r = ind.rsi(closes, 14)

    if boll is None or r is None:
        reasons.append(Reason("データ不足", "レンジ判定に必要な指標が計算できない", 0.0))
        return ScoreResult("HOLD", 0.0, reasons)

    upper, mid, lower, pct_b = boll
    score = 0.0
    rec: Recommendation = "HOLD"

    # バンド端からの距離（逆張り余地）— 最大50点
    if pct_b <= 0.1:          # 下限付近 → 買い候補
        rec = "BUY"
        pts = _clamp((0.1 - pct_b) * 500.0, 0.0, 50.0) + 20.0
    elif pct_b >= 0.9:        # 上限付近 → 売り候補
        rec = "SELL"
        pts = _clamp((pct_b - 0.9) * 500.0, 0.0, 50.0) + 20.0
    else:
        pts = 0.0
    score += pts
    reasons.append(Reason(
        "ボリンジャー位置",
        f"%B={pct_b:.2f}（0=下限,1=上限）",
        round(pts, 1),
    ))

    # RSI の極値による裏付け — 最大30点
    if rec == "BUY" and r <= 35:
        pts = _clamp((35 - r) * 2.0, 0.0, 30.0)
    elif rec == "SELL" and r >= 65:
        pts = _clamp((r - 65) * 2.0, 0.0, 30.0)
    else:
        pts = 0.0
    score += pts
    reasons.append(Reason("RSI極値の裏付け", f"RSI={r:.1f}", round(pts, 1)))

    if rec == "HOLD":
        score = 0.0
    return ScoreResult(rec, round(_clamp(score), 1), reasons)

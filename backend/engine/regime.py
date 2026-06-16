"""
市場環境判定（Market Regime Detection）。

4分類：Trend / Range / HighVol / Event
判定は機械的な指標のみで行う（NLP・感情推定なし）。

優先順位（リスクオフを上位に）:
  Event > HighVol > Trend > Range
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import List, Literal, Optional

from . import indicators as ind
from .events import EconomicEvent, is_event_window
from .types import Candle

Regime = Literal["trend", "range", "high_vol", "event"]
Direction = Literal["up", "down", "none"]


@dataclass
class RegimeResult:
    regime: Regime
    direction: Direction          # trend のときのみ "up"/"down"
    confidence: float             # 0-100（判定の確信度）
    adx: Optional[float]
    atr_pct: Optional[float]      # ATR / price（%）= ボラティリティの大きさ
    event: Optional[EconomicEvent]
    note: str


# 閾値（CLAUDE.md：シンプル優先。マジックナンバーはここに集約）
ADX_TREND = 25.0          # これ以上で明確なトレンド
ADX_RANGE = 20.0          # これ未満でレンジ
HIGH_VOL_ATR_PCT = 0.9    # ATR が価格の 0.9% 超で高ボラ扱い


def detect_regime(
    candles: List[Candle],
    calendar: Optional[List[EconomicEvent]] = None,
) -> RegimeResult:
    price = candles[-1].close if candles else 0.0
    atr_val = ind.atr(candles)
    atr_pct = (atr_val / price * 100.0) if (atr_val and price) else None
    adx_res = ind.adx(candles)
    adx_val = adx_res[0] if adx_res else None

    # 1) Event（最優先のリスクオフ）
    ev = is_event_window(calendar)
    if ev is not None:
        return RegimeResult(
            regime="event", direction="none", confidence=90.0,
            adx=adx_val, atr_pct=atr_pct, event=ev,
            note=f"高影響イベント「{ev.name}」が{abs(ev.minutes_until)}分以内。新規エントリーを制限。",
        )

    # データ不足は安全側（range 扱い・低確信度）
    if atr_pct is None or adx_val is None:
        return RegimeResult(
            regime="range", direction="none", confidence=20.0,
            adx=adx_val, atr_pct=atr_pct, event=None,
            note="データ不足のため確信度が低い。新規エントリーは見送りを推奨。",
        )

    # 2) HighVol
    if atr_pct >= HIGH_VOL_ATR_PCT:
        return RegimeResult(
            regime="high_vol", direction="none",
            confidence=min(100.0, 50.0 + atr_pct * 20.0),
            adx=adx_val, atr_pct=atr_pct, event=None,
            note=f"ATR が価格の {atr_pct:.2f}% と高い。ポジションサイズを縮小すべき局面。",
        )

    # 3) Trend
    if adx_val >= ADX_TREND and adx_res is not None:
        _, plus_di, minus_di = adx_res
        direction: Direction = "up" if plus_di >= minus_di else "down"
        return RegimeResult(
            regime="trend", direction=direction,
            confidence=min(100.0, adx_val * 2.0),
            adx=adx_val, atr_pct=atr_pct, event=None,
            note=f"ADX={adx_val:.1f} で明確なトレンド（{'上昇' if direction=='up' else '下降'}）。",
        )

    # 4) Range（ADX が低い、または中間ゾーン）
    conf = 70.0 if adx_val < ADX_RANGE else 40.0
    return RegimeResult(
        regime="range", direction="none", confidence=conf,
        adx=adx_val, atr_pct=atr_pct, event=None,
        note=f"ADX={adx_val:.1f} で方向感が弱い。レンジ戦略が有効な局面。",
    )

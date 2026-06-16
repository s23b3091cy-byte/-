"""
ポジションサイズ計算（Position Sizing）。

1トレードの許容損失（資金比%）とストップ幅からロットを逆算する。
ナンピン・マーチンゲール・損失取り返しの構造は持たない（禁止事項）。
高ボラ環境では係数で縮小する。
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional

from . import indicators as ind
from .regime import RegimeResult
from .types import AccountState, Candle, RiskConfig


@dataclass
class SizingResult:
    lot_units: float          # 推奨数量（通貨単位）
    stop_distance: float      # ストップまでの値幅（価格）
    risk_amount: float        # この建玉で許容する損失額
    note: str


# ストップは ATR の倍数で機械的に決める（恣意性を排除）
STOP_ATR_MULTIPLE = 1.5
HIGH_VOL_SIZE_FACTOR = 0.5    # 高ボラ時はサイズを半分に


def calculate_size(
    candles: List[Candle],
    account: AccountState,
    config: RiskConfig,
    regime: RegimeResult,
) -> Optional[SizingResult]:
    atr_val = ind.atr(candles)
    if atr_val is None or atr_val <= 0:
        return None

    stop_distance = STOP_ATR_MULTIPLE * atr_val
    risk_amount = account.equity * (config.risk_per_trade_pct / 100.0)

    # 損失額 = 数量 × ストップ幅 → 数量 = 損失額 / ストップ幅
    lot = risk_amount / stop_distance

    note = f"ストップ={STOP_ATR_MULTIPLE}×ATR={stop_distance:.3f}、許容損失={risk_amount:.0f}"
    if regime.regime == "high_vol":
        lot *= HIGH_VOL_SIZE_FACTOR
        note += f"（高ボラのため×{HIGH_VOL_SIZE_FACTOR}縮小）"

    return SizingResult(
        lot_units=round(lot, 1),
        stop_distance=round(stop_distance, 3),
        risk_amount=round(risk_amount, 1),
        note=note,
    )

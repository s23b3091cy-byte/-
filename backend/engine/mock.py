"""
モックOHLC生成（Phase 1）。決定論的（seed固定）でテスト・デモに使う。
実運用では Market Data API に差し替える。
"""
from __future__ import annotations

import math
import random
from typing import List

from .types import Candle


def generate_candles(
    base_price: float = 156.0,
    n: int = 60,
    seed: int = 42,
    trend_per_bar: float = 0.0,   # 1本あたりの定常ドリフト（トレンド演出）
    volatility: float = 0.15,     # 1本あたりの標準偏差
) -> List[Candle]:
    rng = random.Random(seed)
    candles: List[Candle] = []
    close = base_price
    for _ in range(n):
        open_ = close
        close = open_ + trend_per_bar + rng.gauss(0, volatility)
        high = max(open_, close) + abs(rng.gauss(0, volatility * 0.4))
        low = min(open_, close) - abs(rng.gauss(0, volatility * 0.4))
        volume = rng.uniform(1e5, 5e5)
        candles.append(Candle(
            open=round(open_, 3), high=round(high, 3),
            low=round(low, 3), close=round(close, 3), volume=round(volume),
        ))
    return candles


def make_trend(base: float = 156.0, n: int = 60, up: bool = True, seed: int = 7) -> List[Candle]:
    """明確なトレンド相場。"""
    return generate_candles(
        base, n, seed,
        trend_per_bar=(0.12 if up else -0.12),
        volatility=0.08,
    )


def make_range(base: float = 156.0, n: int = 60, seed: int = 11) -> List[Candle]:
    """方向感のないレンジ相場（正弦波＋ノイズ）。"""
    rng = random.Random(seed)
    candles: List[Candle] = []
    for i in range(n):
        mid = base + math.sin(i / 4.0) * 0.4
        open_ = mid + rng.gauss(0, 0.05)
        close = mid + rng.gauss(0, 0.05)
        high = max(open_, close) + abs(rng.gauss(0, 0.03))
        low = min(open_, close) - abs(rng.gauss(0, 0.03))
        candles.append(Candle(round(open_, 3), round(high, 3), round(low, 3), round(close, 3), 1e5))
    return candles


def make_high_vol(base: float = 156.0, n: int = 60, seed: int = 99) -> List[Candle]:
    """高ボラティリティ相場。"""
    return generate_candles(base, n, seed, trend_per_bar=0.0, volatility=2.5)

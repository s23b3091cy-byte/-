"""
テクニカル指標（純Python実装、外部依存なし）。

すべて「事実」を返す関数。判定（意見）は含めない。
データが不足する場合は None を返し、呼び出し側で安全側に倒す。
"""
from __future__ import annotations

from statistics import mean, pstdev
from typing import List, Optional, Tuple

from .types import Candle


def sma(values: List[float], period: int) -> Optional[float]:
    if len(values) < period:
        return None
    return mean(values[-period:])


def rolling_std(values: List[float], period: int) -> Optional[float]:
    if len(values) < period:
        return None
    return pstdev(values[-period:])


def true_ranges(candles: List[Candle]) -> List[float]:
    """各足の True Range 系列（先頭足は high-low）。"""
    out: List[float] = []
    for i, c in enumerate(candles):
        if i == 0:
            out.append(c.high - c.low)
            continue
        prev_close = candles[i - 1].close
        out.append(max(
            c.high - c.low,
            abs(c.high - prev_close),
            abs(c.low - prev_close),
        ))
    return out


def _wilder_smooth(values: List[float], period: int) -> List[float]:
    """Wilder の平滑化（RMA）。len(values) >= period を前提。"""
    if len(values) < period:
        return []
    smoothed: List[float] = []
    initial = sum(values[:period]) / period
    smoothed.append(initial)
    for v in values[period:]:
        prev = smoothed[-1]
        smoothed.append((prev * (period - 1) + v) / period)
    return smoothed


def atr(candles: List[Candle], period: int = 14) -> Optional[float]:
    """Average True Range。価格の変動の大きさ（ボラティリティ）。"""
    if len(candles) < period + 1:
        return None
    tr = true_ranges(candles)
    smoothed = _wilder_smooth(tr, period)
    return smoothed[-1] if smoothed else None


def adx(candles: List[Candle], period: int = 14) -> Optional[Tuple[float, float, float]]:
    """
    ADX（トレンド強度）と +DI / -DI（方向性）を返す。
    戻り値: (adx, plus_di, minus_di) または None。

    ADX が高い = トレンドが強い。+DI > -DI = 上昇方向。
    """
    if len(candles) < 2 * period + 1:
        return None

    plus_dm: List[float] = []
    minus_dm: List[float] = []
    tr: List[float] = []

    for i in range(1, len(candles)):
        cur, prev = candles[i], candles[i - 1]
        up_move = cur.high - prev.high
        down_move = prev.low - cur.low
        plus_dm.append(up_move if (up_move > down_move and up_move > 0) else 0.0)
        minus_dm.append(down_move if (down_move > up_move and down_move > 0) else 0.0)
        tr.append(max(
            cur.high - cur.low,
            abs(cur.high - prev.close),
            abs(cur.low - prev.close),
        ))

    tr_s = _wilder_smooth(tr, period)
    plus_s = _wilder_smooth(plus_dm, period)
    minus_s = _wilder_smooth(minus_dm, period)
    if not tr_s or not plus_s or not minus_s:
        return None

    # 各時点の DI と DX を計算
    dx_series: List[float] = []
    for tr_v, p_v, m_v in zip(tr_s, plus_s, minus_s):
        if tr_v == 0:
            dx_series.append(0.0)
            continue
        plus_di = 100.0 * p_v / tr_v
        minus_di = 100.0 * m_v / tr_v
        denom = plus_di + minus_di
        dx = 100.0 * abs(plus_di - minus_di) / denom if denom != 0 else 0.0
        dx_series.append(dx)

    if len(dx_series) < period:
        return None
    adx_val = mean(dx_series[-period:])

    # 直近の DI
    last_tr = tr_s[-1]
    plus_di = 100.0 * plus_s[-1] / last_tr if last_tr else 0.0
    minus_di = 100.0 * minus_s[-1] / last_tr if last_tr else 0.0
    return adx_val, plus_di, minus_di


def rsi(closes: List[float], period: int = 14) -> Optional[float]:
    """RSI。買われ過ぎ(>70)・売られ過ぎ(<30)の目安。"""
    if len(closes) < period + 1:
        return None
    gains, losses = [], []
    for i in range(1, len(closes)):
        diff = closes[i] - closes[i - 1]
        gains.append(max(diff, 0.0))
        losses.append(max(-diff, 0.0))
    avg_gain = mean(gains[-period:])
    avg_loss = mean(losses[-period:])
    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return 100.0 - (100.0 / (1.0 + rs))


def bollinger(closes: List[float], period: int = 20, num_std: float = 2.0):
    """
    ボリンジャーバンド。戻り値: (upper, mid, lower, pct_b) または None。
    pct_b: 価格がバンドのどこにあるか（0=下限, 1=上限）。
    """
    mid = sma(closes, period)
    sd = rolling_std(closes, period)
    if mid is None or sd is None:
        return None
    upper = mid + num_std * sd
    lower = mid - num_std * sd
    width = upper - lower
    pct_b = (closes[-1] - lower) / width if width != 0 else 0.5
    return upper, mid, lower, pct_b

"""
テクニカル指標の計算モジュール
OHLCV データから RSI・MACD・ボリンジャーバンドなどを算出する
"""
import numpy as np
import pandas as pd


def compute_rsi(close: pd.Series, period: int = 14) -> pd.Series:
    delta = close.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.ewm(com=period - 1, min_periods=period).mean()
    avg_loss = loss.ewm(com=period - 1, min_periods=period).mean()
    rs = avg_gain / avg_loss.replace(0, np.nan)
    return 100 - (100 / (1 + rs))


def compute_macd(
    close: pd.Series,
    fast: int = 12,
    slow: int = 26,
    signal: int = 9,
) -> pd.DataFrame:
    ema_fast = close.ewm(span=fast, adjust=False).mean()
    ema_slow = close.ewm(span=slow, adjust=False).mean()
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    histogram = macd_line - signal_line
    return pd.DataFrame({"macd": macd_line, "signal": signal_line, "hist": histogram})


def compute_bollinger(
    close: pd.Series, period: int = 20, std_dev: float = 2.0
) -> pd.DataFrame:
    mid = close.rolling(period).mean()
    std = close.rolling(period).std()
    return pd.DataFrame(
        {
            "upper": mid + std_dev * std,
            "mid": mid,
            "lower": mid - std_dev * std,
            "pct_b": (close - (mid - std_dev * std)) / (2 * std_dev * std),
        }
    )


def compute_atr(high: pd.Series, low: pd.Series, close: pd.Series, period: int = 14) -> pd.Series:
    tr = pd.concat(
        [
            high - low,
            (high - close.shift()).abs(),
            (low - close.shift()).abs(),
        ],
        axis=1,
    ).max(axis=1)
    return tr.ewm(com=period - 1, min_periods=period).mean()


def compute_stochastic(
    high: pd.Series, low: pd.Series, close: pd.Series, k_period: int = 14, d_period: int = 3
) -> pd.DataFrame:
    lowest = low.rolling(k_period).min()
    highest = high.rolling(k_period).max()
    k = 100 * (close - lowest) / (highest - lowest).replace(0, np.nan)
    d = k.rolling(d_period).mean()
    return pd.DataFrame({"k": k, "d": d})


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    OHLCV データフレームに全テクニカル指標を付加して返す。
    df 列: open, high, low, close, volume
    """
    df = df.copy()

    df["rsi"] = compute_rsi(df["close"])

    macd = compute_macd(df["close"])
    df["macd"] = macd["macd"]
    df["macd_signal"] = macd["signal"]
    df["macd_hist"] = macd["hist"]

    boll = compute_bollinger(df["close"])
    df["bb_upper"] = boll["upper"]
    df["bb_mid"] = boll["mid"]
    df["bb_lower"] = boll["lower"]
    df["bb_pct_b"] = boll["pct_b"]

    df["atr"] = compute_atr(df["high"], df["low"], df["close"])

    stoch = compute_stochastic(df["high"], df["low"], df["close"])
    df["stoch_k"] = stoch["k"]
    df["stoch_d"] = stoch["d"]

    # 価格変化率
    for lag in [1, 3, 5]:
        df[f"ret_{lag}d"] = df["close"].pct_change(lag)

    # 出来高変化率
    df["volume_chg"] = df["volume"].pct_change()

    df.dropna(inplace=True)
    return df


FEATURE_COLS = [
    "rsi", "macd", "macd_signal", "macd_hist",
    "bb_pct_b", "atr",
    "stoch_k", "stoch_d",
    "ret_1d", "ret_3d", "ret_5d",
    "volume_chg",
]

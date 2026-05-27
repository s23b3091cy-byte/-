"""
為替方向性予測モデル
LightGBM + scikit-learn パイプラインで翌日の方向（上昇/下落/横ばい）を予測する
"""
from __future__ import annotations

import numpy as np
import pandas as pd
from dataclasses import dataclass, field
from typing import Literal

from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier

try:
    import lightgbm as lgb
    _USE_LGB = True
except ImportError:
    _USE_LGB = False

from indicators import build_features, FEATURE_COLS


Direction = Literal["rise", "fall", "flat"]

THRESHOLD = 0.0015  # ±0.15% 以内を「横ばい」とみなす


@dataclass
class PredictionResult:
    direction: Direction
    confidence: int                  # 0–100
    top_factors: list[str]
    explanation_ja: str
    disclaimer_ja: str = field(default=(
        "⚠️ 本予測はAIによる参考情報であり、投資助言ではありません。"
        "為替取引には元本割れリスクがあります。売買判断はご自身の責任で行ってください。"
    ))


def _make_labels(close: pd.Series, threshold: float = THRESHOLD) -> pd.Series:
    """翌日終値への変化率からラベルを生成"""
    ret = close.shift(-1) / close - 1
    labels = pd.Series("flat", index=ret.index)
    labels[ret > threshold] = "rise"
    labels[ret < -threshold] = "fall"
    return labels


def _build_pipeline(use_lgb: bool = True) -> Pipeline:
    if use_lgb and _USE_LGB:
        clf = lgb.LGBMClassifier(
            n_estimators=300,
            learning_rate=0.05,
            num_leaves=31,
            class_weight="balanced",
            random_state=42,
            verbose=-1,
        )
    else:
        clf = RandomForestClassifier(
            n_estimators=200,
            max_depth=6,
            class_weight="balanced",
            random_state=42,
        )
    return Pipeline([("scaler", StandardScaler()), ("clf", clf)])


def _top_feature_importances(pipeline: Pipeline, n: int = 3) -> list[str]:
    """モデルから重要度上位の特徴名を返す"""
    clf = pipeline.named_steps["clf"]
    if hasattr(clf, "feature_importances_"):
        importances = clf.feature_importances_
        indices = np.argsort(importances)[::-1][:n]
        return [FEATURE_COLS[i] for i in indices]
    return FEATURE_COLS[:n]


FACTOR_LABELS_JA: dict[str, str] = {
    "rsi": "RSI（買われ過ぎ/売られ過ぎ指標）",
    "macd": "MACD（トレンドの方向と勢い）",
    "macd_signal": "MACDシグナル（売買タイミング）",
    "macd_hist": "MACDヒストグラム（勢いの強弱）",
    "bb_pct_b": "ボリンジャーバンド（価格の位置）",
    "atr": "ATR（価格変動の大きさ）",
    "stoch_k": "ストキャスティクスK（勢い指標）",
    "stoch_d": "ストキャスティクスD（シグナル線）",
    "ret_1d": "直近1日の値動き",
    "ret_3d": "直近3日の値動き",
    "ret_5d": "直近5日の値動き",
    "volume_chg": "出来高の変化",
}


def _generate_explanation(direction: Direction, confidence: int, top_factors: list[str]) -> str:
    dir_text = {"rise": "上昇", "fall": "下落", "flat": "横ばい"}[direction]
    confidence_text = (
        "非常に高い" if confidence >= 80
        else "やや高い" if confidence >= 65
        else "中程度"
    )
    factors_text = "・".join(
        FACTOR_LABELS_JA.get(f, f) for f in top_factors
    )
    return (
        f"AIは翌日の相場が【{dir_text}】する可能性が{confidence_text}（{confidence}%）と予測しています。\n"
        f"主な判断根拠：{factors_text}\n\n"
        "この予測は過去30日分のテクニカル指標を機械学習で分析した結果です。"
        "市場は予測通りに動かないこともあります。参考情報としてご活用ください。"
    )


class ForexPredictor:
    """
    使い方:
        predictor = ForexPredictor()
        predictor.fit(historical_df)       # 学習
        result = predictor.predict(historical_df)  # 最新データで予測
    """

    def __init__(self, use_lgb: bool = True):
        self._pipeline = _build_pipeline(use_lgb)
        self._trained = False

    def fit(self, df: pd.DataFrame) -> "ForexPredictor":
        feat_df = build_features(df)
        labels = _make_labels(feat_df["close"])
        # 最後の行はラベルが NaN（翌日データなし）なので除外
        valid = feat_df.index.intersection(labels.dropna().index)
        X = feat_df.loc[valid, FEATURE_COLS]
        y = labels.loc[valid]
        self._pipeline.fit(X, y)
        self._trained = True
        return self

    def predict(self, df: pd.DataFrame) -> PredictionResult:
        if not self._trained:
            # 学習データが少ない場合はランダムフォレストでとりあえず学習
            self.fit(df)

        feat_df = build_features(df)
        latest = feat_df.iloc[[-1]][FEATURE_COLS]

        proba = self._pipeline.predict_proba(latest)[0]
        classes = self._pipeline.classes_
        proba_dict = dict(zip(classes, proba))

        direction: Direction = max(proba_dict, key=proba_dict.get)
        confidence = int(round(proba_dict[direction] * 100))

        top_factors = _top_feature_importances(self._pipeline)
        top_factors_ja = [FACTOR_LABELS_JA.get(f, f) for f in top_factors]

        return PredictionResult(
            direction=direction,
            confidence=confidence,
            top_factors=top_factors_ja,
            explanation_ja=_generate_explanation(direction, confidence, top_factors),
        )


# ---- デモ用モックデータ生成 ----------------------------------------

def generate_mock_ohlcv(
    base_price: float = 155.0,
    n_days: int = 60,
    seed: int = 42,
) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    dates = pd.date_range(end=pd.Timestamp.today(), periods=n_days, freq="B")
    close = base_price + np.cumsum(rng.normal(0, 0.3, n_days))
    high = close + rng.uniform(0.1, 0.5, n_days)
    low = close - rng.uniform(0.1, 0.5, n_days)
    open_ = close + rng.normal(0, 0.2, n_days)
    volume = rng.integers(100_000, 500_000, n_days).astype(float)
    return pd.DataFrame(
        {"open": open_, "high": high, "low": low, "close": close, "volume": volume},
        index=dates,
    )

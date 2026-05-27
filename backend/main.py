"""
AI為替予測 FastAPI サーバー

起動方法:
    uvicorn main:app --reload --port 8000

エンドポイント:
    GET  /api/rates          - 全通貨ペアの現在レート + AI予測
    GET  /api/predict/{pair} - 指定ペアの詳細予測
    POST /api/predict/{pair} - カスタムOHLCVデータで予測
"""

from __future__ import annotations

import logging
from typing import Literal

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from predictor import ForexPredictor, generate_mock_ohlcv, PredictionResult

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI為替予測 API",
    description="機械学習を用いた為替方向性予測サービス（参考情報）",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- 通貨ペア設定 -------------------------------------------------------

PAIRS_CONFIG = {
    "usdjpy": {"label": "USD/JPY", "base_price": 156.8},
    "eurjpy": {"label": "EUR/JPY", "base_price": 169.4},
    "gbpjpy": {"label": "GBP/JPY", "base_price": 198.3},
}

# 起動時にモックデータで事前学習しておく
_predictors: dict[str, ForexPredictor] = {}

@app.on_event("startup")
async def _startup():
    for pair_id, cfg in PAIRS_CONFIG.items():
        predictor = ForexPredictor(use_lgb=True)
        mock_df = generate_mock_ohlcv(base_price=cfg["base_price"])
        predictor.fit(mock_df)
        _predictors[pair_id] = predictor
    logger.info("全ペアのモデル学習完了")


# ---- スキーマ -----------------------------------------------------------

class OHLCVRow(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: float


class PredictRequest(BaseModel):
    ohlcv: list[OHLCVRow] = Field(..., min_length=30, description="過去30日以上のOHLCVデータ")


class PredictionResponse(BaseModel):
    pair: str
    direction: Literal["rise", "fall", "flat"]
    confidence: int
    top_factors: list[str]
    explanation_ja: str
    disclaimer_ja: str


class RateInfo(BaseModel):
    pair_id: str
    pair: str
    rate: float
    change: float
    change_pct: float
    prediction: PredictionResponse


# ---- ヘルパー -----------------------------------------------------------

def _mock_rate(base: float) -> tuple[float, float, float]:
    """モックレートと変化量を返す（実際はブローカーAPIに差し替え）"""
    noise = np.random.uniform(-0.5, 0.5)
    rate = round(base + noise, 3)
    change = round(np.random.uniform(-0.5, 0.5), 2)
    change_pct = round(change / rate * 100, 2)
    return rate, change, change_pct


def _result_to_response(pair_id: str, result: PredictionResult) -> PredictionResponse:
    return PredictionResponse(
        pair=PAIRS_CONFIG[pair_id]["label"],
        direction=result.direction,
        confidence=result.confidence,
        top_factors=result.top_factors,
        explanation_ja=result.explanation_ja,
        disclaimer_ja=result.disclaimer_ja,
    )


# ---- エンドポイント -----------------------------------------------------

@app.get("/api/rates", response_model=list[RateInfo], tags=["rates"])
async def get_all_rates():
    """全通貨ペアの現在レートとAI予測を返す"""
    results = []
    for pair_id, cfg in PAIRS_CONFIG.items():
        predictor = _predictors[pair_id]
        mock_df = generate_mock_ohlcv(base_price=cfg["base_price"])
        result = predictor.predict(mock_df)

        rate, change, change_pct = _mock_rate(cfg["base_price"])
        results.append(RateInfo(
            pair_id=pair_id,
            pair=cfg["label"],
            rate=rate,
            change=change,
            change_pct=change_pct,
            prediction=_result_to_response(pair_id, result),
        ))
    return results


@app.get("/api/predict/{pair_id}", response_model=PredictionResponse, tags=["prediction"])
async def predict_pair(pair_id: str):
    """指定した通貨ペアのAI予測を返す"""
    if pair_id not in PAIRS_CONFIG:
        raise HTTPException(
            status_code=404,
            detail=f"未対応の通貨ペアです: {pair_id}。対応ペア: {list(PAIRS_CONFIG.keys())}",
        )
    predictor = _predictors[pair_id]
    mock_df = generate_mock_ohlcv(base_price=PAIRS_CONFIG[pair_id]["base_price"])
    result = predictor.predict(mock_df)
    return _result_to_response(pair_id, result)


@app.post("/api/predict/{pair_id}", response_model=PredictionResponse, tags=["prediction"])
async def predict_with_data(pair_id: str, body: PredictRequest):
    """カスタムOHLCVデータを受け取ってAI予測を返す"""
    if pair_id not in PAIRS_CONFIG:
        raise HTTPException(status_code=404, detail=f"未対応の通貨ペア: {pair_id}")

    rows = [r.model_dump() for r in body.ohlcv]
    df = pd.DataFrame(rows).set_index("date")
    df.index = pd.to_datetime(df.index)
    df = df.astype(float)

    try:
        predictor = ForexPredictor(use_lgb=True)
        result = predictor.predict(df)
    except Exception as e:
        logger.error("予測エラー: %s", e)
        raise HTTPException(status_code=422, detail=f"データ処理エラー: {e}")

    return _result_to_response(pair_id, result)


@app.get("/health", tags=["system"])
async def health():
    return {"status": "ok", "models_loaded": list(_predictors.keys())}

"""
Risk Gate（独立した安全装置）。

スコアがどれだけ高くても、ここで blocking フラグが立てば発注不可。
戦略・スコアリングからは独立しており、安全制約を上書きできない構造にする。

ハード制約:
  - 日次損失上限
  - 連敗停止
  - 最大同時保有数
  - 異常値検出（データスパイク）
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Optional

from . import indicators as ind
from .types import AccountState, Candle, RiskConfig, RiskFlag


@dataclass
class RiskResult:
    executable: bool             # True なら発注候補として有効（Phase 1 では助言のみ）
    risk_score: float            # 0-100（高いほど危険）
    flags: List[RiskFlag] = field(default_factory=list)


def evaluate_risk(
    candles: List[Candle],
    account: AccountState,
    config: RiskConfig,
) -> RiskResult:
    flags: List[RiskFlag] = []
    risk_score = 0.0

    # (1) 日次損失上限
    daily_limit = account.equity * (config.daily_loss_limit_pct / 100.0)
    if account.realized_pnl_today <= -daily_limit:
        flags.append(RiskFlag(
            "DAILY_LOSS_LIMIT",
            f"当日損失 {account.realized_pnl_today:.0f} が上限 -{daily_limit:.0f} に到達。本日の新規取引を停止。",
            blocking=True,
        ))
        risk_score = 100.0
    else:
        # 上限に近いほどリスクスコアを上げる
        if daily_limit > 0:
            used = max(0.0, -account.realized_pnl_today) / daily_limit
            risk_score = max(risk_score, used * 60.0)

    # (2) 連敗停止
    if account.consecutive_losses >= config.max_consecutive_losses:
        flags.append(RiskFlag(
            "CONSECUTIVE_LOSS_STOP",
            f"連敗数 {account.consecutive_losses} が閾値 {config.max_consecutive_losses} に到達。クールダウンを推奨。",
            blocking=True,
        ))
        risk_score = max(risk_score, 90.0)
    elif account.consecutive_losses > 0:
        risk_score = max(risk_score, account.consecutive_losses / config.max_consecutive_losses * 50.0)

    # (3) 最大同時保有数
    if account.open_positions >= config.max_concurrent_positions:
        flags.append(RiskFlag(
            "MAX_POSITIONS",
            f"同時保有数 {account.open_positions} が上限 {config.max_concurrent_positions} に到達。",
            blocking=True,
        ))
        risk_score = max(risk_score, 80.0)

    # (4) 異常値検出（直近の値動きが ATR の n 倍を超える＝スパイク/データ異常）
    atr_val = ind.atr(candles)
    if atr_val and len(candles) >= 2:
        last_move = abs(candles[-1].close - candles[-2].close)
        if atr_val > 0 and last_move > config.anomaly_atr_multiple * atr_val:
            flags.append(RiskFlag(
                "ANOMALY_SPIKE",
                f"直近変動 {last_move:.3f} が ATR の {config.anomaly_atr_multiple} 倍超。データ異常の可能性で停止。",
                blocking=True,
            ))
            risk_score = max(risk_score, 95.0)

    executable = not any(f.blocking for f in flags)
    return RiskResult(executable=executable, risk_score=round(risk_score, 1), flags=flags)

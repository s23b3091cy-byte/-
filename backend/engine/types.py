"""共通データ型。外部依存なし（標準ライブラリのみ）。"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional


@dataclass(frozen=True)
class Candle:
    """1本のローソク足。"""
    open: float
    high: float
    low: float
    close: float
    volume: float = 0.0


@dataclass(frozen=True)
class AccountState:
    """口座とリスク状態。Risk Gate の入力。"""
    equity: float                     # 現在の有効証拠金
    open_positions: int = 0           # 同時保有ポジション数
    realized_pnl_today: float = 0.0   # 当日の確定損益（負=損失）
    consecutive_losses: int = 0       # 連敗数


@dataclass(frozen=True)
class RiskConfig:
    """リスク制約のハードリミット。エンジンの安全装置。"""
    risk_per_trade_pct: float = 1.0          # 1トレードの許容損失（資金比 %）
    daily_loss_limit_pct: float = 5.0        # 日次損失上限（資金比 %）
    max_consecutive_losses: int = 3          # 連敗停止の閾値
    max_concurrent_positions: int = 3        # 最大同時保有数
    anomaly_atr_multiple: float = 4.0        # 異常値検出：直近変動が ATR の何倍で停止か
    entry_score_threshold: float = 60.0      # エントリー候補生成の最低スコア


@dataclass
class Reason:
    """判定根拠の1項目。data と opinion を分離して記録する。"""
    factor: str        # 要因名（例: "ADX trend strength"）
    detail: str        # 事実の説明（数値ベース）
    weight: float      # スコアへの寄与（0-100 スケール内の点数）


@dataclass
class RiskFlag:
    """Risk Gate が立てた拒否/警告フラグ。"""
    code: str          # 機械可読コード（例: "DAILY_LOSS_LIMIT"）
    message: str       # 人間向け説明
    blocking: bool     # True なら発注不可（ハード制約）

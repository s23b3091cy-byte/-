"""
戦略選択（Strategy Selection）。

市場環境 → 採用する戦略タイプを機械的に割り当てる。
ここでは「どの戦略を使うか」だけを決め、スコアリングは scorer.py が担う。
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from .regime import RegimeResult

StrategyType = Literal[
    "trend_following",   # ブレイクアウト / モメンタム / トレーリング
    "mean_reversion",    # 平均回帰・小さめの利確
    "reduce_size",       # 高ボラ：サイズ縮小（基本は見送り）
    "restrict",          # イベント：新規取引を制限
]


@dataclass
class StrategySelection:
    strategy: StrategyType
    allow_new_entry: bool
    note: str


def select_strategy(regime: RegimeResult) -> StrategySelection:
    if regime.regime == "event":
        return StrategySelection(
            strategy="restrict", allow_new_entry=False,
            note="イベント相場：新規エントリーを制限（既存ポジションの管理のみ）。",
        )
    if regime.regime == "high_vol":
        return StrategySelection(
            strategy="reduce_size", allow_new_entry=False,
            note="高ボラティリティ：原則見送り。建てる場合もサイズを縮小。",
        )
    if regime.regime == "trend":
        return StrategySelection(
            strategy="trend_following", allow_new_entry=True,
            note="トレンド追随：押し目/戻り＋ブレイク方向にエントリー、トレーリングで利益最大化。",
        )
    # range
    return StrategySelection(
        strategy="mean_reversion", allow_new_entry=True,
        note="平均回帰：バンド端での逆張り、利確は小さめ。",
    )

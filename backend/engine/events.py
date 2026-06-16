"""
経済イベントカレンダー（Phase 1：モック）。

「感情判定禁止」を遵守するため、ニュースのセンチメント採点は行わない。
扱うのは「事実」のみ：いつ・何のイベントがあり・機械的な影響度ラベルは何か。
影響度は過去の値動きの大きさで決める客観指標であり、主観的な感情推定ではない。
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import List, Literal, Optional

Impact = Literal["high", "medium", "low"]


@dataclass(frozen=True)
class EconomicEvent:
    name: str           # 例: "米雇用統計"
    minutes_until: int  # 現在からイベントまでの分（過ぎていれば負）
    impact: Impact      # 機械的な影響度ラベル（過去のボラティリティ実績に基づく）


# Phase 1 のモックカレンダー。実運用では経済指標APIに差し替える。
_MOCK_CALENDAR: List[EconomicEvent] = [
    EconomicEvent(name="米雇用統計（NFP）", minutes_until=420, impact="high"),
    EconomicEvent(name="FOMC政策金利", minutes_until=1500, impact="high"),
    EconomicEvent(name="日銀 政策決定会合", minutes_until=2880, impact="medium"),
]


def upcoming_events(calendar: Optional[List[EconomicEvent]] = None) -> List[EconomicEvent]:
    cal = calendar if calendar is not None else _MOCK_CALENDAR
    return sorted(cal, key=lambda e: e.minutes_until)


def is_event_window(
    calendar: Optional[List[EconomicEvent]] = None,
    window_minutes: int = 60,
    min_impact: Impact = "high",
) -> Optional[EconomicEvent]:
    """
    高影響イベントが前後 window_minutes 以内にあれば、そのイベントを返す。
    なければ None。取引制限の判定に使う（事実ベース）。
    """
    rank = {"low": 0, "medium": 1, "high": 2}
    threshold = rank[min_impact]
    for e in upcoming_events(calendar):
        if rank[e.impact] < threshold:
            continue
        if abs(e.minutes_until) <= window_minutes:
            return e
    return None

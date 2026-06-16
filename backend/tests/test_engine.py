"""
判定エンジンのテスト（標準ライブラリ unittest のみ。外部依存なし）。

CLAUDE.md "Validate edge cases" に対応。
安全側の挙動（データ不足・イベント・高ボラ・リスク制約）を重点的に検証する。

実行: cd backend && python3 -m unittest discover -s tests -v
"""
import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from engine import analyze
from engine.events import EconomicEvent
from engine.mock import make_trend, make_range, make_high_vol, generate_candles
from engine.types import AccountState, RiskConfig


HEALTHY = AccountState(equity=100_000, open_positions=0, realized_pnl_today=0.0, consecutive_losses=0)
NO_EVENTS = []  # イベントなしのカレンダー


class TestRegimeDetection(unittest.TestCase):
    def test_uptrend_detected(self):
        candles = make_trend(up=True)
        r = analyze("USD/JPY", candles, HEALTHY, calendar=NO_EVENTS)
        self.assertEqual(r.regime, "trend")
        self.assertEqual(r.direction, "up")

    def test_range_detected(self):
        candles = make_range()
        r = analyze("USD/JPY", candles, HEALTHY, calendar=NO_EVENTS)
        self.assertEqual(r.regime, "range")

    def test_high_vol_detected(self):
        candles = make_high_vol()
        r = analyze("USD/JPY", candles, HEALTHY, calendar=NO_EVENTS)
        self.assertEqual(r.regime, "high_vol")


class TestSafetyEdgeCases(unittest.TestCase):
    def test_insufficient_data_is_safe_hold(self):
        """データ不足でクラッシュせず、必ず HOLD・発注不可になる。"""
        candles = generate_candles(n=5)
        r = analyze("USD/JPY", candles, HEALTHY, calendar=NO_EVENTS)
        self.assertEqual(r.recommendation, "HOLD")
        self.assertFalse(r.executable)

    def test_event_window_restricts_trading(self):
        """高影響イベントが近いと、強いトレンドでも新規エントリーを制限。"""
        candles = make_trend(up=True)
        event_now = [EconomicEvent(name="米雇用統計", minutes_until=30, impact="high")]
        r = analyze("USD/JPY", candles, HEALTHY, calendar=event_now)
        self.assertEqual(r.regime, "event")
        self.assertEqual(r.recommendation, "HOLD")
        self.assertFalse(r.executable)
        self.assertEqual(r.event, "米雇用統計")

    def test_high_vol_blocks_new_entry(self):
        candles = make_high_vol()
        r = analyze("USD/JPY", candles, HEALTHY, calendar=NO_EVENTS)
        self.assertEqual(r.recommendation, "HOLD")
        self.assertFalse(r.executable)


class TestRiskGate(unittest.TestCase):
    def setUp(self):
        self.candles = make_trend(up=True)

    def test_daily_loss_limit_blocks(self):
        acct = AccountState(equity=100_000, realized_pnl_today=-6_000)  # 上限5%=5000超
        r = analyze("USD/JPY", self.candles, acct, calendar=NO_EVENTS)
        self.assertFalse(r.executable)
        codes = [f["code"] for f in r.risk_flags]
        self.assertIn("DAILY_LOSS_LIMIT", codes)

    def test_consecutive_losses_block(self):
        acct = AccountState(equity=100_000, consecutive_losses=3)
        r = analyze("USD/JPY", self.candles, acct, calendar=NO_EVENTS)
        self.assertFalse(r.executable)
        codes = [f["code"] for f in r.risk_flags]
        self.assertIn("CONSECUTIVE_LOSS_STOP", codes)

    def test_max_positions_block(self):
        acct = AccountState(equity=100_000, open_positions=3)
        r = analyze("USD/JPY", self.candles, acct, calendar=NO_EVENTS)
        self.assertFalse(r.executable)
        codes = [f["code"] for f in r.risk_flags]
        self.assertIn("MAX_POSITIONS", codes)

    def test_risk_score_in_range(self):
        acct = AccountState(equity=100_000, realized_pnl_today=-2_500)  # 上限の半分
        r = analyze("USD/JPY", self.candles, acct, calendar=NO_EVENTS)
        self.assertGreaterEqual(r.risk_score, 0.0)
        self.assertLessEqual(r.risk_score, 100.0)


class TestSignalOutput(unittest.TestCase):
    def test_healthy_uptrend_can_be_executable(self):
        """健全な口座＋強い上昇トレンドなら BUY 候補・発注可になり得る。"""
        candles = make_trend(up=True)
        r = analyze("USD/JPY", candles, HEALTHY, calendar=NO_EVENTS)
        self.assertEqual(r.recommendation, "BUY")
        self.assertGreaterEqual(r.signal_score, r.score_threshold)
        self.assertTrue(r.executable)
        # 発注可なら参考ロットとストップが付く
        self.assertIsNotNone(r.suggested_lot)
        self.assertIsNotNone(r.stop_distance)

    def test_score_bounds(self):
        for candles in (make_trend(up=True), make_trend(up=False), make_range()):
            r = analyze("USD/JPY", candles, HEALTHY, calendar=NO_EVENTS)
            self.assertGreaterEqual(r.signal_score, 0.0)
            self.assertLessEqual(r.signal_score, 100.0)

    def test_output_serializable(self):
        r = analyze("USD/JPY", make_trend(up=True), HEALTHY, calendar=NO_EVENTS)
        d = r.to_dict()
        self.assertIn("disclaimer", d)
        self.assertIn("reasoning", d)
        self.assertIsInstance(d["reasoning"], list)
        # 根拠ログが空でない
        self.assertGreater(len(d["reasoning"]), 0)

    def test_disclaimer_present(self):
        r = analyze("USD/JPY", make_range(), HEALTHY, calendar=NO_EVENTS)
        self.assertIn("投資助言ではありません", r.disclaimer)
        self.assertIn("保証", r.disclaimer)


if __name__ == "__main__":
    unittest.main(verbosity=2)

import { useState } from 'react'
import { Shield, ChevronDown, ChevronUp, CheckCircle2, MinusCircle } from 'lucide-react'
import { ENGINE_SIGNALS, REGIME_CONFIG, REC_CONFIG } from '../data/mockData'

function SignalCard({ sig }) {
  const [open, setOpen] = useState(false)
  const regime = REGIME_CONFIG[sig.regime]
  const rec = REC_CONFIG[sig.recommendation]
  const scorePct = Math.min(100, sig.signal_score)
  const thresholdPct = sig.score_threshold

  return (
    <div className="card overflow-hidden">
      <div className="p-4 space-y-3">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-800">{sig.pair}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${regime.bg} ${regime.color} ${regime.border}`}>
              {regime.icon} {regime.label}
            </span>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${rec.bg} ${rec.color}`}>
            {rec.label}
          </span>
        </div>

        {/* シグナルスコア（閾値ライン付き） */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500">シグナルスコア</span>
            <span className="font-semibold text-gray-700">{sig.signal_score} / 100</span>
          </div>
          <div className="relative h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${sig.signal_score >= thresholdPct ? 'bg-emerald-500' : 'bg-gray-400'}`}
              style={{ width: `${scorePct}%` }}
            />
            {/* 閾値ライン */}
            <div
              className="absolute top-0 h-full w-0.5 bg-gray-700"
              style={{ left: `${thresholdPct}%` }}
              title={`閾値 ${thresholdPct}`}
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5">縦線=エントリー閾値（{thresholdPct}）</p>
        </div>

        {/* リスクスコア + 実行可否 */}
        <div className="flex gap-2">
          <div className="flex-1 bg-gray-50 rounded-xl p-2.5">
            <p className="text-[10px] text-gray-400 mb-0.5">リスクスコア</p>
            <p className={`text-lg font-bold ${sig.risk_score >= 60 ? 'text-red-500' : sig.risk_score >= 30 ? 'text-amber-500' : 'text-emerald-600'}`}>
              {sig.risk_score}
            </p>
          </div>
          <div className="flex-1 bg-gray-50 rounded-xl p-2.5 flex flex-col justify-center">
            <p className="text-[10px] text-gray-400 mb-0.5">発注可否（参考）</p>
            <div className="flex items-center gap-1">
              {sig.executable ? (
                <>
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  <span className="text-sm font-bold text-emerald-600">候補あり</span>
                </>
              ) : (
                <>
                  <MinusCircle size={16} className="text-gray-400" />
                  <span className="text-sm font-bold text-gray-500">見送り</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 環境ノート */}
        <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2">{sig.regime_note}</p>

        {/* 推奨ロット（発注可のときのみ） */}
        {sig.executable && sig.suggested_lot && (
          <div className="flex items-center justify-between text-xs px-1">
            <span className="text-gray-500">参考ロット（リスク1%・ATRストップ）</span>
            <span className="font-bold text-gray-700">{sig.suggested_lot.toLocaleString()} 通貨</span>
          </div>
        )}

        {/* 根拠ログ */}
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 text-xs text-blue-600 font-medium w-full justify-center pt-1"
        >
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          判定の根拠ログを{open ? '閉じる' : '見る'}
        </button>

        {open && (
          <div className="space-y-2 bg-gray-50 rounded-xl p-3">
            {sig.reasoning.map((r, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-700">{r.factor}</p>
                  <p className="text-[11px] text-gray-500">{r.detail}</p>
                </div>
                {r.weight > 0 && (
                  <span className="text-xs font-bold text-emerald-600 shrink-0">+{r.weight}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function EnginePage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-4">
          <h1 className="text-lg font-bold text-gray-900">意思決定支援エンジン</h1>
          <p className="text-xs text-gray-400">市場環境 → 戦略 → スコア → リスク判定</p>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-5 space-y-4">
        {/* 説明バナー */}
        <div className="bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl p-4 text-white">
          <div className="flex items-center gap-2 mb-1">
            <Shield size={16} />
            <p className="text-sm font-bold">資金保全を最優先する判定</p>
          </div>
          <p className="text-xs opacity-75 leading-relaxed">
            利益期待値を狙いつつ、リスク制約（日次損失上限・連敗停止・最大保有数）を
            ハード条件として最優先します。スコアが高くても危険なら「見送り」になります。
          </p>
        </div>

        {/* シグナルカード */}
        {ENGINE_SIGNALS.map((sig) => (
          <SignalCard key={sig.pair} sig={sig} />
        ))}

        {/* 免責 */}
        <div className="card p-3 bg-amber-50 border border-amber-200">
          <p className="text-xs text-amber-700 leading-relaxed">
            ⚠️ 本エンジンの出力は参考情報であり、投資助言ではありません。利益を保証するものではなく、
            自動発注は行いません（Phase 1）。最終的な売買判断はご自身の責任で行ってください。
          </p>
        </div>
      </main>
    </div>
  )
}

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import PredictionBadge from './PredictionBadge'
import MiniChart from './MiniChart'
import TradeModal from './TradeModal'
import { PREDICTION_CONFIG } from '../data/mockData'

export default function RateCard({ data }) {
  const [expanded, setExpanded] = useState(false)
  const [modal, setModal] = useState(null) // 'buy' | 'sell' | null

  const { pair, rate, change, changePct, prediction, confidence, reasons, chartData } = data
  const isUp = changePct > 0
  const changeColor = changePct > 0 ? 'text-emerald-600' : changePct < 0 ? 'text-red-500' : 'text-gray-500'
  const cfg = PREDICTION_CONFIG[prediction]

  return (
    <>
      <div className="card overflow-hidden">
        {/* 予測カラーバー */}
        <div className={`h-1 ${cfg.badgeBg}`} />

        <div className="p-4 space-y-3">
          {/* レートヘッダー */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 tracking-wider">{pair}</p>
              <p className="text-3xl font-bold text-gray-900 mt-0.5">{rate.toFixed(3)}</p>
              <p className={`text-sm font-medium mt-0.5 ${changeColor}`}>
                {isUp ? '+' : ''}{change.toFixed(2)} ({isUp ? '+' : ''}{changePct.toFixed(2)}%)
              </p>
            </div>
            <PredictionBadge prediction={prediction} confidence={confidence} />
          </div>

          {/* ミニチャート */}
          <MiniChart chartData={chartData} prediction={prediction} id={data.id} />

          {/* 売買ボタン */}
          <div className="flex gap-3">
            <button
              onClick={() => setModal('buy')}
              className="btn-primary flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-sm"
            >
              買い
            </button>
            <button
              onClick={() => setModal('sell')}
              className="btn-primary flex-1 py-3 bg-red-500 hover:bg-red-600 text-white text-sm"
            >
              売り
            </button>
          </div>

          {/* 詳細展開 */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium w-full justify-center pt-1"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            AI予測の根拠を{expanded ? '閉じる' : '見る'}
          </button>

          {expanded && (
            <div className={`rounded-xl p-3 border ${cfg.bgColor} ${cfg.borderColor} space-y-2`}>
              <p className={`text-xs font-semibold ${cfg.textColor}`}>AIが判断した主な理由</p>
              {reasons.map((r, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <span className={`text-xs font-bold ${cfg.textColor} shrink-0`}>{i + 1}.</span>
                  <p className={`text-xs ${cfg.textColor} leading-relaxed`}>{r}</p>
                </div>
              ))}
              <p className="text-xs text-gray-400 pt-1 border-t border-gray-200 mt-2">
                ※AI予測は参考情報です。投資判断はご自身でお願いします。
              </p>
            </div>
          )}
        </div>
      </div>

      {modal && (
        <TradeModal
          pair={pair}
          rate={rate}
          tradeType={modal}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}

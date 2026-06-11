import { useState, useEffect } from 'react'
import { X, AlertTriangle, CheckCircle } from 'lucide-react'
import { DISCLAIMER } from '../data/mockData'

export default function TradeModal({ pair, rate, tradeType, onClose }) {
  const [units, setUnits] = useState(1000)
  const [confirmed, setConfirmed] = useState(false)
  const [countdown, setCountdown] = useState(3)

  const isBuy = tradeType === 'buy'
  const cost = (units * rate).toLocaleString('ja-JP', { maximumFractionDigits: 0 })

  // 確認後のカウントダウン自動クローズ
  useEffect(() => {
    if (!confirmed) return
    if (countdown <= 0) { onClose(); return }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [confirmed, countdown, onClose])

  function handleConfirm() {
    setConfirmed(true)
  }

  if (confirmed) {
    return (
      <ModalWrapper onClose={onClose}>
        <div className="flex flex-col items-center gap-4 py-6">
          <CheckCircle size={56} className="text-emerald-500" />
          <p className="text-lg font-bold text-gray-800">注文を受け付けました</p>
          <p className="text-sm text-gray-500">※デモ取引のため実際の売買は行われません</p>

          {/* 自動クローズのカウントダウン表示 */}
          <p className="text-xs text-gray-400">{countdown}秒後に自動で閉じます</p>

          {/* 手動で即閉じるボタン */}
          <button
            onClick={onClose}
            className="btn-primary w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm"
          >
            閉じる
          </button>
        </div>
      </ModalWrapper>
    )
  }

  return (
    <ModalWrapper onClose={onClose}>
      <div className="space-y-5">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            {pair} {isBuy ? '買い' : '売り'}注文
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* レート表示 */}
        <div className={`p-4 rounded-xl ${isBuy ? 'bg-emerald-50' : 'bg-red-50'}`}>
          <p className="text-xs text-gray-500 mb-1">現在のレート</p>
          <p className={`text-2xl font-bold ${isBuy ? 'text-emerald-700' : 'text-red-700'}`}>
            {rate.toFixed(3)}
          </p>
        </div>

        {/* 数量選択 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">取引数量（通貨単位）</label>
          <div className="flex gap-2">
            {[1000, 5000, 10000].map((u) => (
              <button
                key={u}
                onClick={() => setUnits(u)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors
                  ${units === u
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                  }`}
              >
                {u.toLocaleString()}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            概算コスト：約 <span className="font-semibold text-gray-800">¥{cost}</span>
          </p>
        </div>

        {/* 免責事項 */}
        <div className="flex gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200">
          <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">{DISCLAIMER}</p>
        </div>

        {/* 注文確定ボタン */}
        <button
          onClick={handleConfirm}
          className={`btn-primary w-full py-4 text-white text-base
            ${isBuy ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}
        >
          {isBuy ? '買い注文を確定する' : '売り注文を確定する'}
        </button>

        {/* ← キャンセルボタンを追加 */}
        <button
          onClick={onClose}
          className="btn-primary w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm"
        >
          キャンセル（やめる）
        </button>

        <p className="text-center text-xs text-gray-400">※これはデモアプリです</p>
      </div>
    </ModalWrapper>
  )
}

function ModalWrapper({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl">
        {children}
      </div>
    </div>
  )
}

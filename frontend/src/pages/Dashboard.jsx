import { RefreshCw, Bell } from 'lucide-react'
import { useState } from 'react'
import RateCard from '../components/RateCard'
import PortfolioSummary from '../components/PortfolioSummary'
import { CURRENCY_PAIRS } from '../data/mockData'

export default function Dashboard() {
  const [lastUpdated] = useState(new Date().toLocaleTimeString('ja-JP'))
  const [refreshing, setRefreshing] = useState(false)

  function handleRefresh() {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1000)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">AI為替トレード</h1>
            <p className="text-xs text-gray-400">更新: {lastUpdated}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <RefreshCw
                size={18}
                className={`text-gray-500 ${refreshing ? 'animate-spin' : ''}`}
              />
            </button>
            <button className="p-2 rounded-xl hover:bg-gray-100 transition-colors relative">
              <Bell size={18} className="text-gray-500" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-5 space-y-4">
        {/* 初心者向けウェルカムバナー */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-4 text-white">
          <p className="text-xs font-medium opacity-80 mb-1">AIがあなたの投資をサポート</p>
          <p className="text-base font-bold">今日の為替予測が出ました 📊</p>
          <p className="text-xs opacity-75 mt-1">色とアイコンで上昇・下落が一目でわかります</p>
        </div>

        {/* デモ口座サマリー */}
        <PortfolioSummary />

        {/* 通貨ペアカード一覧 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-700">為替ペア</h2>
            <span className="text-xs text-gray-400">AIスコア付き</span>
          </div>
          <div className="space-y-4">
            {CURRENCY_PAIRS.map((pair) => (
              <RateCard key={pair.id} data={pair} />
            ))}
          </div>
        </section>

        {/* 学習コンテンツへの誘導 */}
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-xl shrink-0">
            📚
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800">為替の基礎を学ぼう</p>
            <p className="text-xs text-gray-500 mt-0.5">5分でわかる為替入門</p>
          </div>
          <span className="text-xs text-blue-600 font-medium shrink-0">→ 見る</span>
        </div>

        {/* 免責事項フッター */}
        <p className="text-xs text-gray-400 leading-relaxed text-center px-2">
          本アプリのAI予測は参考情報であり、投資助言ではありません。
          為替取引にはリスクが伴います。
        </p>
      </main>
    </div>
  )
}

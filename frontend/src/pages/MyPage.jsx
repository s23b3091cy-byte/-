import { PORTFOLIO, CURRENCY_PAIRS } from '../data/mockData'

const STATS = [
  { label: '総取引回数', value: '12回' },
  { label: '勝率', value: '58%' },
  { label: '今月の損益', value: '+¥1,320', positive: true },
  { label: '最大利益', value: '+¥2,450', positive: true },
]

export default function MyPage() {
  const { balance, positions } = PORTFOLIO

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-4">
          <h1 className="text-lg font-bold text-gray-900">マイページ</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-5 space-y-4">
        {/* プロフィール */}
        <div className="card p-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
            U
          </div>
          <div>
            <p className="text-base font-bold text-gray-900">デモユーザー</p>
            <p className="text-xs text-gray-400">登録日：2026年5月27日</p>
            <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
              デモ口座
            </span>
          </div>
        </div>

        {/* 残高 */}
        <div className="card p-4">
          <p className="text-xs font-semibold text-gray-400 mb-1">デモ口座残高</p>
          <p className="text-3xl font-bold text-gray-900">¥{balance.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">※実際のお金ではありません</p>
        </div>

        {/* 統計 */}
        <div className="card p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">取引統計</p>
          <div className="grid grid-cols-2 gap-3">
            {STATS.map(({ label, value, positive }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <p className={`text-lg font-bold ${positive ? 'text-emerald-600' : 'text-gray-900'}`}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 保有ポジション */}
        <div className="card p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">保有中のポジション</p>
          {positions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">ポジションなし</p>
          ) : (
            positions.map((pos, i) => {
              const pnl = (pos.currentRate - pos.entryRate) * pos.units * (pos.type === 'buy' ? 1 : -1)
              const isProfit = pnl >= 0
              return (
                <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{pos.pair}</p>
                    <p className="text-xs text-gray-400">
                      {pos.type === 'buy' ? '買い' : '売り'} {pos.units.toLocaleString()}通貨
                      ・約定 {pos.entryRate}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${isProfit ? 'text-emerald-600' : 'text-red-500'}`}>
                      {isProfit ? '+' : ''}¥{Math.round(pnl).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">現在 {pos.currentRate}</p>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* 設定リスト */}
        <div className="card divide-y divide-gray-100">
          {[
            { emoji: '🔔', label: '通知設定' },
            { emoji: '📋', label: '取引履歴' },
            { emoji: '📖', label: '利用規約' },
            { emoji: '🛡️', label: 'プライバシーポリシー' },
          ].map(({ emoji, label }) => (
            <button
              key={label}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="text-lg">{emoji}</span>
              <span className="text-sm text-gray-700 flex-1">{label}</span>
              <span className="text-gray-300 text-sm">›</span>
            </button>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400">AI為替トレード v1.0.0（プロトタイプ）</p>
      </main>
    </div>
  )
}

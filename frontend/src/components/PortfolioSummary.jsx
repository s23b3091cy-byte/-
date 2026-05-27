import { Wallet, TrendingUp } from 'lucide-react'
import { PORTFOLIO } from '../data/mockData'

export default function PortfolioSummary() {
  const { balance, totalPnl } = PORTFOLIO
  const isProfit = totalPnl >= 0

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Wallet size={16} className="text-blue-600" />
        <h2 className="text-sm font-semibold text-gray-700">デモ口座残高</h2>
        <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">デモ</span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900">
            ¥{balance.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">証拠金残高</p>
        </div>
        <div className={`flex items-center gap-1 px-3 py-1.5 rounded-xl ${isProfit ? 'bg-emerald-50' : 'bg-red-50'}`}>
          <TrendingUp size={14} className={isProfit ? 'text-emerald-600' : 'text-red-500'} />
          <span className={`text-sm font-bold ${isProfit ? 'text-emerald-600' : 'text-red-500'}`}>
            {isProfit ? '+' : ''}¥{totalPnl.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}

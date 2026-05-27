import { useState } from 'react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'
import { CURRENCY_PAIRS, PREDICTION_CONFIG } from '../data/mockData'

function generateDetailChart(basePrice, days = 30, volatility = 0.4) {
  const result = []
  let price = basePrice - days * 0.05
  for (let i = days; i >= 0; i--) {
    price += (Math.random() - 0.48) * volatility
    const date = new Date()
    date.setDate(date.getDate() - i)
    result.push({
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      price: parseFloat(price.toFixed(3)),
    })
  }
  return result
}

export default function ChartPage() {
  const [selectedId, setSelectedId] = useState('usdjpy')
  const pair = CURRENCY_PAIRS.find((p) => p.id === selectedId)
  const cfg = PREDICTION_CONFIG[pair.prediction]
  const chartData = generateDetailChart(pair.rate, 30, 0.5)

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-4">
          <h1 className="text-lg font-bold text-gray-900">チャート</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-5 space-y-4">
        {/* 通貨ペア切替 */}
        <div className="flex gap-2">
          {CURRENCY_PAIRS.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors
                ${selectedId === p.id
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                }`}
            >
              {p.pair}
            </button>
          ))}
        </div>

        {/* レートヘッダー */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-gray-400 tracking-wider">{pair.pair}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bgColor} ${cfg.textColor}`}>
              {cfg.icon} {cfg.label}
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{pair.rate.toFixed(3)}</p>
          <p className={`text-sm font-medium mt-0.5 ${pair.changePct >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {pair.changePct >= 0 ? '+' : ''}{pair.change.toFixed(2)} ({pair.changePct >= 0 ? '+' : ''}{pair.changePct.toFixed(2)}%)
          </p>
        </div>

        {/* 30日チャート */}
        <div className="card p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">過去30日間</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={cfg.chartColor} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={cfg.chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                tickLine={false}
                interval={6}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                tickLine={false}
                domain={['auto', 'auto']}
              />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                formatter={(v) => [v.toFixed(3), pair.pair]}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke={cfg.chartColor}
                strokeWidth={2}
                fill="url(#chartFill)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: cfg.chartColor }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* テクニカル指標サマリー */}
        <div className="card p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-700">テクニカル指標（参考）</p>
          {[
            { label: 'RSI (14)', value: '62.4', note: '買われ気味', color: 'text-amber-600' },
            { label: 'MACD', value: '+0.12', note: '上昇シグナル', color: 'text-emerald-600' },
            { label: 'ボリンジャー', value: '上限付近', note: '過熱注意', color: 'text-red-500' },
          ].map(({ label, value, note, color }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <span className="text-sm text-gray-600">{label}</span>
              <div className="text-right">
                <span className={`text-sm font-semibold ${color}`}>{value}</span>
                <p className="text-xs text-gray-400">{note}</p>
              </div>
            </div>
          ))}
          <p className="text-xs text-gray-400">※モックデータです。実際の数値とは異なります。</p>
        </div>
      </main>
    </div>
  )
}

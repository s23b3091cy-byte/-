// 過去7日分のチャートデータ生成ヘルパー
function generateChartData(basePrice, volatility) {
  const days = ['5/21', '5/22', '5/23', '5/24', '5/25', '5/26', '5/27']
  let price = basePrice
  return days.map((date) => {
    price += (Math.random() - 0.5) * volatility
    return { date, price: parseFloat(price.toFixed(3)) }
  })
}

export const CURRENCY_PAIRS = [
  {
    id: 'usdjpy',
    pair: 'USD/JPY',
    base: 'USD',
    quote: 'JPY',
    rate: 156.82,
    change: +0.34,
    changePct: +0.22,
    prediction: 'rise',     // rise | fall | flat
    confidence: 78,
    reasons: [
      '米国雇用統計が予想を上回り、ドル買い優勢',
      'RSIが60を超え上昇モメンタム継続',
      'ボリンジャーバンド上限に向けた動き',
    ],
    chartData: generateChartData(156.2, 0.6),
  },
  {
    id: 'eurjpy',
    pair: 'EUR/JPY',
    base: 'EUR',
    quote: 'JPY',
    rate: 169.45,
    change: -0.21,
    changePct: -0.12,
    prediction: 'fall',
    confidence: 65,
    reasons: [
      'ECBの利下げ示唆でユーロ売り圧力',
      'MACDがデッドクロスを形成',
      '欧州景気減速懸念が重石',
    ],
    chartData: generateChartData(169.9, 0.7),
  },
  {
    id: 'gbpjpy',
    pair: 'GBP/JPY',
    base: 'GBP',
    quote: 'JPY',
    rate: 198.37,
    change: +0.05,
    changePct: +0.03,
    prediction: 'flat',
    confidence: 52,
    reasons: [
      '英国CPIが予想と一致し材料出尽くし',
      '方向感に乏しくレンジ相場の可能性',
      '主要サポート・レジスタンスの中間付近',
    ],
    chartData: generateChartData(198.2, 0.4),
  },
]

export const PREDICTION_CONFIG = {
  rise: {
    label: '上昇予測',
    icon: '↑',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    chartColor: '#16a34a',
    badgeBg: 'bg-emerald-500',
  },
  fall: {
    label: '下落予測',
    icon: '↓',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
    chartColor: '#dc2626',
    badgeBg: 'bg-red-500',
  },
  flat: {
    label: '横ばい予測',
    icon: '→',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-600',
    borderColor: 'border-gray-200',
    chartColor: '#6b7280',
    badgeBg: 'bg-gray-400',
  },
}

export const PORTFOLIO = {
  balance: 100000,
  positions: [
    { pair: 'USD/JPY', type: 'buy', units: 1000, entryRate: 155.50, currentRate: 156.82 },
  ],
  totalPnl: +1320,
}

export const DISCLAIMER =
  '本アプリのAI予測は参考情報であり、投資助言ではありません。為替取引にはリスクが伴い、元本を割り込む可能性があります。売買判断はご自身の責任で行ってください。'

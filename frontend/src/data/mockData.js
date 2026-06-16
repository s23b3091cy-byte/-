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

// ── 意思決定支援エンジン（Phase 1）の出力モック ─────────────────────
// backend/engine の analyze() が返すスキーマと同形。
// 実運用では GET /api/signal/{pair} に置き換える。
export const ENGINE_SIGNALS = [
  {
    pair: 'USD/JPY',
    regime: 'trend',
    direction: 'up',
    regime_note: 'ADXが明確なトレンド（上昇）を示しています。',
    recommendation: 'BUY',
    signal_score: 100,
    score_threshold: 60,
    risk_score: 0,
    executable: true,
    risk_flags: [],
    suggested_lot: 4368,
    reasoning: [
      { factor: 'ADXトレンド強度', detail: 'ADX=42（25超で明確なトレンド）', weight: 40 },
      { factor: '移動平均の方向一致', detail: 'SMA10 > SMA30（上昇方向に一致）', weight: 30 },
      { factor: 'ブレイクアウト', detail: '直近20本の高値を更新', weight: 30 },
    ],
  },
  {
    pair: 'EUR/JPY',
    regime: 'high_vol',
    direction: 'none',
    regime_note: 'ATRが高く、ポジションを縮小すべき局面です。',
    recommendation: 'HOLD',
    signal_score: 0,
    score_threshold: 60,
    risk_score: 35,
    executable: false,
    risk_flags: [],
    suggested_lot: null,
    reasoning: [
      { factor: '環境フィルタ', detail: '高ボラティリティ：原則見送り。建てる場合もサイズ縮小。', weight: 0 },
    ],
  },
  {
    pair: 'GBP/JPY',
    regime: 'range',
    direction: 'none',
    regime_note: '方向感が弱く、レンジ戦略が有効な局面です。',
    recommendation: 'HOLD',
    signal_score: 45,
    score_threshold: 60,
    risk_score: 10,
    executable: false,
    risk_flags: [],
    suggested_lot: null,
    reasoning: [
      { factor: 'ボリンジャー位置', detail: '%B=0.55（バンド中央付近で逆張り余地が小さい）', weight: 0 },
      { factor: '閾値判定', detail: 'スコア45が閾値60未満のため見送り。', weight: 0 },
    ],
  },
]

export const REGIME_CONFIG = {
  trend:    { label: 'トレンド',     icon: '📈', color: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-200' },
  range:    { label: 'レンジ',       icon: '↔️', color: 'text-blue-700',    bg: 'bg-blue-50',     border: 'border-blue-200' },
  high_vol: { label: '高ボラ',       icon: '⚡', color: 'text-amber-700',   bg: 'bg-amber-50',    border: 'border-amber-200' },
  event:    { label: 'イベント相場', icon: '📰', color: 'text-purple-700',  bg: 'bg-purple-50',   border: 'border-purple-200' },
}

export const REC_CONFIG = {
  BUY:  { label: '買い候補', color: 'text-white', bg: 'bg-emerald-500' },
  SELL: { label: '売り候補', color: 'text-white', bg: 'bg-red-500' },
  HOLD: { label: '見送り',   color: 'text-gray-600', bg: 'bg-gray-200' },
}

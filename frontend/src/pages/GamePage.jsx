import { useState, useEffect, useRef } from 'react'
import { Bot, RotateCcw } from 'lucide-react'

// ─── 定数 ─────────────────────────────────────────────────────
const ROUND_SECS  = 10
const TOTAL_ROUNDS = 5
const UNITS = 1000

const PAIRS = [
  { label: 'USD/JPY', base: 156.82, vol: 0.07 },
  { label: 'EUR/JPY', base: 169.45, vol: 0.08 },
  { label: 'GBP/JPY', base: 198.37, vol: 0.06 },
]

const CHOICE_LABEL = { buy: '買い ↑', sell: '売り ↓', pass: 'パス →' }
const AI_REASON = {
  buy:  'RSIとMACDが上昇シグナルを示しています',
  sell: 'ボリンジャーバンド上限突破で過熱感あり',
  pass: 'トレンドが不明瞭なため見送りました',
}

// ─── ヘルパー ──────────────────────────────────────────────────
function makePath(base, n, vol) {
  const arr = [base]
  for (let i = 1; i <= n; i++)
    arr.push(+(arr[i - 1] + (Math.random() - 0.49) * vol).toFixed(3))
  return arr
}

/** AI は 65% の確率で正解する */
function aiPick(path) {
  const up = path[path.length - 1] > path[0]
  return Math.random() < 0.65 ? (up ? 'buy' : 'sell') : (up ? 'sell' : 'buy')
}

function calcPnl(choice, open, close) {
  if (!choice || choice === 'pass') return 0
  return Math.round((choice === 'buy' ? close - open : open - close) * UNITS)
}

// ─── ミニスパークライン（SVG）──────────────────────────────────
function Sparkline({ prices, color }) {
  if (!prices || prices.length < 2) return <div className="h-14 bg-gray-50 rounded-xl" />
  const W = 300, H = 56
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const range = (max - min) || 0.001
  const pts = prices
    .map((p, i) => `${(i / (prices.length - 1)) * W},${H - ((p - min) / range) * (H - 12) - 6}`)
    .join(' ')
  return (
    <div className="bg-gray-50 rounded-xl overflow-hidden px-1 py-1">
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ height: H }}>
        <polyline
          points={pts}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

// ─── メインコンポーネント ──────────────────────────────────────
export default function GamePage() {
  // phase: 'idle' | 'playing' | 'result' | 'gameover'
  const [phase,      setPhase]      = useState('idle')
  const [round,      setRound]      = useState(1)
  const [tick,       setTick]       = useState(0)
  const [pair,       setPair]       = useState(null)
  const [prices,     setPrices]     = useState([])
  const [userChoice, setUserChoice] = useState(null)
  const [summary,    setSummary]    = useState(null)
  const [totals,     setTotals]     = useState({ user: 0, ai: 0 })
  const [history,    setHistory]    = useState([])

  // タイマークロージャ用 Ref
  const rUserChoice = useRef(null)
  const rAiChoice   = useRef(null)
  const rPrices     = useRef([])
  const rPair       = useRef(null)

  // ── ラウンド開始 ──────────────────────────────────────────
  function beginRound(r) {
    const p    = PAIRS[Math.floor(Math.random() * PAIRS.length)]
    const path = makePath(p.base, ROUND_SECS, p.vol)
    const ai   = aiPick(path)

    rPair.current       = p
    rPrices.current     = path
    rAiChoice.current   = ai
    rUserChoice.current = null

    setPair(p)
    setPrices([path[0]])
    setUserChoice(null)
    setTick(0)
    setRound(r)
    setPhase('playing')
  }

  function handleChoice(c) {
    rUserChoice.current = c
    setUserChoice(c)
  }

  // ── タイマー（1秒ごとに価格を1点追加）─────────────────────
  useEffect(() => {
    if (phase !== 'playing') return
    const id = setInterval(() => {
      setTick(t => {
        const next = t + 1
        setPrices(rPrices.current.slice(0, next + 1))
        return next
      })
    }, 1000)
    return () => clearInterval(id)
  }, [phase, round])

  // ── タイム終了を検知 ──────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing' || tick < ROUND_SECS) return

    const path  = rPrices.current
    const open  = path[0]
    const close = path[path.length - 1]
    const uc    = rUserChoice.current || 'pass'
    const ac    = rAiChoice.current

    const userPnl = calcPnl(uc, open, close)
    const aiPnl   = calcPnl(ac, open, close)

    setTotals(prev => ({ user: prev.user + userPnl, ai: prev.ai + aiPnl }))
    setSummary({ userPnl, aiPnl, aiChoice: ac, userChoice: uc, open, close, pair: rPair.current })
    setHistory(prev => [...prev, { round, userPnl, aiPnl, pair: rPair.current.label }])
    setPhase('result')
  }, [tick, phase])

  function nextRound() {
    if (round >= TOTAL_ROUNDS) { setPhase('gameover'); return }
    beginRound(round + 1)
  }

  function resetGame() {
    setRound(1)
    setTotals({ user: 0, ai: 0 })
    setHistory([])
    setSummary(null)
    setPhase('idle')
  }

  const currentPrice = prices[prices.length - 1]
  const priceColor = pair && currentPrice
    ? currentPrice >= pair.base ? '#16a34a' : '#dc2626'
    : '#6b7280'

  // ══════════════════════════════════════════
  //  IDLE
  // ══════════════════════════════════════════
  if (phase === 'idle') return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header title="AIと対決" />
      <main className="max-w-md mx-auto px-4 py-5 space-y-4">

        <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl p-6 text-white text-center">
          <div className="text-5xl mb-3">⚔️</div>
          <p className="text-xl font-bold mb-1">AIと為替予測対決！</p>
          <p className="text-sm opacity-80">あなた vs AI、どちらが稼げる？</p>
        </div>

        <div className="card p-4 space-y-2">
          <p className="text-sm font-bold text-gray-700 mb-1">ルール</p>
          {[
            `全${TOTAL_ROUNDS}ラウンド制（各${ROUND_SECS}秒）`,
            '各ラウンドで「買い・売り・パス」を選択',
            `${UNITS.toLocaleString()}通貨単位で自動計算`,
            'AIも同時に予測。累計で多く稼いだ方の勝ち！',
            '※デモゲーム。実際の取引は行われません',
          ].map((r, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="text-violet-500 font-bold text-xs shrink-0 mt-0.5">{i + 1}.</span>
              <p className="text-sm text-gray-600">{r}</p>
            </div>
          ))}
        </div>

        <button
          onClick={() => beginRound(1)}
          className="btn-primary w-full py-4 bg-violet-600 hover:bg-violet-700 text-white text-base"
        >
          ゲームスタート 🚀
        </button>
      </main>
    </div>
  )

  // ══════════════════════════════════════════
  //  PLAYING
  // ══════════════════════════════════════════
  if (phase === 'playing') {
    const remain      = ROUND_SECS - tick
    const barWidth    = (remain / ROUND_SECS) * 100
    const timerColor  = remain <= 3 ? 'bg-red-500' : remain <= 6 ? 'bg-amber-400' : 'bg-violet-500'
    const priceDiff   = currentPrice != null && pair ? currentPrice - pair.base : 0

    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        {/* スティッキーヘッダー（スコア + タイマー） */}
        <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
          <div className="max-w-md mx-auto px-4 py-3">
            {/* スコア行 */}
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-gray-600">ラウンド {round} / {TOTAL_ROUNDS}</p>
              <div className="flex gap-3 text-sm">
                <span className="font-bold text-blue-600">
                  あなた {totals.user >= 0 ? '+' : ''}¥{totals.user.toLocaleString()}
                </span>
                <span className="text-gray-300">|</span>
                <span className="font-bold text-violet-600">
                  AI {totals.ai >= 0 ? '+' : ''}¥{totals.ai.toLocaleString()}
                </span>
              </div>
            </div>
            {/* タイマーバー */}
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${timerColor} rounded-full transition-all duration-1000`}
                style={{ width: `${barWidth}%` }}
              />
            </div>
            <p className={`text-right text-xs mt-0.5 font-mono font-bold
              ${remain <= 3 ? 'text-red-500 animate-pulse' : 'text-gray-400'}`}
            >
              残り {remain} 秒
            </p>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 py-4 space-y-4">
          {/* 価格カード */}
          <div className="card p-4">
            <p className="text-xs font-semibold text-gray-400 tracking-wider mb-1">{pair?.label}</p>
            <p className="text-3xl font-bold" style={{ color: priceColor }}>
              {currentPrice?.toFixed(3) ?? '---'}
            </p>
            <p className={`text-sm font-medium mt-0.5 ${priceDiff >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {priceDiff >= 0 ? '+' : ''}{priceDiff.toFixed(3)}
            </p>
            <div className="mt-3">
              <Sparkline prices={prices} color={priceColor} />
            </div>
          </div>

          {/* AI 予測中 */}
          <div className="card p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
              <Bot size={16} className="text-violet-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-gray-700">AI は予測中...</p>
              <p className="text-xs text-gray-400">AIの判断は終了後に公開されます</p>
            </div>
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-violet-400 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>

          {/* 選択ボタン */}
          <div className="space-y-3">
            <p className="text-sm font-bold text-gray-700 text-center">
              {userChoice ? '選択を変更できます' : '予測を選んでください'}
            </p>
            <div className="flex gap-2">
              {[
                { id: 'buy',  label: '買い ↑', active: 'bg-emerald-500 text-white border-emerald-500 shadow-lg', idle: 'bg-white text-emerald-600 border-emerald-300 hover:bg-emerald-50' },
                { id: 'sell', label: '売り ↓', active: 'bg-red-500 text-white border-red-500 shadow-lg',         idle: 'bg-white text-red-500 border-red-300 hover:bg-red-50' },
                { id: 'pass', label: 'パス →',  active: 'bg-gray-600 text-white border-gray-600 shadow-lg',       idle: 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50' },
              ].map(({ id, label, active, idle }) => (
                <button
                  key={id}
                  onClick={() => handleChoice(id)}
                  className={`flex-1 py-4 rounded-xl border-2 text-sm font-bold
                    transition-all duration-150 active:scale-95
                    ${userChoice === id ? active : idle}`}
                >
                  {label}
                </button>
              ))}
            </div>
            {userChoice && (
              <p className="text-center text-xs text-gray-400">
                現在の選択：<span className="font-semibold text-gray-600">{CHOICE_LABEL[userChoice]}</span>
              </p>
            )}
          </div>
        </main>
      </div>
    )
  }

  // ══════════════════════════════════════════
  //  RESULT（ラウンド結果）
  // ══════════════════════════════════════════
  if (phase === 'result' && summary) {
    const { userPnl, aiPnl, aiChoice, userChoice: uc, open, close } = summary
    const userWon  = userPnl > aiPnl
    const tied     = userPnl === aiPnl
    const priceDiff = close - open
    const priceUp   = priceDiff > 0

    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <Header title={`ラウンド ${round} 結果`} />
        <main className="max-w-md mx-auto px-4 py-4 space-y-4">

          {/* ラウンド勝敗 */}
          <div className={`card p-5 text-center border-2 ${
            userWon ? 'bg-emerald-50 border-emerald-300'
            : tied  ? 'bg-gray-50 border-gray-200'
                    : 'bg-red-50 border-red-300'
          }`}>
            <p className="text-4xl mb-2">{userWon ? '🎉' : tied ? '🤝' : '🤖'}</p>
            <p className={`text-xl font-bold ${
              userWon ? 'text-emerald-700' : tied ? 'text-gray-700' : 'text-red-600'
            }`}>
              {userWon ? 'このラウンドはあなたの勝ち！' : tied ? '引き分け！' : 'このラウンドはAIの勝ち...'}
            </p>
          </div>

          {/* 価格変動 */}
          <div className="card p-4">
            <p className="text-xs font-semibold text-gray-400 mb-3">{summary.pair.label} レート変動</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">開始</p>
                <p className="text-xl font-bold text-gray-800">{open.toFixed(3)}</p>
              </div>
              <div className="text-center">
                <p className={`text-3xl font-bold ${priceUp ? 'text-emerald-500' : 'text-red-500'}`}>
                  {priceUp ? '↑' : '↓'}
                </p>
                <p className={`text-xs font-bold ${priceUp ? 'text-emerald-600' : 'text-red-500'}`}>
                  {priceDiff >= 0 ? '+' : ''}{priceDiff.toFixed(3)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 mb-0.5">終了</p>
                <p className="text-xl font-bold text-gray-800">{close.toFixed(3)}</p>
              </div>
            </div>
          </div>

          {/* あなた vs AI */}
          <div className="card p-4 space-y-3">
            {[
              { label: 'あなた', choice: uc, pnl: userPnl, bg: 'bg-blue-50', avatarBg: 'bg-blue-500', avatarText: 'あ', isBot: false },
              { label: 'AI',    choice: aiChoice, pnl: aiPnl, bg: 'bg-violet-50', avatarBg: 'bg-violet-500', avatarText: '', isBot: true },
            ].map(({ label, choice, pnl, bg, avatarBg, avatarText, isBot }) => (
              <div key={label} className={`flex items-center justify-between p-3 ${bg} rounded-xl`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full ${avatarBg} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                    {isBot ? <Bot size={16} /> : avatarText}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{label}</p>
                    <p className="text-xs text-gray-500">{CHOICE_LABEL[choice]}</p>
                  </div>
                </div>
                <p className={`text-xl font-bold ${pnl > 0 ? 'text-emerald-600' : pnl < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                  {pnl > 0 ? '+' : ''}¥{pnl.toLocaleString()}
                </p>
              </div>
            ))}
            <p className="text-xs text-gray-400 text-center pt-1">
              AI の根拠：{AI_REASON[aiChoice]}
            </p>
          </div>

          {/* 累計スコア */}
          <div className="card p-4">
            <p className="text-xs font-semibold text-gray-500 mb-3">現在の累計スコア</p>
            <div className="flex gap-3">
              <ScoreBox label="あなた" value={totals.user} color="text-blue-600" />
              <div className="w-px bg-gray-200" />
              <ScoreBox label="AI" value={totals.ai} color="text-violet-600" />
            </div>
          </div>

          <button
            onClick={nextRound}
            className="btn-primary w-full py-4 bg-violet-600 hover:bg-violet-700 text-white text-base"
          >
            {round >= TOTAL_ROUNDS ? '🏆 最終結果を見る' : `ラウンド ${round + 1} へ →`}
          </button>
        </main>
      </div>
    )
  }

  // ══════════════════════════════════════════
  //  GAMEOVER（最終結果）
  // ══════════════════════════════════════════
  if (phase === 'gameover') {
    const userWin = totals.user > totals.ai
    const tied    = totals.user === totals.ai
    const maxAbs  = Math.max(Math.abs(totals.user), Math.abs(totals.ai), 1)

    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <Header title="最終結果" />
        <main className="max-w-md mx-auto px-4 py-4 space-y-4">

          {/* 勝敗バナー */}
          <div className={`rounded-2xl p-6 text-center text-white ${
            userWin ? 'bg-gradient-to-br from-amber-400 to-yellow-500'
            : tied  ? 'bg-gradient-to-br from-gray-400 to-gray-500'
                    : 'bg-gradient-to-br from-violet-600 to-indigo-700'
          }`}>
            <p className="text-6xl mb-3">{userWin ? '🏆' : tied ? '🤝' : '🤖'}</p>
            <p className="text-2xl font-bold mb-1">
              {userWin ? 'あなたの勝利！' : tied ? '引き分け！' : 'AIの勝利！'}
            </p>
            <p className="text-sm opacity-80">
              {userWin ? 'おめでとう！AIに勝ちました！'
               : tied  ? 'AIと全く同じ成績です！'
                       : 'またリベンジしましょう！'}
            </p>
          </div>

          {/* スコアバー */}
          <div className="card p-4 space-y-4">
            <p className="text-sm font-bold text-gray-700">最終スコア比較</p>
            {[
              { label: 'あなた', value: totals.user, color: 'bg-blue-500' },
              { label: 'AI',    value: totals.ai,   color: 'bg-violet-500' },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-sm font-semibold text-gray-700">{label}</span>
                  <span className={`text-sm font-bold ${value >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {value >= 0 ? '+' : ''}¥{value.toLocaleString()}
                  </span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${color} rounded-full`}
                    style={{ width: `${(Math.abs(value) / maxAbs) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* ラウンド履歴 */}
          <div className="card p-4">
            <p className="text-sm font-bold text-gray-700 mb-3">ラウンド履歴</p>
            <div className="space-y-0">
              {history.map((h, i) => {
                const userWonRound = h.userPnl > h.aiPnl
                const tiedRound   = h.userPnl === h.aiPnl
                return (
                  <div key={i} className="flex items-center py-2.5 border-b border-gray-100 last:border-0 gap-2">
                    <span className="text-sm w-16 text-gray-500 shrink-0">R{i+1} {h.pair.split('/')[0]}</span>
                    <span className="text-xs shrink-0">{userWonRound ? '🎉' : tiedRound ? '🤝' : '🤖'}</span>
                    <div className="flex gap-3 ml-auto text-xs font-semibold">
                      <span className={h.userPnl >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                        あなた {h.userPnl >= 0 ? '+' : ''}¥{h.userPnl.toLocaleString()}
                      </span>
                      <span className={h.aiPnl >= 0 ? 'text-violet-600' : 'text-red-500'}>
                        AI {h.aiPnl >= 0 ? '+' : ''}¥{h.aiPnl.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <button
            onClick={resetGame}
            className="btn-primary w-full py-4 bg-violet-600 hover:bg-violet-700 text-white text-base"
          >
            <RotateCcw size={18} />
            もう一度プレイする
          </button>
        </main>
      </div>
    )
  }

  return null
}

// ─── 共通ヘッダー ──────────────────────────────────────────────
function Header({ title }) {
  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-md mx-auto px-4 py-4">
        <h1 className="text-lg font-bold text-gray-900">{title}</h1>
      </div>
    </header>
  )
}

// ─── スコアボックス ─────────────────────────────────────────────
function ScoreBox({ label, value, color }) {
  return (
    <div className="flex-1 text-center">
      <p className={`text-xs font-semibold ${color} mb-1`}>{label}</p>
      <p className={`text-2xl font-bold ${value >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
        {value >= 0 ? '+' : ''}¥{value.toLocaleString()}
      </p>
    </div>
  )
}

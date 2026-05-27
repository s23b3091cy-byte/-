import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

const LESSONS = [
  {
    id: 1,
    emoji: '💱',
    title: '為替レートってなに？',
    time: '3分',
    content: `為替レートとは、異なる国の通貨を交換するときの「交換比率」のことです。

たとえば「USD/JPY = 156円」とは、1ドルを156円で交換できるという意味です。

レートは24時間、世界中の銀行や投資家が売買するたびに変動しています。円高・円安という言葉をニュースで聞いたことがあるかもしれませんが、これは円の価値が上がった（円高）・下がった（円安）という状態を表しています。`,
  },
  {
    id: 2,
    emoji: '📈',
    title: '買い・売りの意味',
    time: '4分',
    content: `為替取引では「買い（ロング）」と「売り（ショート）」の2方向で取引できます。

■ 買い（ロング）
「これから円安になる（ドルが高くなる）」と予想したとき、ドルを買います。
例：156円で買って160円になったら4円の利益。

■ 売り（ショート）
「これから円高になる（ドルが安くなる）」と予想したとき、ドルを売ります。
例：156円で売って152円になったら4円の利益。

どちらの方向でも利益を狙える点が株と大きく違うところです。`,
  },
  {
    id: 3,
    emoji: '📊',
    title: 'AIはどうやって予測するの？',
    time: '5分',
    content: `このアプリのAIは、過去の為替データをもとに「パターン学習」をしています。

具体的には以下の指標を組み合わせて分析します：

• RSI（相対力指数）：買われすぎ・売られすぎを数値で表す
• MACD：トレンドの方向と強さを示す
• ボリンジャーバンド：価格の変動範囲を予測する

AIが「上昇」と予測しても、100%当たるわけではありません。信頼度スコアが高いほど過去データとの一致度が高いことを意味しますが、相場は常に不確実です。

AIの予測はあくまで「参考情報」として活用してください。`,
  },
  {
    id: 4,
    emoji: '⚠️',
    title: 'リスクと資金管理',
    time: '4分',
    content: `為替取引には必ずリスクが伴います。初心者がよく陥る失敗を知っておきましょう。

■ よくある失敗
• 一度に全額投入する → 少額から始めましょう
• 損失が出ても「いつか戻る」と信じて持ち続ける
• 感情的に取引する（焦り・欲）

■ 基本のルール
• 1回の取引は資金の2〜5%以内に抑える
• 損切りラインを事前に決めておく
• 余裕資金のみで取引する

このアプリはデモ取引なので、実際のお金を失うリスクなく練習できます。まずはデモで感覚をつかみましょう。`,
  },
]

function LessonCard({ lesson }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-4 flex items-center gap-3 text-left"
      >
        <span className="text-2xl">{lesson.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800">{lesson.title}</p>
          <p className="text-xs text-gray-400 mt-0.5">読了時間 約{lesson.time}</p>
        </div>
        {open ? (
          <ChevronUp size={18} className="text-gray-400 shrink-0" />
        ) : (
          <ChevronDown size={18} className="text-gray-400 shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line pt-3">
            {lesson.content}
          </p>
        </div>
      )}
    </div>
  )
}

export default function LearnPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-4">
          <h1 className="text-lg font-bold text-gray-900">学習</h1>
          <p className="text-xs text-gray-400">投資の基礎を5分で学ぼう</p>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-5 space-y-4">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-4 text-white">
          <p className="text-xs font-medium opacity-80 mb-1">初心者ガイド</p>
          <p className="text-base font-bold">為替トレードの基本を学ぼう</p>
          <p className="text-xs opacity-75 mt-1">タップして各レッスンを開く</p>
        </div>

        {LESSONS.map((lesson) => (
          <LessonCard key={lesson.id} lesson={lesson} />
        ))}

        <div className="card p-4 bg-amber-50 border border-amber-200">
          <p className="text-xs font-semibold text-amber-700 mb-1">⚠️ 重要な注意事項</p>
          <p className="text-xs text-amber-700 leading-relaxed">
            本アプリのコンテンツは教育目的のみです。投資助言ではありません。
            実際の取引は金融機関のサービスを利用し、ご自身の判断と責任で行ってください。
          </p>
        </div>
      </main>
    </div>
  )
}

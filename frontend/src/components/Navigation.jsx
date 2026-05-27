import { TrendingUp, LayoutDashboard, BookOpen, User } from 'lucide-react'

const NAV_ITEMS = [
  { id: 'home',  icon: LayoutDashboard, label: 'ホーム' },
  { id: 'chart', icon: TrendingUp,      label: 'チャート' },
  { id: 'learn', icon: BookOpen,        label: '学習' },
  { id: 'mypage',icon: User,            label: 'マイページ' },
]

export default function Navigation({ current, onChange }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
      <div className="max-w-md mx-auto flex">
        {NAV_ITEMS.map(({ id, icon: Icon, label }) => {
          const active = current === id
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors
                ${active ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              {label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

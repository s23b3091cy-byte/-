import { useState } from 'react'
import Dashboard   from './pages/Dashboard'
import ChartPage   from './pages/ChartPage'
import LearnPage   from './pages/LearnPage'
import EnginePage  from './pages/EnginePage'
import GamePage    from './pages/GamePage'
import MyPage      from './pages/MyPage'
import Navigation  from './components/Navigation'

export default function App() {
  const [page, setPage] = useState('home')

  const PAGES = {
    home:   <Dashboard onNavigate={setPage} />,
    chart:  <ChartPage />,
    engine: <EnginePage />,
    learn:  <LearnPage />,
    game:   <GamePage />,
    mypage: <MyPage />,
  }

  return (
    <>
      {PAGES[page] ?? PAGES.home}
      <Navigation current={page} onChange={setPage} />
    </>
  )
}

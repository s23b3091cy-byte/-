import { useState } from 'react'
import Dashboard from './pages/Dashboard'
import ChartPage from './pages/ChartPage'
import LearnPage from './pages/LearnPage'
import MyPage from './pages/MyPage'
import Navigation from './components/Navigation'

const PAGES = {
  home:   <Dashboard />,
  chart:  <ChartPage />,
  learn:  <LearnPage />,
  mypage: <MyPage />,
}

export default function App() {
  const [page, setPage] = useState('home')

  return (
    <>
      {PAGES[page]}
      <Navigation current={page} onChange={setPage} />
    </>
  )
}

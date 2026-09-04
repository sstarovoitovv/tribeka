import { Outlet, useLocation } from 'react-router-dom'
import Footer from './Footer.jsx'
import Header from './Header.jsx'
import MobileDashboard from './MobileDashboard.jsx'

export default function Layout() {
  const { pathname } = useLocation()

  return (
    <div className="min-h-screen bg-mist pb-[calc(62px+env(safe-area-inset-bottom))] text-ink min-[1000px]:pb-0">
      <Header />
      <main key={pathname} className="page-enter"><Outlet /></main>
      <Footer />
      <MobileDashboard />
    </div>
  )
}

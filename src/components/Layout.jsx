import { Outlet, useLocation } from 'react-router-dom'
import Footer from './Footer.jsx'
import Header from './Header.jsx'

export default function Layout() {
  const { pathname } = useLocation()

  return (
    <div className="min-h-screen bg-mist text-ink">
      <Header />
      <main key={pathname} className="page-enter"><Outlet /></main>
      <Footer />
    </div>
  )
}

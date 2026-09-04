import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    const titles = {
      '/': 'ТРИБЕКА — комплексная металлообработка',
      '/about': 'О компании — ТРИБЕКА',
      '/services': 'Услуги металлообработки — ТРИБЕКА',
      '/contacts': 'Контакты — ТРИБЕКА',
      '/privacy': 'Политика конфиденциальности — ТРИБЕКА',
    }
    document.title = pathname.startsWith('/services/')
      ? 'Примеры работ по услуге — ТРИБЕКА'
      : titles[pathname] || 'Страница не найдена — ТРИБЕКА'

    if (hash) {
      window.setTimeout(() => document.querySelector(hash)?.scrollIntoView(), 0)
      return
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])

  return null
}

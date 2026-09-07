import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { analyticsAllowed, privacySignalEnabled, setAnalyticsChoice, trackEvent } from '../analytics.js'

export default function Analytics() {
  const { pathname } = useLocation()
  const [enabled, setEnabled] = useState(false)
  const [privacySignal, setPrivacySignal] = useState(false)
  useEffect(() => {
    const update = () => { setEnabled(analyticsAllowed()); setPrivacySignal(privacySignalEnabled()) }
    update()
    window.addEventListener('tribeka:analytics-choice', update)
    window.addEventListener('storage', update)
    return () => {
      window.removeEventListener('tribeka:analytics-choice', update)
      window.removeEventListener('storage', update)
    }
  }, [])
  useEffect(() => { if (enabled) trackEvent('page_view') }, [pathname, enabled])
  useEffect(() => {
    function click(event) {
      const link = event.target.closest('a[href]')
      if (!link) return
      const url = new URL(link.href, window.location.origin)
      if (url.protocol === 'tel:') trackEvent('phone_click')
      else if (url.protocol === 'mailto:') trackEvent('email_click')
      else if (['t.me', 'wa.me', 'max.ru'].includes(url.hostname)) {
        trackEvent('messenger_click', { channel: { 't.me': 'telegram', 'wa.me': 'whatsapp', 'max.ru': 'max' }[url.hostname] })
      } else if (url.origin === window.location.origin && /^\/services\/[^/]+\/?$/.test(url.pathname)) {
        trackEvent('service_click', { service: url.pathname })
      }
    }
    document.addEventListener('click', click)
    return () => document.removeEventListener('click', click)
  }, [])
  return (
    <details className="mt-5 max-w-2xl text-xs leading-6 text-white/70">
      <summary className="w-fit cursor-pointer underline underline-offset-4">Настройки статистики: {enabled ? 'включена' : 'отключена'}</summary>
      <p className="mt-2">С вашего разрешения мы считаем обращения, переходы к услугам и каналам связи. Без cookies аналитики, профилей посетителей и содержимого заявок. Решение можно изменить здесь в любой момент.</p>
      {privacySignal ? <p>В браузере включён запрет отслеживания. Статистика отключена.</p> : (
        <button type="button" onClick={() => setAnalyticsChoice(!enabled)} className="mt-2 min-h-11 border border-white/30 px-4 py-2 font-bold hover:bg-white/10">
          {enabled ? 'Отключить статистику' : 'Разрешить статистику'}
        </button>
      )}
    </details>
  )
}

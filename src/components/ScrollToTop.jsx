import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

const useBrowserLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

export default function ScrollToTop() {
  const location = useLocation()
  const navigationType = useNavigationType()
  const positions = useRef(new Map())
  const catalogPosition = useRef({ top: 0, left: 0 })

  useEffect(() => {
    const previous = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'
    return () => { window.history.scrollRestoration = previous }
  }, [])

  useBrowserLayoutEffect(() => {
    const isCatalog = /^\/services\/?$/.test(location.pathname)
    const saved = navigationType === 'POP' && positions.current.get(location.key)
    const target = saved || (isCatalog && location.state?.restoreCatalog && catalogPosition.current)
    window.scrollTo({ ...(target || { top: 0, left: 0 }), behavior: 'instant' })

    if (location.hash && !saved) {
      document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'instant' })
    }
    if (isCatalog && location.state?.focusService) {
      document.getElementById(location.state.focusService)?.focus({ preventScroll: true })
    }

    // Record while this route is visible, before a shorter page clamps its scroll.
    const remember = () => {
      const point = { top: window.scrollY, left: window.scrollX }
      positions.current.set(location.key, point)
      if (isCatalog) catalogPosition.current = point
    }
    remember()
    window.addEventListener('scroll', remember, { passive: true })
    return () => window.removeEventListener('scroll', remember)
  }, [location, navigationType])

  return null
}

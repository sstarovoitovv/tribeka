import { getPrerenderSeoEntries, normalizePathname } from './seoConfig.js'

export const ANALYTICS_CHOICE_KEY = 'tribeka:analytics-consent:v1'
const paths = new Set(getPrerenderSeoEntries().map(({ path }) => path))
const events = new Set(['page_view', 'form_start', 'form_submit', 'phone_click', 'messenger_click', 'email_click', 'service_click'])
const sources = ['yandex', 'google', 'telegram', 'vk', 'whatsapp', 'email', 'direct']
const mediums = ['cpc', 'organic', 'social', 'referral', 'email', 'none']
let attribution

export function privacySignalEnabled() {
  return typeof navigator !== 'undefined' && (navigator.globalPrivacyControl === true || navigator.doNotTrack === '1')
}
export function analyticsAllowed() {
  if (typeof window === 'undefined' || privacySignalEnabled()) return false
  try { return localStorage.getItem(ANALYTICS_CHOICE_KEY) === 'yes' } catch { return false }
}
export function setAnalyticsChoice(enabled) {
  try { localStorage.setItem(ANALYTICS_CHOICE_KEY, enabled ? 'yes' : 'no') } catch { /* Storage disabled: remain opted out. */ }
  attribution = undefined
  window.dispatchEvent(new Event('tribeka:analytics-choice'))
}
export function safePath(pathname) {
  const path = normalizePathname(pathname)
  return paths.has(path) ? path : '/404/'
}
export function campaignAttribution(search, campaigns = []) {
  const query = new URLSearchParams(search)
  const bucket = (key, allowed, fallback) => {
    const value = query.get(key)
    return value ? (allowed.includes(value) ? value : 'other') : fallback
  }
  return {
    source: bucket('utm_source', sources, 'direct'),
    medium: bucket('utm_medium', mediums, 'none'),
    campaign: bucket('utm_campaign', campaigns, 'none'),
  }
}
export function trackEvent(event, details = {}) {
  if (!analyticsAllowed() || !events.has(event)) return
  // No form values, arbitrary URLs, referrers, identifiers or free-text UTM.
  const campaigns = (import.meta.env.VITE_ANALYTICS_CAMPAIGNS || '').split(',').filter(Boolean)
  attribution ||= campaignAttribution(window.location.search, campaigns)
  const payload = { event, path: safePath(window.location.pathname), ...attribution }
  if (event === 'messenger_click' && ['telegram', 'whatsapp', 'max'].includes(details.channel)) payload.channel = details.channel
  if (event === 'service_click') payload.service = safePath(details.service || '')
  fetch(import.meta.env.VITE_ANALYTICS_ENDPOINT || '/api/analytics.php', {
    method: 'POST', body: JSON.stringify(payload), credentials: 'omit', keepalive: true,
    referrerPolicy: 'no-referrer', headers: { 'Content-Type': 'application/json' },
  }).catch(() => {})
}

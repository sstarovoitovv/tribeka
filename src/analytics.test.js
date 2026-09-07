import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { analyticsAllowed, campaignAttribution, safePath, setAnalyticsChoice, trackEvent } from './analytics.js'
beforeEach(() => { localStorage.clear(); vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true })) })
afterEach(() => { vi.unstubAllGlobals() })
describe('private aggregate analytics', () => {
  it('does not send until explicit opt-in, and stops after withdrawal', () => {
    trackEvent('form_submit')
    expect(fetch).not.toHaveBeenCalled()
    setAnalyticsChoice(true)
    trackEvent('form_submit', { name: 'Must never be sent' })
    expect(fetch).toHaveBeenCalledOnce()
    expect(fetch.mock.calls[0][1].body).not.toContain('Must never')
    expect(fetch.mock.calls[0][1]).toMatchObject({ credentials: 'omit', referrerPolicy: 'no-referrer' })
    setAnalyticsChoice(false)
    trackEvent('form_submit')
    expect(fetch).toHaveBeenCalledOnce()
  })
  it('drops arbitrary URL and campaign data, retaining registered categories', () => {
    expect(safePath('/secret/person@example.com')).toBe('/404/')
    expect(safePath('/contacts/?phone=123')).toBe('/contacts/')
    expect(campaignAttribution('?utm_source=yandex&utm_medium=cpc&utm_campaign=person@example.com&utm_term=phone')).toEqual({ source: 'yandex', medium: 'cpc', campaign: 'other' })
    expect(campaignAttribution('?utm_campaign=summer', ['summer']).campaign).toBe('summer')
  })
  it('honours DNT even after consent', () => {
    setAnalyticsChoice(true)
    vi.stubGlobal('navigator', { doNotTrack: '1' })
    expect(analyticsAllowed()).toBe(false)
    trackEvent('form_submit')
    expect(fetch).not.toHaveBeenCalled()
  })
})

import { describe, expect, it } from 'vitest'
import { getPrerenderSeoEntries, getSeoMetadata, normalizePathname, SITE_URL } from './seoConfig.js'

describe('SEO configuration', () => {
  it('normalizes route variants to one canonical path', () => {
    expect(normalizePathname('/about')).toBe('/about/')
    expect(normalizePathname('/services/service-01/?source=test')).toBe('/services/service-01/')
    expect(normalizePathname('/')).toBe('/')
  })

  it('has unique metadata for every generated route', () => {
    const entries = getPrerenderSeoEntries()

    for (const field of ['path', 'title', 'description', 'canonical']) {
      expect(new Set(entries.map((entry) => entry[field])).size).toBe(entries.length)
    }

    entries.forEach((entry) => {
      expect(entry.canonical).toBe(`${SITE_URL}${entry.path}`)
      expect(entry.title.length).toBeLessThanOrEqual(70)
      expect(entry.description.length).toBeLessThanOrEqual(170)
    })
  })

  it('generates service-specific metadata and hides unfinished pages from indexing', () => {
    const metadata = getSeoMetadata('/services/service-01/')

    expect(metadata.title).toContain('Название услуги 01')
    expect(metadata.description).toContain('Название услуги 01')
    expect(metadata.robots).toBe('noindex,follow')
  })

  it('marks unknown routes as not indexable', () => {
    expect(getSeoMetadata('/missing-page/').robots).toBe('noindex,nofollow')
  })
})

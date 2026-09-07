// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { getPrerenderSeoEntries, renderPage } from './entry-server.jsx'

describe('complete static page rendering', () => {
  it.each(getPrerenderSeoEntries().map(({ path }) => [path]))('renders %s without a browser or client JavaScript', (path) => {
    const { markup, metadata, structuredData } = renderPage(path)
    expect(markup).toMatch(/<main[\s>]/u)
    expect(markup.match(/<h1[\s>]/gu)).toHaveLength(1)
    expect(markup).toContain('Мобильная навигация по разделам')
    expect(markup).toContain('href="/contacts/"')
    expect(metadata.path).toBe(path)
    expect(JSON.parse(structuredData)['@graph']).toEqual(expect.arrayContaining([
      expect.objectContaining({ '@type': 'Organization', legalName: 'ООО «ТРИБЕКА»' }),
    ]))
  })

  it('renders the actual content and functional link/form markup in the first HTML response', () => {
    expect(renderPage('/').markup).toContain('готового')
    expect(renderPage('/services/').markup).toContain('href="/services/service-08/"')
    expect(renderPage('/services/service-01/').markup).toContain('Примеры работ')
    const { markup } = renderPage('/contacts/')
    expect(markup).toContain('<form')
    expect(markup).toContain('name="phone"')
    expect(markup).toContain('name="privacy"')
  })

  it.each(['/404/', '/does-not-exist/', '/services/does-not-exist/'])('renders a real missing page for %s', (path) => {
    const { markup, metadata } = renderPage(path)
    expect(markup).toContain('Страница не найдена')
    expect(markup.match(/<main[^>]*>([\s\S]*?)<\/main>/)[1]).not.toContain('до готового')
    expect(metadata.robots).toBe('noindex,nofollow')
  })
})

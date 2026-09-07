import { Link, MemoryRouter } from 'react-router-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import SeoMetadata from './SeoMetadata.jsx'

describe('SeoMetadata', () => {
  it('updates title, description, canonical and social metadata for the current route', async () => {
    render(
      <MemoryRouter initialEntries={['/about/']}>
        <SeoMetadata />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(document.title).toBe('О компании ТРИБЕКА — металлообработка полного цикла')
    })

    expect(document.head.querySelector('meta[name="description"]')).toHaveAttribute('content', expect.stringContaining('Производственная компания'))
    expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'index,follow')
    expect(document.head.querySelector('link[rel="canonical"]')).toHaveAttribute('href', 'https://xn--80abmkm6an.xn--p1ai/about/')
    expect(document.head.querySelector('meta[property="og:url"]')).toHaveAttribute('content', 'https://xn--80abmkm6an.xn--p1ai/about/')
  })

  it('replaces JSON-LD when navigating without accumulating obsolete pages', async () => {
    render(
      <MemoryRouter initialEntries={['/about/']}>
        <SeoMetadata />
        <Link to="/contacts/">Контакты</Link>
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('link', { name: 'Контакты' }))
    await waitFor(() => expect(document.title).toContain('Контакты и заявка'))
    const scripts = document.head.querySelectorAll('script[data-seo-jsonld]')
    expect(scripts).toHaveLength(1)
    const data = JSON.parse(scripts[0].textContent)
    expect(data['@graph'].find((entry) => entry['@type'] === 'ContactPage').url).toBe('https://xn--80abmkm6an.xn--p1ai/contacts/')
    expect(data['@graph'].some((entry) => entry['@type'] === 'AboutPage')).toBe(false)
  })

})

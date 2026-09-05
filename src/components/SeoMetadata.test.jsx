import { MemoryRouter } from 'react-router-dom'
import { render, waitFor } from '@testing-library/react'
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
})

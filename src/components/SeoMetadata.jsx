import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getSeoMetadata, getStructuredData, serializeStructuredData } from '../seoConfig.js'

function setMeta(attribute, key, content) {
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.append(element)
  }
  element.setAttribute('content', content)
}

function setCanonical(href) {
  let element = document.head.querySelector('link[rel="canonical"]')
  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', 'canonical')
    document.head.append(element)
  }
  element.setAttribute('href', href)
}

export default function SeoMetadata() {
  const { pathname } = useLocation()

  useEffect(() => {
    const metadata = getSeoMetadata(pathname)

    let structuredData = document.head.querySelector('script[data-seo-jsonld]')
    if (!structuredData) {
      structuredData = document.createElement('script')
      structuredData.type = 'application/ld+json'
      structuredData.dataset.seoJsonld = ''
      document.head.append(structuredData)
    }
    structuredData.textContent = serializeStructuredData(getStructuredData(pathname))

    document.title = metadata.title
    setCanonical(metadata.canonical)
    setMeta('name', 'description', metadata.description)
    setMeta('name', 'robots', metadata.robots)
    setMeta('property', 'og:title', metadata.title)
    setMeta('property', 'og:description', metadata.description)
    setMeta('property', 'og:url', metadata.canonical)
    setMeta('property', 'og:image', metadata.image)
    setMeta('name', 'twitter:title', metadata.title)
    setMeta('name', 'twitter:description', metadata.description)
    setMeta('name', 'twitter:image', metadata.image)
  }, [pathname])

  return null
}

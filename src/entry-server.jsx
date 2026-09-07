/* eslint-disable react-refresh/only-export-components */
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import App from './App.jsx'
import { getPrerenderSeoEntries, getSeoMetadata, getStructuredData, serializeStructuredData, SITE_URL } from './seoConfig.js'
import { getServiceRedirects } from './serviceRoutes.js'

export { getPrerenderSeoEntries, getServiceRedirects, SITE_URL }

export function renderPage(pathname) {
  return {
    markup: renderToString(<StaticRouter location={pathname}><App /></StaticRouter>),
    metadata: getSeoMetadata(pathname),
    structuredData: serializeStructuredData(getStructuredData(pathname)),
  }
}

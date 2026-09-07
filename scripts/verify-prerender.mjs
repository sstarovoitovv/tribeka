import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'

const dist = new URL('../dist/', import.meta.url)
const { routes } = JSON.parse(await readFile(new URL('prerender-manifest.json', dist), 'utf8'))
const canonicalPaths = new Set(routes.filter(({ status }) => status === 200).map(({ path }) => path))
const indexableUrls = []
for (const route of routes) {
  const html = await readFile(new URL(route.file, dist), 'utf8')
  // No scripts are executed. The build must already contain real page content.
  const { document } = new JSDOM(html).window
  assert.equal(document.documentElement.lang, 'ru', route.path)
  assert.equal(document.querySelectorAll('h1').length, 1, `One H1: ${route.path}`)
  assert.ok(document.querySelector('main').textContent.trim().length > (route.status === 404 ? 20 : 35), `Content: ${route.path}`)
  assert.ok(document.querySelector('nav[aria-label="Мобильная навигация по разделам"]'), `Mobile menu: ${route.path}`)
  assert.equal(document.getElementById('root').dataset.ssgPath, route.path)
  assert.ok(document.querySelector('script[type="module"][src^="/assets/"]'), `Hydration bundle: ${route.path}`)
  const jsonld = JSON.parse(document.querySelector('script[data-seo-jsonld]').textContent)
  assert.ok(jsonld['@graph'].some((entry) => entry['@type'] === 'Organization'))
  assert.equal(document.querySelector('meta[name="robots"]').content.startsWith('index'), route.indexable)
  if (route.indexable) indexableUrls.push(document.querySelector('link[rel="canonical"]').href)
  if (route.status === 404) assert.match(document.querySelector('h1').textContent, /Страница не найдена/u)
  if (route.path === '/contacts/') assert.ok(document.querySelector('form input[name="phone"]'))
  for (const link of document.querySelectorAll('a[href^="/"]')) {
    const pathname = new URL(link.getAttribute('href'), 'https://example.org').pathname
    assert.ok(canonicalPaths.has(pathname), `Broken internal link ${pathname} on ${route.path}`)
  }
}
const sitemap = await readFile(new URL('sitemap.xml', dist), 'utf8')
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/gu)].map((match) => match[1])
assert.deepEqual(sitemapUrls.sort(), indexableUrls.sort(), 'Sitemap contains exactly the indexable canonical pages')
const analyticsPaths = JSON.parse(await readFile(new URL('api/_lib/analytics-routes.json', dist), 'utf8'))
assert.deepEqual(analyticsPaths, routes.map(({ path }) => path), 'Analytics allowlist matches the rendered routes')
process.stdout.write(`Verified ${routes.length} full static pages, navigation, JSON-LD, forms, sitemap and analytics paths in ${fileURLToPath(dist)}\n`)

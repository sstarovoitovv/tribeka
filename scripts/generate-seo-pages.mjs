import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getPrerenderSeoEntries, SITE_URL } from '../src/seoConfig.js'

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const distDirectory = join(projectRoot, 'dist')
const sourceHtml = await readFile(join(distDirectory, 'index.html'), 'utf8')
const entries = getPrerenderSeoEntries()

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function escapePattern(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')
}

function replaceOrInsert(html, pattern, replacement) {
  if (pattern.test(html)) return html.replace(pattern, replacement)
  return html.replace('</head>', `    ${replacement}\n  </head>`)
}

function setMeta(html, attribute, key, content) {
  const pattern = new RegExp(`<meta\\s+[^>]*${attribute}=["']${escapePattern(key)}["'][^>]*>`, 'iu')
  return replaceOrInsert(html, pattern, `<meta ${attribute}="${key}" content="${escapeHtml(content)}" />`)
}

function renderHtml(metadata) {
  let html = sourceHtml.replace(/<title>[^<]*<\/title>/iu, `<title>${escapeHtml(metadata.title)}</title>`)
  html = setMeta(html, 'name', 'description', metadata.description)
  html = setMeta(html, 'name', 'robots', metadata.robots)
  html = setMeta(html, 'property', 'og:title', metadata.title)
  html = setMeta(html, 'property', 'og:description', metadata.description)
  html = setMeta(html, 'property', 'og:url', metadata.canonical)
  html = setMeta(html, 'property', 'og:image', metadata.image)
  html = setMeta(html, 'name', 'twitter:title', metadata.title)
  html = setMeta(html, 'name', 'twitter:description', metadata.description)
  html = setMeta(html, 'name', 'twitter:image', metadata.image)

  const canonicalPattern = /<link\s+[^>]*rel=["']canonical["'][^>]*>/iu
  return replaceOrInsert(html, canonicalPattern, `<link rel="canonical" href="${escapeHtml(metadata.canonical)}" />`)
}

function assertUnique(field) {
  const values = entries.map((entry) => entry[field])
  if (new Set(values).size !== values.length) {
    throw new Error(`SEO field ${field} must be unique for every generated route.`)
  }
}

assertUnique('path')
assertUnique('title')
assertUnique('description')

for (const metadata of entries) {
  const relativeDirectory = metadata.path === '/' ? '' : metadata.path.slice(1, -1)
  const outputFile = join(distDirectory, relativeDirectory, 'index.html')
  await mkdir(dirname(outputFile), { recursive: true })
  await writeFile(outputFile, renderHtml(metadata), 'utf8')
}

const sitemapUrls = entries
  .filter(({ robots }) => robots.startsWith('index'))
  .map(({ canonical }) => `  <url><loc>${escapeHtml(canonical)}</loc></url>`)
  .join('\n')
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls}\n</urlset>\n`
const robots = `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`

await writeFile(join(distDirectory, 'sitemap.xml'), sitemap, 'utf8')
await writeFile(join(distDirectory, 'robots.txt'), robots, 'utf8')

process.stdout.write(`Generated SEO metadata for ${entries.length} routes.\n`)

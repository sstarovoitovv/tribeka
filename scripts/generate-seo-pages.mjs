import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'vite'

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const distDirectory = join(projectRoot, 'dist')
const sourceHtml = await readFile(join(distDirectory, 'index.html'), 'utf8')
const workDirectory = join(projectRoot, '.work')
await mkdir(workDirectory, { recursive: true })
const serverDirectory = await mkdtemp(join(workDirectory, 'ssg-'))

function escapeHtml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
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

function renderHtml({ metadata, markup, structuredData }) {
  if (!/<h1[\s>]/u.test(markup) || !/<main[\s>]/u.test(markup)) {
    throw new Error(`Incomplete prerendered content for ${metadata.path}`)
  }
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
  html = replaceOrInsert(html, /<link\s+[^>]*rel=["']canonical["'][^>]*>/iu, `<link rel="canonical" href="${escapeHtml(metadata.canonical)}" />`)
  html = html.replace('</head>', `    <script type="application/ld+json" data-seo-jsonld>${structuredData}</script>\n  </head>`)
  const rootPattern = /<div id="root">\s*<\/div>/u
  if (!rootPattern.test(html)) throw new Error('Expected an empty Vite root. Run npm run build before prerendering.')
  return html.replace(rootPattern, () => `<div id="root" data-ssg-path="${escapeHtml(metadata.path)}">${markup}</div>`)
}

async function insertRedirects(filename, marker, lines, redirects) {
  const target = join(distDirectory, filename)
  let contents
  try { contents = await readFile(target, 'utf8') } catch (error) {
    if (error.code === 'ENOENT' && !redirects.length) return
    throw error
  }
  if (redirects.length && !contents.includes(marker)) throw new Error(`Missing ${marker} in ${filename}`)
  await writeFile(target, contents.replace(marker, [marker, ...lines].join('\n')), 'utf8')
}

try {
  // Bundle the SAME React app with Vite's production env/JSX handling. This is
  // build-time rendering only: production still serves static files and PHP.
  await build({
    root: projectRoot,
    configFile: join(projectRoot, 'vite.config.js'),
    build: {
      ssr: join(projectRoot, 'src/entry-server.jsx'),
      outDir: serverDirectory,
      emptyOutDir: true,
      copyPublicDir: false,
      minify: false,
      rollupOptions: { output: { entryFileNames: 'entry-server.mjs' } },
    },
  })
  const { getPrerenderSeoEntries, getServiceRedirects, renderPage, SITE_URL } = await import(pathToFileURL(join(serverDirectory, 'entry-server.mjs')).href)
  const entries = getPrerenderSeoEntries()
  const redirects = getServiceRedirects()
  for (const field of ['path', 'title', 'description', 'canonical']) {
    if (new Set(entries.map((entry) => entry[field])).size !== entries.length) {
      throw new Error(`SEO field ${field} must be unique for every generated route.`)
    }
  }

  const routes = []
  for (const metadata of entries) {
    const relativeDirectory = metadata.path === '/' ? '' : metadata.path.slice(1, -1)
    const relativeFile = join(relativeDirectory, 'index.html')
    const outputFile = join(distDirectory, relativeFile)
    await mkdir(dirname(outputFile), { recursive: true })
    await writeFile(outputFile, renderHtml(renderPage(metadata.path)), 'utf8')
    routes.push({ path: metadata.path, file: relativeFile, status: 200, indexable: metadata.robots.startsWith('index') })
  }
  await writeFile(join(distDirectory, '404.html'), renderHtml(renderPage('/404/')), 'utf8')
  routes.push({ path: '/404/', file: '404.html', status: 404, indexable: false })

  const sitemapUrls = entries.filter(({ robots }) => robots.startsWith('index'))
    .map(({ canonical }) => `  <url><loc>${escapeHtml(canonical)}</loc></url>`).join('\n')
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls}\n</urlset>\n`
  const robots = `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`
  await writeFile(join(distDirectory, 'sitemap.xml'), sitemap, 'utf8')
  await writeFile(join(distDirectory, 'robots.txt'), robots, 'utf8')
  await mkdir(join(distDirectory, 'api/_lib'), { recursive: true })
  await writeFile(join(distDirectory, 'api/_lib/analytics-routes.json'), `${JSON.stringify([...entries.map(({ path }) => path), '/404/'], null, 2)}\n`, 'utf8')
  await writeFile(join(distDirectory, 'redirects.json'), `${JSON.stringify({ version: 1, redirects }, null, 2)}\n`, 'utf8')
  await writeFile(join(distDirectory, 'prerender-manifest.json'), `${JSON.stringify({ version: 1, routes }, null, 2)}\n`, 'utf8')

  await insertRedirects('.htaccess', '# GENERATED_SERVICE_REDIRECTS', redirects.map(({ from, to }) => (
    `RewriteRule ^${escapePattern(from.slice(1, -1))}/?$ ${to} [R=301,L,NE]`
  )), redirects)
  await insertRedirects('_redirects', '# GENERATED_SERVICE_REDIRECTS', redirects.flatMap(({ from, to, status }) => [
    `${from.slice(0, -1)} ${to} ${status}`,
    `${from} ${to} ${status}`,
  ]), redirects)
  process.stdout.write(`Prerendered ${entries.length} complete React pages and a static 404; ${redirects.length} legacy service redirects.\n`)
} finally {
  await rm(serverDirectory, { recursive: true, force: true })
}

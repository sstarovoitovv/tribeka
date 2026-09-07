// Production HTML preview with real status codes. PHP is tested separately and is never served as source.
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { resolve, extname, sep } from 'node:path'
const root = resolve('dist')
const types = { '.woff2': 'font/woff2', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp' }
const { redirects } = JSON.parse(await readFile(resolve(root, 'redirects.json'), 'utf8'))
createServer(async (request, response) => {
  let path
  try { path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname) } catch { response.writeHead(400).end(); return }
  if (path.startsWith('/api/') || path.split('/').some(part => part.startsWith('.'))) { response.writeHead(404).end(); return }
  const redirect = redirects.find(({ from }) => from.replace(/\/$/, '') === path.replace(/\/$/, ''))
  if (redirect) { response.writeHead(301, { Location: redirect.to }).end(); return }
  let file = resolve(root, '.' + path)
  if (file !== root && !file.startsWith(root + sep)) { response.writeHead(403).end(); return }
  try {
    if ((await stat(file)).isDirectory()) {
      if (!path.endsWith('/')) { response.writeHead(301, { Location: path + '/' }).end(); return }
      file = resolve(file, 'index.html')
    }
    if (!types[extname(file)]) { response.writeHead(404).end(); return }
    const body = await readFile(file)
    response.writeHead(path === '/404.html' ? 404 : 200, { 'Content-Type': types[extname(file)], 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' }).end(body)
  } catch {
    response.writeHead(404, { 'Content-Type': types['.html'], 'X-Robots-Tag': 'noindex' }).end(await readFile(resolve(root, '404.html')))
  }
}).listen(4173, '127.0.0.1', () => process.stdout.write('Tribeka preview: http://127.0.0.1:4173\n'))

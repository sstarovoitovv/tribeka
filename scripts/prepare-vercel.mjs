import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

// Build Output API gives previews actual 301/404 statuses and never serves PHP source.
const output = path.resolve('.vercel/output')
await rm(output, { recursive: true, force: true })
await mkdir(output, { recursive: true })
await cp('dist', `${output}/static`, { recursive: true })
for (const file of ['api', '.htaccess', '.user.ini', '_redirects', 'redirects.json']) {
  await rm(`${output}/static/${file}`, { recursive: true, force: true })
}
const apache = await readFile('public/.htaccess', 'utf8')
const headers = Object.fromEntries([...apache.matchAll(/^\s*Header always set ([\w-]+) "([^"]+)"/gm)].map((match) => [match[1], match[2]]))
// The Russian domain is the only indexing origin; Vercel is a review environment.
headers['X-Robots-Tag'] = 'noindex, nofollow'
const routes = [
  { src: '/(.*)', headers, continue: true },
  { src: '/(.*)', has: [{ type: 'host', value: 'www.xn--80abmkm6an.xn--p1ai' }], headers: { Location: 'https://xn--80abmkm6an.xn--p1ai/$1' }, status: 301 },
  { src: '/(?:api(?:/.*)?|\\.(?!well-known/).*)', dest: '/404.html', status: 404 },
]
const manifest = JSON.parse(await readFile('dist/redirects.json', 'utf8'))
const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
for (const redirect of manifest.redirects) {
  routes.push({ src: `${escape(redirect.from.replace(/\/$/, ''))}/?`, headers: { Location: redirect.to }, status: 301 })
}
async function addPages(directory, prefix = '') {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) await addPages(path.join(directory, entry.name), `${prefix}/${entry.name}`)
    if (entry.name !== 'index.html') continue
    if (prefix) routes.push({ src: escape(prefix), headers: { Location: `${prefix}/` }, status: 301 })
    routes.push({ src: `${escape(prefix)}/`, dest: `${prefix}/index.html` })
  }
}
await addPages(`${output}/static`)
routes.push({ handle: 'filesystem' }, { src: '/.*', dest: '/404.html', status: 404 })
await writeFile(`${output}/config.json`, `${JSON.stringify({ version: 3, routes }, null, 2)}\n`)
process.stdout.write(`Vercel: ${routes.length} routes, genuine 404, PHP excluded.\n`)

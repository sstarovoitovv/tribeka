import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir, userInfo } from 'node:os'
import path from 'node:path'
import { createServer } from 'node:net'
import { request as httpRequest } from 'node:http'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'

const binary = ['/usr/sbin/httpd', '/usr/sbin/apache2'].find(existsSync)
const modules = ['/usr/libexec/apache2', '/usr/lib/apache2/modules'].find(existsSync)
if (!binary || !modules) throw new Error('Apache is required: install apache2 (Ubuntu) or use macOS system httpd.')
const directory = await mkdtemp(path.join(tmpdir(), 'tribeka-apache-'))
const socket = createServer()
await new Promise((resolve) => socket.listen(0, '127.0.0.1', resolve))
const port = socket.address().port
await new Promise((resolve) => socket.close(resolve))
// macOS privacy restrictions prevent the system daemon reading Desktop directly.
const root = path.join(directory, 'public')
await cp(path.resolve('dist'), root, { recursive: true })
// Deliberately misplaced fixtures prove denied URLs cannot expose real files.
const privatePaths = ['/server/config.php', '/database/leads.sql', '/backups/leads.sql.gz', '/uploads/drawing.pdf', '/tribeka-private/config.php', '/src/App.jsx', '/tests/fixture.txt', '/docs/internal.html', '/node_modules/package/index.js', '/assets/.env', '/assets/bundle.js.map', '/config.php', '/api/request.php/extra', '/dump.sqlite', '/config.php.old', '/backup.sql.zip', '/.git/config']
for (const route of privatePaths) {
  const file = path.join(root, route)
  // PATH_INFO is checked against the real endpoint file.
  if (route === '/api/request.php/extra') continue
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, 'PRIVATE_FIXTURE_MUST_NOT_LEAK')
}
await mkdir(path.join(root, '.well-known/acme-challenge'), { recursive: true })
await writeFile(path.join(root, '.well-known/acme-challenge/fixture'), 'public-certificate-challenge')
const moduleNames = ['mpm_prefork', 'unixd', 'authz_core', 'authz_host', 'dir', 'mime', 'rewrite', 'headers']
const loads = moduleNames.filter((name) => existsSync(`${modules}/mod_${name}.so`)).map((name) => `LoadModule ${name}_module "${modules}/mod_${name}.so"`)
const mime = ['/etc/mime.types', '/etc/apache2/mime.types'].find(existsSync)
const config = `${loads.join('\n')}
ServerRoot "${directory}"
PidFile "${directory}/httpd.pid"
ErrorLog "${directory}/error.log"
Listen 127.0.0.1:${port}
ServerName localhost
User ${userInfo().username}
Group #${process.getgid()}
DocumentRoot "${root}"
TypesConfig "${mime}"
<Directory "${root}">
  AllowOverride All
  Require all granted
</Directory>
`
await writeFile(`${directory}/httpd.conf`, config)
const child = spawn(binary, ['-f', `${directory}/httpd.conf`, '-DFOREGROUND'], { detached: true, stdio: ['ignore', 'pipe', 'pipe'] })
let startup = ''
child.stderr.on('data', (chunk) => { startup += chunk })
try {
  let ready = false
  for (let attempt = 0; attempt < 40; attempt++) {
    try { await fetch(`http://127.0.0.1:${port}/`); ready = true; break } catch { await delay(100) }
  }
  if (!ready) throw new Error(`Apache failed to start: ${startup}\n${await readFile(`${directory}/error.log`, 'utf8').catch(() => '')}`)
  const request = (route, headers = {}) => new Promise((resolve, reject) => {
    const connection = httpRequest(`http://127.0.0.1:${port}${route}`, { headers }, (response) => {
      const chunks = []
      response.on('data', (chunk) => chunks.push(chunk))
      response.on('end', () => resolve(new Response(Buffer.concat(chunks), { status: response.statusCode, headers: response.headers })))
    })
    connection.on('error', reject)
    connection.end()
  })
  const home = await request('/')
  assert.equal(home.status, 200)
  assert.match(await home.text(), /<h1[\s>]/)
  for (const name of ['content-security-policy', 'strict-transport-security', 'permissions-policy', 'referrer-policy', 'x-frame-options']) assert.ok(home.headers.has(name), name)
  assert.equal(home.headers.get('x-content-type-options'), 'nosniff')
  assert.match(home.headers.get('cache-control'), /no-cache/)
  assert.equal((await request('/about/')).status, 200)
  const missing = await request('/__not_a_real_page__/')
  assert.equal(missing.status, 404)
  assert.match(await missing.text(), /404/)
  assert.equal((await request('/assets/missing.js')).status, 404)
  assert.equal((await request('/api/_lib/request-security.php')).status, 404)
  assert.equal((await request('/.user.ini')).status, 403)
  for (const route of privatePaths) {
    const response = await request(route)
    assert.ok([403, 404].includes(response.status), `${route}: ${response.status}`)
    assert.ok(!(await response.text()).includes('PRIVATE_FIXTURE_MUST_NOT_LEAK'), route)
  }
  assert.equal((await request('/.well-known/acme-challenge/fixture')).status, 200)
  const www = await request('/about/?utm_source=fixture', { Host: 'www.xn--80abmkm6an.xn--p1ai' })
  assert.equal(www.status, 301)
  assert.equal(www.headers.get('location'), 'https://xn--80abmkm6an.xn--p1ai/about/?utm_source=fixture')
  const http = await request('/contacts/', { Host: 'xn--80abmkm6an.xn--p1ai' })
  assert.equal(http.status, 301)
  assert.equal(http.headers.get('location'), 'https://xn--80abmkm6an.xn--p1ai/contacts/')
  assert.equal((await request('/', { Host: 'xn--80abmkm6an.xn--p1ai', 'X-Forwarded-Proto': 'https' })).status, 200)
  process.stdout.write('Apache: SSG HTML, real 404, missing assets, private files, security/cache headers, www/apex and HTTPS redirects verified.\n')
} catch (error) {
  process.stderr.write(await readFile(`${directory}/error.log`, 'utf8').catch(() => startup))
  throw error
} finally {
  child.kill('SIGTERM')
  await new Promise((resolve) => { if (child.exitCode !== null) resolve(); else child.once('exit', resolve) })
  await rm(directory, { recursive: true, force: true })
}

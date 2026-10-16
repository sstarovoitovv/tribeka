import { readdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = fileURLToPath(new URL('../', import.meta.url))
const env = { ...process.env, CI: '1', PLAYWRIGHT_PORT: process.env.PLAYWRIGHT_PORT || '4183', VITE_FORM_ENDPOINT: '/api/request.php' }
function run(command, args) {
  console.log(`\n> ${command} ${args.join(' ')}`)
  const result = spawnSync(command, args, { cwd: root, env, stdio: 'inherit' })
  if (result.error) console.error(result.error.message)
  if (result.error || result.status !== 0) process.exit(result.status || 1)
}
function lintPhp(directory) {
  for (const entry of readdirSync(path.join(root, directory), { withFileTypes: true })) {
    const relative = path.join(directory, entry.name)
    if (entry.isDirectory()) lintPhp(relative)
    else if (entry.name.endsWith('.php')) run('php', ['-l', relative])
  }
}

run('php', ['--version'])
for (const script of ['lint', 'test']) run('npm', ['run', script])
for (const directory of ['public/api', 'server', 'tests/php']) lintPhp(directory)
for (const script of ['test:php', 'test:deploy', 'build', 'test:ssg', 'test:apache', 'test:e2e']) {
  run('npm', ['run', script])
}
console.log('\nAll local checks passed.')

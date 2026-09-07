import { SITE_URL } from '../src/seoConfig.js'
const sitemap = `${SITE_URL}/sitemap.xml`
const plans = [
  { name: 'Google Search Console', token: process.env.GOOGLE_SEARCH_CONSOLE_TOKEN, method: 'PUT',
    url: `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(process.env.GOOGLE_SEARCH_CONSOLE_PROPERTY || SITE_URL + '/')}/sitemaps/${encodeURIComponent(sitemap)}` },
  { name: 'Yandex Webmaster', token: process.env.YANDEX_WEBMASTER_TOKEN,
    ready: process.env.YANDEX_WEBMASTER_USER_ID && process.env.YANDEX_WEBMASTER_HOST_ID, method: 'POST',
    url: `https://api.webmaster.yandex.net/v4/user/${encodeURIComponent(process.env.YANDEX_WEBMASTER_USER_ID || '')}/hosts/${encodeURIComponent(process.env.YANDEX_WEBMASTER_HOST_ID || '')}/user-added-sitemaps/`, body: JSON.stringify({ url: sitemap }) },
]
const submit = process.argv.includes('--submit')
let missing = false
for (const plan of plans) {
  if (!submit) { process.stdout.write(`${plan.name}: ${plan.method} ${plan.url} (dry run; no request sent)\n`); continue }
  if (!plan.token || (plan.name.startsWith('Yandex') && !plan.ready)) { process.stderr.write(`${plan.name}: credentials/property verification missing; NOT submitted.\n`); missing = true; continue }
  const response = await fetch(plan.url, { method: plan.method, headers: { Authorization: `${plan.name.startsWith('Google') ? 'Bearer' : 'OAuth'} ${plan.token}`, 'Content-Type': 'application/json' }, body: plan.body, signal: AbortSignal.timeout(20000) })
  process.stdout.write(`${plan.name}: HTTP ${response.status}${response.ok ? ' accepted' : ' failed'}\n`)
  if (!response.ok) missing = true
}
if (missing) process.exitCode = 1

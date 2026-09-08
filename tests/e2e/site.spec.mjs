import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  // Real external services, maps and the production lead database are never hit by tests.
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort())
})

for (const width of [320, 390, 768]) {
  test(`mobile navigation stays visible and usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto('/')
    await page.evaluate(() => document.fonts.ready)
    await page.screenshot({ path: `.work/evidence/home-mobile-${width}.png`, animations: 'disabled' })
    const nav = page.getByRole('navigation', { name: /мобильн/i })
    await expect(nav).toBeVisible()
    const box = await nav.boundingBox()
    expect(box.y + box.height).toBeLessThanOrEqual(845)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await nav.getByRole('link', { name: 'Услуги' }).click()
    await expect(page).toHaveURL(/\/services\/$/)
    await nav.getByRole('link', { name: 'Контакты' }).click()
    await expect(page.getByRole('textbox', { name: /ваше имя/i })).toBeVisible()
    expect(errors).toEqual([])
    await page.screenshot({ path: `.work/evidence/mobile-${width}.png`, fullPage: true, animations: 'disabled' })
  })
}

test('full content without JavaScript and genuine missing-page 404', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort())
  const response = await page.goto('/about/')
  expect(response.status()).toBe(200)
  await expect(page.locator('h1')).toBeVisible()
  await page.screenshot({ path: '.work/evidence/ssg-without-javascript.png', fullPage: true, animations: 'disabled' })
  const missing = await page.goto('/definitely-missing/')
  expect(missing.status()).toBe(404)
  await expect(page.locator('h1')).toContainText(/не найдена/i)
  await context.close()
})

test('two attachments, server errors and successful form conversion', async ({ page }) => {
  let fail = true
  let body = ''
  await page.route('**/api/request.php', async route => {
    body = route.request().postDataBuffer().toString()
    await route.fulfill({ status: fail ? 429 : 200, contentType: 'application/json', body: JSON.stringify(fail ? { error: 'Повторите отправку через 30 секунд.' } : { ok: true }) })
  })
  await page.goto('/contacts/')
  await page.getByLabel(/ваше имя/i).fill('Тестовый клиент')
  await page.getByLabel(/^телефон/i).fill('+79062603060')
  await page.locator('input[type=file]').setInputFiles([
    { name: 'first.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\nfirst') },
    { name: 'second.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\nsecond') },
  ])
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: /обсудить проект/i }).click()
  await expect(page.getByRole('alert')).toHaveText('Повторите отправку через 30 секунд.')
  await expect(page.getByLabel(/ваше имя/i)).toHaveValue('Тестовый клиент')
  fail = false
  await page.getByRole('button', { name: /обсудить проект/i }).click()
  await expect(page.getByRole('heading', { name: 'Заявка принята' })).toBeVisible()
  expect(body.match(/name="attachments\[\]"/g)).toHaveLength(2)
})

test('statistics remain absent even for a visitor with an old opt-in', async ({ page }) => {
  const submissions = []
  await page.addInitScript(() => localStorage.setItem('tribeka:analytics-consent:v1', 'yes'))
  page.on('request', request => { if (request.method() === 'POST') submissions.push(new URL(request.url()).pathname) })
  await page.route('**/api/request.php', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }))
  await page.goto('/?utm_source=yandex&utm_campaign=test')
  await expect(page.getByText('Настройки статистики:', { exact: false })).toHaveCount(0)
  for (const prefix of ['tel:', 'https://t.me/']) {
    const link = page.locator(`a[href^="${prefix}"]`).first()
    await link.evaluate(element => element.addEventListener('click', event => event.preventDefault()))
    await link.click()
  }
  await page.getByRole('link', { name: 'Услуги', exact: true }).first().click()
  await page.goto('/contacts/')
  await page.getByLabel(/ваше имя/i).fill('Тестовый посетитель')
  await page.getByLabel(/^телефон/i).fill('+79062603060')
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Обсудить проект' }).click()
  await expect(page.getByRole('heading', { name: 'Заявка принята' })).toBeVisible()
  expect(submissions).toEqual(['/api/request.php'])
  expect((await page.request.post('/api/analytics.php', { data: { event: 'page_view' } })).status()).toBe(404)
})

test('desktop typography and visible content', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  expect(await page.evaluate(() => document.fonts.check('400 16px "Manrope Variable"', 'Металлообработка'))).toBe(true)
  await expect(page.getByRole('navigation', { name: /мобильн/i })).not.toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await expect(page.locator('main')).toHaveCSS('opacity', '1')
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('DOM.enable')
  await cdp.send('CSS.enable')
  const { root } = await cdp.send('DOM.getDocument')
  const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: 'h1' })
  const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId })
  expect(fonts.some(font => font.isCustomFont && font.postScriptName.startsWith('Manrope'))).toBe(true)
  await page.screenshot({ path: '.work/evidence/home-desktop.png', animations: 'disabled' })
})

test('request stays near the top and long attachments fit on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/contacts/')
  const name = page.getByRole('textbox', { name: /ваше имя/i })
  expect((await name.boundingBox()).y).toBeLessThan(800)
  await name.focus()
  await expect(name).toHaveCSS('outline-style', 'solid')
  await expect(name).toHaveCSS('font-size', '16px')
  await expect(page.locator('main')).toHaveCSS('animation-name', 'none')
  const files = page.locator('input[type=file]')
  await files.focus()
  await expect(page.locator('label[for="request-files"]')).toHaveCSS('outline-style', 'solid')
  await files.setInputFiles({ name: 'Очень-длинное-название-чертежа-для-проверки-мобильного-экрана.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\ntest') })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.getByRole('button', { name: /^Удалить файл / }).click()
  await expect(page.getByRole('button', { name: /^Удалить файл / })).toHaveCount(0)
  await page.setViewportSize({ width: 720, height: 900 })
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('header and footer keep navigation and contact channels at intermediate widths', async ({ page }) => {
  for (const width of [320, 1000, 1280]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    await page.evaluate(() => document.fonts.ready)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const footer = page.getByRole('contentinfo')
    await expect(footer.getByRole('link', { name: 'Услуги', exact: true })).toHaveAttribute('href', '/services/')
    for (const label of ['WhatsApp', 'Telegram', 'MAX']) {
      const link = footer.getByRole('link', { name: `Написать: ${label}` })
      await expect(link).toBeVisible()
      expect((await link.boundingBox()).height).toBeGreaterThanOrEqual(44)
    }
    if (width >= 1000) {
      const header = page.getByRole('banner')
      await expect(header.getByRole('navigation', { name: 'Основная навигация' })).toBeVisible()
      for (const label of ['Почта', 'WhatsApp', 'Telegram', 'MAX']) await expect(header.getByRole('link', { name: `Написать: ${label}` })).toBeVisible()
    } else {
      await page.getByRole('button', { name: 'Открыть меню' }).click()
      await expect(page.getByRole('navigation', { name: 'Мобильная навигация', exact: true })).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(page.getByRole('button', { name: 'Открыть меню' })).toHaveAttribute('aria-expanded', 'false')
    }
  }
})

test('missing consent shows inline warning without losing input or sending a request', async ({ page }) => {
  const requests = []
  await page.route('**/api/request.php', async route => {
    requests.push(route.request().postDataBuffer().toString())
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' })
  })
  await page.setViewportSize({ width: 390, height: 900 })
  await page.goto('/contacts/')
  await page.getByLabel(/ваше имя/i).fill('Тестовый посетитель')
  await page.getByLabel(/^телефон/i).fill('+79062603060')
  await page.getByLabel(/кратко о задаче/i).fill('Нужна партия деталей')
  await page.locator('input[type=file]').setInputFiles({ name: 'drawing.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\ntest') })
  // Enter and clicking the submit button both use native form constraint validation.
  await page.getByLabel(/ваше имя/i).press('Enter')
  const warning = page.getByRole('alert')
  await expect(warning).toHaveText('Чтобы отправить заявку, согласитесь на обработку персональных данных.')
  await expect(warning).toHaveCSS('color', 'rgb(185, 28, 28)')
  await expect(page.getByRole('checkbox')).toBeFocused()
  await expect(page.getByRole('checkbox')).toHaveAttribute('aria-invalid', 'true')
  await page.getByRole('button', { name: 'Обсудить проект' }).click()
  expect(requests).toHaveLength(0)
  await expect(page.getByLabel(/ваше имя/i)).toHaveValue('Тестовый посетитель')
  await expect(page.getByLabel(/кратко о задаче/i)).toHaveValue('Нужна партия деталей')
  await expect(page.getByRole('button', { name: 'Удалить файл drawing.pdf' })).toBeVisible()
  await page.locator('#request').screenshot({ path: '.work/evidence/form-consent-warning.png', animations: 'disabled', style: 'header, body > #root > div > nav { visibility: hidden !important; }' })
  await page.getByRole('checkbox').check()
  await expect(warning).toHaveCount(0)
  expect(requests).toHaveLength(0)
  await page.getByRole('button', { name: 'Обсудить проект' }).click()
  await expect(page.getByRole('heading', { name: 'Заявка принята' })).toBeVisible()
  expect(requests).toHaveLength(1)
  expect(requests[0]).toContain('drawing.pdf')
})

test('brand icons match across surfaces, contacts stay in one row and production wording is restored', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await expect(page.locator('h1')).toHaveText('От идеидо готового изделия')
  await expect(page.getByText('Комплексная металлообработка с 2012 года', { exact: true })).toBeVisible()
  await expect(page.getByText('Как начинается заказ', { exact: true })).toHaveCount(0)
  await expect(page.locator('main section').first()).not.toContainText('Собственное оборудование')
  await expect(page.locator('main section').first().locator('figcaption')).toHaveCount(0)
  for (const [label, color] of [['Почта', 'rgb(57, 118, 196)'], ['WhatsApp', 'rgb(37, 211, 102)'], ['Telegram', 'rgb(38, 165, 228)']]) {
    const top = page.getByRole('banner').getByRole('link', { name: `Написать: ${label}` }).locator('svg')
    await expect(top).toHaveCSS('color', color)
    if (label === 'Почта') continue
    const bottom = page.getByRole('contentinfo').getByRole('link', { name: `Написать: ${label}` }).locator('svg')
    await expect(bottom).toHaveCSS('color', color)
    expect(await bottom.innerHTML()).toBe(await top.innerHTML())
  }
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/contacts/')
    const icons = page.locator('main [aria-label="Каналы связи"] a')
    await expect(icons).toHaveCount(4)
    expect(await icons.allTextContents()).toEqual(['', '', '', ''])
    const positions = await icons.evaluateAll(links => links.map(link => Math.round(link.getBoundingClientRect().top)))
    expect(new Set(positions).size).toBe(1)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
})

test('form renders server error text without interpreting HTML', async ({ page }) => {
  let scriptRan = false
  page.on('dialog', async dialog => { scriptRan = true; await dialog.dismiss() })
  const payload = '<img src=x onerror=alert(1)><script>alert(1)</script>'
  await page.route('**/api/request.php', route => route.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify({ error: payload }) }))
  await page.goto('/contacts/')
  await page.getByLabel(/ваше имя/i).fill("Robert'); DROP TABLE leads; --")
  await page.getByLabel(/^телефон/i).fill('+79062603060')
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Обсудить проект' }).click()
  await expect(page.getByRole('alert')).toHaveText(payload)
  await expect(page.getByRole('alert').locator('img, script')).toHaveCount(0)
  expect(scriptRan).toBe(false)
})

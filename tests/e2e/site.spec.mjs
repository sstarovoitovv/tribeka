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

test('analytics opt-in, redacted UTM, clicks and withdrawal', async ({ page }) => {
  const events = []
  await page.route('**/api/analytics.php', async route => {
    events.push(route.request().postDataJSON())
    await route.fulfill({ status: 204 })
  })
  await page.goto('/?utm_source=yandex&utm_medium=cpc&utm_campaign=private@example.com&phone=123')
  await page.getByRole('link', { name: 'Услуги', exact: true }).first().click()
  expect(events).toHaveLength(0)
  await page.goto('/?utm_source=yandex&utm_medium=cpc&utm_campaign=private@example.com&phone=123')
  await page.getByText('Настройки статистики:', { exact: false }).click()
  await page.getByRole('button', { name: 'Разрешить статистику' }).click()
  await expect.poll(() => events.length).toBe(1)
  expect(events[0]).toMatchObject({ event: 'page_view', source: 'yandex', medium: 'cpc', campaign: 'other', path: '/' })
  await page.locator('a[href^="tel:"]').first().evaluate(link => link.addEventListener('click', event => event.preventDefault()))
  await page.locator('a[href^="tel:"]').first().click()
  await expect.poll(() => events.some(event => event.event === 'phone_click')).toBe(true)
  expect(JSON.stringify(events)).not.toContain('private@')
  await page.getByRole('button', { name: 'Отключить статистику' }).click()
  const count = events.length
  await page.locator('a[href^="tel:"]').first().click()
  expect(events).toHaveLength(count)
})

test('GPC overrides stored analytics permission', async ({ page }) => {
  const events = []
  await page.addInitScript(() => {
    localStorage.setItem('tribeka:analytics-consent:v1', 'yes')
    Object.defineProperty(navigator, 'globalPrivacyControl', { value: true })
  })
  await page.route('**/api/analytics.php', route => { events.push(1); return route.fulfill({ status: 204 }) })
  await page.goto('/')
  await page.getByText('Настройки статистики:', { exact: false }).click()
  await expect(page.getByText('В браузере включён запрет отслеживания. Статистика отключена.')).toBeVisible()
  expect(events).toHaveLength(0)
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

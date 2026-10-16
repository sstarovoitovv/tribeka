import { defineConfig } from '@playwright/test'
const port = process.env.PLAYWRIGHT_PORT || '4173'
const baseURL = `http://127.0.0.1:${port}`
export default defineConfig({
  testDir: './tests/e2e', fullyParallel: true, workers: 1, timeout: 30000,
  reporter: [['list'], ['html', { open: 'never', outputFolder: '.work/playwright-report' }]],
  outputDir: '.work/test-results',
  use: { baseURL, trace: 'retain-on-failure', screenshot: 'only-on-failure', ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}) },
  webServer: { command: 'node scripts/serve-preview.mjs', url: baseURL, env: { PORT: port }, reuseExistingServer: !process.env.CI },
})

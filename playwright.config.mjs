import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './tests/e2e', fullyParallel: true, timeout: 30000,
  reporter: [['list'], ['html', { open: 'never', outputFolder: '.work/playwright-report' }]],
  outputDir: '.work/test-results',
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure', screenshot: 'only-on-failure', ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}) },
  webServer: { command: 'node scripts/serve-preview.mjs', url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI },
})

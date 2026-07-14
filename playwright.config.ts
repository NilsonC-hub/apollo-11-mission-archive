import { defineConfig } from '@playwright/test'

const baseURL = process.env.APOLLO11_BASE_URL ?? 'http://127.0.0.1:4173'

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.01,
      threshold: 0.2,
    },
  },
  reporter: 'line',
  outputDir: 'output/playwright/test-results',
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
  use: {
    baseURL,
    browserName: 'chromium',
    channel: 'chrome',
    headless: true,
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: process.env.APOLLO11_BASE_URL
    ? undefined
    : {
        command: 'pnpm preview --host 127.0.0.1 --port 4173',
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      },
})

import { defineConfig, devices } from '@playwright/test'

const devPort = Number.parseInt(process.env.VITE_DEV_PORT ?? '5333', 10)
const defaultBaseUrl = `http://localhost:${Number.isFinite(devPort) ? devPort : 5333}`
const baseURL = process.env.E2E_BASE_URL ?? defaultBaseUrl

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npm run dev -- --host 0.0.0.0 --port ${Number.isFinite(devPort) ? devPort : 5333}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})

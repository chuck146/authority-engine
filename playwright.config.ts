import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  globalSetup: './e2e/setup/global-setup.ts',
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 10_000 },
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // Auth setup — runs first, saves storageState
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    // Smoke tests — depend on auth setup
    {
      name: 'smoke',
      testDir: './e2e/smoke',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/user.json',
      },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 30_000,
  },
})

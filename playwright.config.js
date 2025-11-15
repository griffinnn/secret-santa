import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 20000,
  globalSetup: './tests/playwright.setup.js',
  expect: {
    timeout: 3000,
  },
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:8000',
    trace: 'off',
    screenshot: 'off',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: [
    {
      command: 'npm start --prefix backend',
      url: 'http://127.0.0.1:3001/api/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      command: 'python3 -m http.server 8000 --bind 127.0.0.1',
      url: 'http://127.0.0.1:8000',
      reuseExistingServer: !process.env.CI,
    }
  ],
});

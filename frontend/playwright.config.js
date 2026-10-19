import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    channel: 'chromium',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5173 --strictPort',
    env: { VITE_API_BASE_URL: '/api' },
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
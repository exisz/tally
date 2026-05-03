import { defineConfig } from '@playwright/test';

/**
 * Playwright config for tally desktop (PLANET-1470).
 *
 * Uses the Playwright Electron driver. Launch helper at tests/e2e/fixtures/electron-app.ts.
 * Each test gets an isolated tmp data dir (XDG_DATA_HOME / APPDATA equivalent).
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false, // child-process supervision — keep serial
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    trace: 'on',
    screenshot: 'on',
    video: 'on',
  },
});

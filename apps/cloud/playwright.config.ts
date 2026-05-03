import { defineConfig } from '@playwright/test';

/**
 * Playwright config for @tally/cloud (PLANET-1513 Stage 0 — TDD red foundation).
 *
 * Tests run against a real deployed cloud (default https://tally.rollersoft.com.au).
 * Override with TALLY_CLOUD_BASE_URL.
 *
 * Stage 0 expectation: tests are RED. Endpoints return 501 with a ticket id.
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never', outputFolder: 'playwright-report' }], ['json', { outputFile: 'test-results/results.json' }]]
    : [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: process.env.TALLY_CLOUD_BASE_URL ?? 'https://tally.rollersoft.com.au',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});

/**
 * PLANET-1471 (S1.1) — Fresh launch journey.
 *
 * Acceptance:
 * - GIVEN freshly installed tally on a clean OS profile
 * - WHEN the user launches the app
 * - THEN the main BrowserWindow becomes visible within 5 s
 * - AND the title bar reads 'Tally'
 * - AND no error dialog is shown
 */
import { test, expect } from '@playwright/test';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { launchApp } from '../fixtures/electron-app';

test('S1.1 fresh launch: window visible within 5 s, correct title, no error dialog', async () => {
  const dataDir = await mkdtemp(path.join(tmpdir(), 'tally-s1-1-'));
  const start = Date.now();
  const { app, page } = await launchApp({ tmpDataDir: dataDir, fakeWatchers: true });
  try {
    await expect(page).toHaveTitle(/Tally/);
    expect(Date.now() - start).toBeLessThan(5_000);
    // No error dialog: assert no window with role=alertdialog
    const alerts = await page.locator('[role="alertdialog"]').count();
    expect(alerts).toBe(0);
  } finally {
    await app.close();
  }
});

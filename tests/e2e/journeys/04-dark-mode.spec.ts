/**
 * PLANET-1474 (S1.4) — Dark mode follows OS, with manual override.
 */
import { test, expect } from '@playwright/test';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { launchApp } from '../fixtures/electron-app';

test('S1.4 dark mode honors OS preference and manual override persists', async () => {
  const dataDir = await mkdtemp(path.join(tmpdir(), 'tally-s1-4-'));
  const { app, page } = await launchApp({ tmpDataDir: dataDir, fakeWatchers: true });
  try {
    // Force OS dark via Electron API
    await app.evaluate(({ nativeTheme }: any) => {
      nativeTheme.themeSource = 'dark';
    });
    await expect(page.locator('html')).toHaveAttribute('data-theme', /dark/);

    // Manual override → Light, persist across reload
    await page.getByRole('link', { name: /settings/i }).click();
    await page.getByLabel(/theme/i).selectOption('light');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', /light/);
  } finally {
    await app.close();
  }
});

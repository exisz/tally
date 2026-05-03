/**
 * PLANET-1473 (S1.3) — Autostart on login.
 *
 * Acceptance:
 * - DEFAULT: autostart disabled on first install
 * - WHEN user toggles 'Start at login' in Settings
 * - THEN OS-level login item is registered (verified via app.getLoginItemSettings on macOS,
 *   registry on Windows, ~/.config/autostart on Linux)
 * - AND toggling off removes it
 */
import { test, expect } from '@playwright/test';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { launchApp } from '../fixtures/electron-app';

test('S1.3 autostart default off, can be enabled and disabled', async () => {
  const dataDir = await mkdtemp(path.join(tmpdir(), 'tally-s1-3-'));
  const { app, page } = await launchApp({ tmpDataDir: dataDir, fakeWatchers: true });
  try {
    // Default: disabled
    let state = await app.evaluate(({ app }: any) =>
      app.getLoginItemSettings ? app.getLoginItemSettings() : { openAtLogin: false },
    );
    expect(state.openAtLogin).toBe(false);

    // Toggle on via Settings page
    await page.getByRole('link', { name: /settings/i }).click();
    await page.getByLabel(/start at login/i).check();
    state = await app.evaluate(({ app }: any) => app.getLoginItemSettings());
    expect(state.openAtLogin).toBe(true);

    // Toggle off
    await page.getByLabel(/start at login/i).uncheck();
    state = await app.evaluate(({ app }: any) => app.getLoginItemSettings());
    expect(state.openAtLogin).toBe(false);
  } finally {
    await app.close();
  }
});

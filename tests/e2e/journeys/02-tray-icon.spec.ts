/**
 * PLANET-1472 (S1.2) — System tray icon journey.
 *
 * Acceptance:
 * - WHEN the app is running (window may be hidden)
 * - THEN a tray icon exists with menu items: 'Open Tally', 'Pause tracking', 'Quit'
 * - AND clicking 'Open Tally' brings the window to focus
 *
 * Note: Playwright cannot click OS-native tray menus directly. The app must
 * expose a test-only IPC channel `__test__/tray` returning the menu spec
 * AND allowing simulated invocation. See ADR-002 (to be written).
 */
import { test, expect } from '@playwright/test';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { launchApp } from '../fixtures/electron-app';

test('S1.2 tray menu has Open / Pause / Quit', async () => {
  const dataDir = await mkdtemp(path.join(tmpdir(), 'tally-s1-2-'));
  const { app, page } = await launchApp({ tmpDataDir: dataDir, fakeWatchers: true });
  try {
    const menu = await app.evaluate(async ({ ipcMain }: any) => {
      // @ts-ignore — test-only channel
      return await ipcMain.handle('__test__/tray', () => undefined);
    });
    const labels = (menu as any[]).map((m) => m.label);
    expect(labels).toContain('Open Tally');
    expect(labels).toContain('Pause tracking');
    expect(labels).toContain('Quit');

    // Hide window, then simulate click on 'Open Tally' → window focused
    await page.evaluate(() => (window as any).electron?.hide?.());
    await app.evaluate(async ({ ipcMain }: any) => {
      // @ts-ignore
      await ipcMain.handle('__test__/tray/click', 'Open Tally');
    });
    await expect(page).toBeVisible();
  } finally {
    await app.close();
  }
});

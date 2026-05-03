/**
 * PLANET-1507 (S1.6) — Settings: AFK timeout + per-watcher toggles + multi-host.
 */
import { test, expect } from '@playwright/test';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { launchApp } from '../fixtures/electron-app';

test('S1.6 AFK timeout slider, watcher toggles, hostname filter', async () => {
  test.setTimeout(60_000);
  const dataDir = await mkdtemp(path.join(tmpdir(), 'tally-s1-6-'));
  const { app, page, supervisor } = await launchApp({ tmpDataDir: dataDir, fakeWatchers: true });
  try {
    await page.getByRole('link', { name: /settings/i }).click();
    await page.getByRole('tab', { name: /watchers|advanced/i }).click();

    // AFK timeout slider
    const afk = page.getByLabel(/afk timeout/i);
    await afk.fill('300');
    await page.getByRole('button', { name: /apply|restart watchers/i }).click();
    const cfg = await app.evaluate(async ({ ipcMain }: any) => {
      // @ts-ignore — test-only channel
      return await ipcMain.handle('__test__/watcher-config', () => undefined);
    });
    expect((cfg as any).afkTimeoutSec).toBe(300);

    // Per-watcher toggle
    await page.getByLabel(/aw-watcher-afk enabled/i).uncheck();
    await page.getByRole('button', { name: /apply|restart watchers/i }).click();
    const pids = await supervisor.pids();
    const cfg2 = await app.evaluate(async ({ ipcMain }: any) => {
      // @ts-ignore
      return await ipcMain.handle('__test__/watcher-config', () => undefined);
    });
    expect((cfg2 as any).enabled).not.toContain('aw-watcher-afk');

    // Multi-host filter on bucket explorer
    await page.getByRole('link', { name: /buckets|explorer/i }).click();
    const hostFilter = page.getByRole('combobox', { name: /host/i });
    await hostFilter.selectOption({ label: /this device/i });
    const visibleRows = await page.getByRole('row').count();
    expect(visibleRows).toBeGreaterThan(0);
  } finally {
    await app.close();
  }
});

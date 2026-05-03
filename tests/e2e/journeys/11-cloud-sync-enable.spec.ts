/**
 * PLANET-1484 (S4.1) — Enable cloud sync flow.
 *
 * Canonical Scenario S3. Cloud is mocked via Playwright route interception.
 */
import { test, expect } from '@playwright/test';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { launchApp } from '../fixtures/electron-app';

test('S4.1 enable cloud sync: passphrase → key → upload', async () => {
  test.setTimeout(60_000);
  const dataDir = await mkdtemp(path.join(tmpdir(), 'tally-s4-1-'));
  const { app, page } = await launchApp({
    tmpDataDir: dataDir,
    fakeWatchers: true,
    cloudSync: 'off',
  });
  try {
    const seenPaths: string[] = [];
    await page.route('**/api/v1/sync/**', async (route) => {
      seenPaths.push(new URL(route.request().url()).pathname);
      const m = route.request().method();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, method: m }),
      });
    });

    await page.getByRole('link', { name: /settings/i }).click();
    await page.getByRole('button', { name: /enable cloud sync/i }).click();
    await page.getByLabel(/passphrase/i).fill('correct-horse-battery-staple-12');
    await page.getByRole('button', { name: /confirm|next/i }).click();

    // Argon2id parameters surfaced via test channel
    const params = await app.evaluate(async ({ ipcMain }: any) => {
      // @ts-ignore
      return await ipcMain.handle('__test__/last-key-derivation', () => undefined);
    });
    expect(params).toMatchObject({ algorithm: 'argon2id', m: 64 * 1024, t: 3, p: 1 });

    // Status pill updates
    await expect(page.getByTestId('sync-status')).toContainText(/syncing|synced/i, {
      timeout: 30_000,
    });

    expect(seenPaths.some((p) => p.startsWith('/api/api/v1/sync/buckets'))).toBe(true);
  } finally {
    await app.close();
  }
});

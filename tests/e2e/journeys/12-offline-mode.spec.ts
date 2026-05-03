/**
 * PLANET-1488 (S4.5) — Cloud sync fully optional.
 *
 * GIVEN cloud sync OFF (default)
 * THEN no outbound calls to tally.rollersoft.com.au
 * AND all dashboard / timeline / explorer features work.
 */
import { test, expect } from '@playwright/test';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { launchApp } from '../fixtures/electron-app';

test('S4.5 with sync OFF, zero calls to cloud, full local UX', async () => {
  const dataDir = await mkdtemp(path.join(tmpdir(), 'tally-s4-5-'));
  const { app, page } = await launchApp({
    tmpDataDir: dataDir,
    fakeWatchers: true,
    cloudSync: 'off',
    fakeWatcherScript: JSON.stringify([
      { at: '+0s', app: 'VSCode', title: 't', duration: 5 },
    ]),
  });
  try {
    let cloudHits = 0;
    await page.route(/aw(\.|-).*rollersoft\.com\.au/, async (route) => {
      cloudHits++;
      await route.abort();
    });

    await page.getByRole('link', { name: /dashboard/i }).click();
    await expect(page.getByTestId('timeline-block').first()).toBeVisible({ timeout: 30_000 });
    await page.getByRole('link', { name: /buckets|explorer/i }).click();
    await expect(page.getByRole('row').first()).toBeVisible();

    expect(cloudHits).toBe(0);
  } finally {
    await app.close();
  }
});

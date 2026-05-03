/**
 * PLANET-1483 (S3.3) — Bucket explorer lists buckets and inspects raw events.
 */
import { test, expect } from '@playwright/test';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { launchApp } from '../fixtures/electron-app';

const SCRIPT = JSON.stringify([
  { at: '+0s', app: 'VSCode', title: 'README.md', duration: 5 },
]);

test('S3.3 bucket explorer lists buckets, opens events, filters by app', async () => {
  const dataDir = await mkdtemp(path.join(tmpdir(), 'tally-s3-3-'));
  const { app, page } = await launchApp({
    tmpDataDir: dataDir,
    fakeWatchers: true,
    fakeWatcherScript: SCRIPT,
  });
  try {
    await page.getByRole('link', { name: /buckets|explorer/i }).click();
    const rows = page.getByRole('row');
    await expect(rows).not.toHaveCount(0);

    const windowBucket = rows.filter({ hasText: 'aw-watcher-window' }).first();
    await windowBucket.click();
    await expect(page.getByText('VSCode')).toBeVisible();

    // Local-only filter
    await page.getByRole('searchbox', { name: /filter/i }).fill('VSCode');
    await expect(page.getByText('VSCode')).toBeVisible();
    await page.getByRole('searchbox', { name: /filter/i }).fill('NotAnApp');
    await expect(page.getByText(/no events match/i)).toBeVisible();
  } finally {
    await app.close();
  }
});

/**
 * PLANET-1501 (S3.9) — Filter / search events.
 */
import { test, expect } from '@playwright/test';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { launchApp } from '../fixtures/electron-app';

const SCRIPT = JSON.stringify([
  { at: '+0s', app: 'VSCode', title: 'README.md', duration: 30 },
  { at: '+30s', app: 'Chrome', title: 'github.com', duration: 30 },
  { at: '+60s', app: 'Slack', title: 'general', duration: 30 },
]);

test('S3.9 free-text filter is local, case-insensitive, substring match', async () => {
  test.setTimeout(60_000);
  const dataDir = await mkdtemp(path.join(tmpdir(), 'tally-s3-9-'));
  const { app, page } = await launchApp({
    tmpDataDir: dataDir,
    fakeWatchers: true,
    fakeWatcherScript: SCRIPT,
    cloudSync: 'off',
  });
  try {
    let cloudHits = 0;
    await page.route(/tally\.rollersoft\.com\.au/, async (r) => { cloudHits++; await r.abort(); });

    await page.getByRole('link', { name: /activity/i }).click();
    await page.getByRole('searchbox', { name: /filter/i }).fill('chro'); // case-insensitive
    await expect(page.getByText('Chrome')).toBeVisible();
    await expect(page.getByText('VSCode')).toHaveCount(0);
    await expect(page.getByText('Slack')).toHaveCount(0);

    expect(cloudHits).toBe(0);
  } finally {
    await app.close();
  }
});

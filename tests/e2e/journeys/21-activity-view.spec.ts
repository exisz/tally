/**
 * PLANET-1498 (S3.6) — Activity view.
 */
import { test, expect } from '@playwright/test';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { launchApp } from '../fixtures/electron-app';

const SCRIPT = JSON.stringify([
  { at: '+0s', app: 'VSCode', title: 'README.md', duration: 600 },   // 10 min
  { at: '+600s', app: 'Chrome', title: 'github.com', duration: 300 },// 5 min
  { at: '+900s', app: 'Spotify', title: 'Daft Punk', duration: 120 },// 2 min
]);

test('S3.6 activity view sums per-category to within ±1 s', async () => {
  test.setTimeout(60_000);
  const dataDir = await mkdtemp(path.join(tmpdir(), 'tally-s3-6-'));
  const { app, page } = await launchApp({
    tmpDataDir: dataDir,
    fakeWatchers: true,
    fakeWatcherScript: SCRIPT,
  });
  try {
    await page.getByRole('link', { name: /activity/i }).click();
    // Wait for the three rows
    await expect(page.getByTestId('cat-row').first()).toBeVisible({ timeout: 30_000 });

    const work = await page.getByTestId('cat-row').filter({ hasText: 'Work' }).getByTestId('cat-seconds').textContent();
    const media = await page.getByTestId('cat-row').filter({ hasText: 'Media' }).getByTestId('cat-seconds').textContent();
    expect(Math.abs(Number(work) - 900)).toBeLessThanOrEqual(1);
    expect(Math.abs(Number(media) - 120)).toBeLessThanOrEqual(1);

    // Drill into Work → Coding child sum
    await page.getByTestId('cat-row').filter({ hasText: 'Work' }).click();
    const coding = await page.getByTestId('cat-row').filter({ hasText: 'Coding' }).getByTestId('cat-seconds').textContent();
    expect(Math.abs(Number(coding) - 600)).toBeLessThanOrEqual(1);
  } finally {
    await app.close();
  }
});

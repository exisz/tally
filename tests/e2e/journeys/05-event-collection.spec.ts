/**
 * PLANET-1482 (S3.2) — Dashboard shows ≥1 colored block per app within 60 s.
 *
 * Canonical Scenario S2.
 */
import { test, expect } from '@playwright/test';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { launchApp } from '../fixtures/electron-app';

const SCRIPT = JSON.stringify([
  { at: '+0s', app: 'VSCode', title: 'tally.project.dna', duration: 30 },
  { at: '+30s', app: 'Chrome', title: 'github.com', duration: 30 },
]);

test('S3.2 dashboard renders ≥1 block per scripted app within 60 s', async () => {
  test.setTimeout(120_000);
  const dataDir = await mkdtemp(path.join(tmpdir(), 'tally-s3-2-'));
  const { app, page } = await launchApp({
    tmpDataDir: dataDir,
    fakeWatchers: true,
    fakeWatcherScript: SCRIPT,
  });
  try {
    await page.getByRole('link', { name: /dashboard|timeline/i }).click();

    // Wait up to 65 s for both apps to appear as timeline blocks.
    const vscode = page.getByTestId('timeline-block').filter({ hasText: 'VSCode' });
    const chrome = page.getByTestId('timeline-block').filter({ hasText: 'Chrome' });
    await expect(vscode.first()).toBeVisible({ timeout: 65_000 });
    await expect(chrome.first()).toBeVisible({ timeout: 65_000 });

    // Sum of durations within ±2 s of fixture (60 s total)
    const totalText = await page.getByTestId('total-tracked-seconds').textContent();
    const total = Number(totalText);
    expect(total).toBeGreaterThanOrEqual(58);
    expect(total).toBeLessThanOrEqual(62);
  } finally {
    await app.close();
  }
});

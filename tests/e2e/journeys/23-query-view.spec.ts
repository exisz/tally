/**
 * PLANET-1500 (S3.8) — Query view (AQL).
 *
 * Forwards to bundled aw-server's /api/0/query2 endpoint (same as upstream AW UI).
 */
import { test, expect } from '@playwright/test';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { launchApp } from '../fixtures/electron-app';

const SCRIPT = JSON.stringify([
  { at: '+0s', app: 'VSCode', title: 't', duration: 30 },
]);

test('S3.8 query view runs AQL and renders JSON result', async () => {
  test.setTimeout(60_000);
  const dataDir = await mkdtemp(path.join(tmpdir(), 'tally-s3-8-'));
  const { app, page } = await launchApp({
    tmpDataDir: dataDir,
    fakeWatchers: true,
    fakeWatcherScript: SCRIPT,
  });
  try {
    await page.getByRole('link', { name: /query/i }).click();
    const editor = page.getByRole('textbox', { name: /query/i });
    // Minimal AQL: list buckets
    await editor.fill('events = query_bucket(find_bucket("aw-watcher-window_"));\nRETURN = events;');
    await page.getByRole('button', { name: /^run$/i }).click();

    const out = page.getByTestId('query-result');
    await expect(out).toContainText('"app"', { timeout: 30_000 });
    await expect(out).toContainText('"VSCode"');

    // Bad AQL → error displayed, no crash
    await editor.fill('this is not aql');
    await page.getByRole('button', { name: /^run$/i }).click();
    await expect(page.getByTestId('query-error')).toBeVisible();
  } finally {
    await app.close();
  }
});

/**
 * PLANET-1499 (S3.7) — Stopwatch.
 */
import { test, expect } from '@playwright/test';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { launchApp } from '../fixtures/electron-app';

test('S3.7 stopwatch start/stop writes labeled event to aw-stopwatch bucket', async () => {
  const dataDir = await mkdtemp(path.join(tmpdir(), 'tally-s3-7-'));
  const { app, page, supervisor } = await launchApp({ tmpDataDir: dataDir, fakeWatchers: true });
  try {
    await page.getByRole('link', { name: /stopwatch/i }).click();
    await page.getByLabel(/label/i).fill('Deep work — Tally spec');
    await page.getByRole('button', { name: /^start$/i }).click();
    await page.waitForTimeout(2_500);
    await page.getByRole('button', { name: /^stop$/i }).click();

    const port = await supervisor.serverPort();
    const r = await fetch(`http://127.0.0.1:${port}/api/0/buckets/aw-stopwatch/events?limit=10`);
    expect(r.status).toBe(200);
    const events = (await r.json()) as any[];
    const evt = events.find((e) => e.data?.label === 'Deep work — Tally spec');
    expect(evt).toBeDefined();
    expect(evt.duration).toBeGreaterThanOrEqual(2);
    expect(evt.duration).toBeLessThan(5);
  } finally {
    await app.close();
  }
});

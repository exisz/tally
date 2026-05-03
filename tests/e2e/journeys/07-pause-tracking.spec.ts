/**
 * PLANET-1480 (S2.5) — Pause tracking.
 *
 * Canonical Scenario S6.
 */
import { test, expect } from '@playwright/test';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { launchApp } from '../fixtures/electron-app';

const SCRIPT = JSON.stringify(
  Array.from({ length: 60 }, (_, i) => ({
    at: `+${i}s`,
    app: 'VSCode',
    title: 't',
    duration: 1,
  })),
);

test('S2.5 pause halts events; resume restarts within 5 s', async () => {
  test.setTimeout(120_000);
  const dataDir = await mkdtemp(path.join(tmpdir(), 'tally-s2-5-'));
  const { app, supervisor } = await launchApp({
    tmpDataDir: dataDir,
    fakeWatchers: true,
    fakeWatcherScript: SCRIPT,
  });
  try {
    const port = await supervisor.serverPort();
    const countEvents = async (): Promise<number> => {
      const res = await fetch(`http://127.0.0.1:${port}/api/0/buckets`);
      const buckets = await res.json();
      const ids = Object.keys(buckets);
      let total = 0;
      for (const id of ids) {
        const r = await fetch(`http://127.0.0.1:${port}/api/0/buckets/${id}/events?limit=1000`);
        total += ((await r.json()) as any[]).length;
      }
      return total;
    };

    await new Promise((r) => setTimeout(r, 5_000));
    const before = await countEvents();
    expect(before).toBeGreaterThan(0);

    await supervisor.pause();
    await new Promise((r) => setTimeout(r, 30_000));
    const duringPause = await countEvents();
    expect(duringPause).toBe(before); // no growth

    await supervisor.resume();
    await new Promise((r) => setTimeout(r, 5_000));
    const afterResume = await countEvents();
    expect(afterResume).toBeGreaterThan(duringPause);
  } finally {
    await app.close();
  }
});

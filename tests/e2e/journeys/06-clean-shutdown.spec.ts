/**
 * PLANET-1475 (S1.5) — Clean shutdown.
 *
 * Canonical Scenario S5: all child processes gone within 3 s of Quit.
 */
import { test, expect } from '@playwright/test';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { launchApp } from '../fixtures/electron-app';

function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

test('S1.5 quit kills aw-server and watchers within 3 s', async () => {
  const dataDir = await mkdtemp(path.join(tmpdir(), 'tally-s1-5-'));
  const { app, supervisor } = await launchApp({ tmpDataDir: dataDir, fakeWatchers: true });
  const pids = await supervisor.pids();
  expect(pids.length).toBeGreaterThanOrEqual(2); // aw-server + ≥1 watcher

  await app.close(); // simulates Quit / Cmd-Q

  const deadline = Date.now() + 3_000;
  let alive = pids.filter(isAlive);
  while (alive.length && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 100));
    alive = pids.filter(isAlive);
  }
  expect(alive, `Processes still alive: ${alive.join(',')}`).toEqual([]);
});

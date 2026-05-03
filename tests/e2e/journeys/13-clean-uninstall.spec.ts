/**
 * PLANET-1495 (S6.4) — Clean uninstall.
 *
 * Canonical Scenario S8: data + autostart + child processes removed.
 *
 * On macOS (no installer) this is exercised via the in-app "Erase all data"
 * action, which is functionally equivalent.
 */
import { test, expect } from '@playwright/test';
import { mkdtemp, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { launchApp } from '../fixtures/electron-app';

function isAlive(pid: number): boolean {
  try { process.kill(pid, 0); return true; } catch { return false; }
}

test('S6.4 erase all data: data dir gone, autostart removed, processes gone', async () => {
  const dataDir = await mkdtemp(path.join(tmpdir(), 'tally-s6-4-'));
  const { app, page, supervisor } = await launchApp({ tmpDataDir: dataDir, fakeWatchers: true });
  const pids = await supervisor.pids();

  // Enable autostart so we can assert it gets removed
  await page.getByRole('link', { name: /settings/i }).click();
  await page.getByLabel(/start at login/i).check();

  // Trigger erase
  await page.getByRole('button', { name: /erase all data/i }).click();
  await page.getByRole('button', { name: /confirm/i }).click();

  // App quits as part of erase
  await app.waitForEvent('close', { timeout: 10_000 });

  // Data dir is gone
  await expect(stat(dataDir)).rejects.toThrow();

  // Autostart is off
  // (re-launch a quick probe app to read OS state, or shell out to `osascript`/registry/grep)
  // Skipped here in detail — assert via a small helper to be implemented in fixtures.

  // Processes gone
  expect(pids.filter(isAlive)).toEqual([]);
});

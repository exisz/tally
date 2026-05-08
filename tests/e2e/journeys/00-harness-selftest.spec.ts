/**
 * PLANET-1492 (S6.1) — Harness self-test.
 *
 * Acceptance:
 * - launchApp({ tmpDataDir, fakeWatchers: true }) returns { app, page, supervisor }
 * - App starts within 10 s on CI hardware
 * - Per-test isolated XDG_DATA_HOME / APPDATA dir is honored
 * - Teardown kills all spawned processes
 *
 * Run modes:
 *   default — boots dev `dist/main.js` (validates harness contract).
 *   TALLY_PACKAGED_BIN=/path/to/Tally — boots a packaged installer artifact.
 */
import { test, expect } from '@playwright/test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { launchApp } from '../fixtures/electron-app';

test('S6.1 harness: launchApp returns {app,page,supervisor} and boots Tally in <10s', async () => {
  const dataDir = await mkdtemp(path.join(tmpdir(), 'tally-s6-1-'));
  const start = Date.now();
  let result: Awaited<ReturnType<typeof launchApp>> | null = null;
  try {
    result = await launchApp({ tmpDataDir: dataDir, fakeWatchers: true });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(10_000);
    expect(result.app).toBeDefined();
    expect(result.page).toBeDefined();
    expect(result.supervisor).toBeDefined();
    expect(typeof result.supervisor.pids).toBe('function');
    expect(typeof result.supervisor.serverPort).toBe('function');
    const pids = await result.supervisor.pids();
    expect(Array.isArray(pids)).toBe(true);
  } finally {
    if (result) {
      await result.app.close();
    }
    await rm(dataDir, { recursive: true, force: true });
  }
});

test('S6.1 harness: TALLY_PACKAGED_BIN boots the packaged artifact (skipped unless env set)', async () => {
  const bin = process.env.TALLY_PACKAGED_BIN;
  test.skip(!bin, 'TALLY_PACKAGED_BIN not set; packaged-mode self-test only runs in release CI.');
  const dataDir = await mkdtemp(path.join(tmpdir(), 'tally-s6-1-pkg-'));
  const start = Date.now();
  const { app, page } = await launchApp({ tmpDataDir: dataDir, fakeWatchers: true, packagedBin: bin });
  try {
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(10_000);
    await expect(page).toHaveTitle(/Tally/);
  } finally {
    await app.close();
    await rm(dataDir, { recursive: true, force: true });
  }
});

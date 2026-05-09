/**
 * PLANET-1492 (S6.1) — Playwright-Electron harness.
 *
 * Boots the Tally Electron app for an e2e test, with per-test isolated
 * data dirs and a teardown that kills all spawned children.
 *
 * Usage:
 *   const { app, page, supervisor } = await launchApp({ tmpDataDir, fakeWatchers: true });
 *   ...
 *   await app.close();
 *
 * Two launch modes:
 *   1. Dev mode (default): boots from `apps/desktop/dist/main.js` — used by S1.1.
 *   2. Packaged mode: set TALLY_PACKAGED_BIN=<path-to-Tally executable> to launch
 *      the artifact under `apps/desktop/release/` (used by S6.5 / PLANET-1522).
 *
 * Acceptance (PLANET-1492):
 * - Returns within 10 s on CI hardware.
 * - tmpDataDir is honored as XDG_DATA_HOME / APPDATA / Application Support.
 * - Teardown via `await result.app.close()` kills supervisor + all children.
 */
import { _electron as electron, type ElectronApplication, type Page } from '@playwright/test';
import path from 'node:path';
import { existsSync } from 'node:fs';

export interface LaunchOptions {
  /** Per-test isolated data dir. Will be set as XDG_DATA_HOME / APPDATA. */
  tmpDataDir: string;
  /**
   * If true, replace bundled aw-watcher-* with the fake watcher fixture
   * (see tests/e2e/fixtures/fake-watcher.ts) so events are deterministic.
   */
  fakeWatchers?: boolean;
  /** Optional script for the fake watcher (passed via env). */
  fakeWatcherScript?: string;
  /** Optional pre-set sync state ('off' default). */
  cloudSync?: 'off' | { passphrase: string; cloudUrl: string };
  /**
   * Optional override: launch a packaged Tally executable instead of dev `dist/main.js`.
   * Used by S6.5 (release artifact smoke tests).
   */
  packagedBin?: string;
}

export interface LaunchResult {
  app: ElectronApplication;
  page: Page;
  supervisor: {
    pids(): Promise<number[]>;
    serverPort(): Promise<number>;
    pause(): Promise<void>;
    resume(): Promise<void>;
  };
}

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const DESKTOP_DIR = path.join(REPO_ROOT, 'apps', 'desktop');
const DEV_MAIN = path.join(DESKTOP_DIR, 'dist', 'main.js');

function envForDataDir(dataDir: string): NodeJS.ProcessEnv {
  // Cover all three platform conventions; Electron's app.getPath('userData')
  // honours these on its respective host.
  return {
    XDG_DATA_HOME: dataDir,
    XDG_CONFIG_HOME: dataDir,
    XDG_CACHE_HOME: dataDir,
    APPDATA: dataDir,
    LOCALAPPDATA: dataDir,
    HOME: dataDir,
    // Pin Electron's userData explicitly so the main process picks it up too.
    TALLY_USER_DATA: dataDir,
    // Disable any future auto-update probes during tests.
    TALLY_DISABLE_UPDATER: '1',
  };
}

export async function launchApp(opts: LaunchOptions): Promise<LaunchResult> {
  const env = { ...process.env, ...envForDataDir(opts.tmpDataDir) };

  if (opts.fakeWatchers) {
    env.TALLY_FAKE_WATCHERS = '1';
  }
  if (opts.fakeWatcherScript) {
    env.TALLY_FAKE_WATCHER_SCRIPT = opts.fakeWatcherScript;
  }
  if (opts.cloudSync && opts.cloudSync !== 'off') {
    env.TALLY_CLOUD_URL = opts.cloudSync.cloudUrl;
    env.TALLY_CLOUD_PASSPHRASE = opts.cloudSync.passphrase;
  }

  const packagedBin = opts.packagedBin ?? process.env.TALLY_PACKAGED_BIN;

  let app: ElectronApplication;

  if (packagedBin) {
    if (!existsSync(packagedBin)) {
      throw new Error(`PLANET-1492: packaged bin not found at ${packagedBin}`);
    }
    app = await electron.launch({
      executablePath: packagedBin,
      args: [],
      env,
      timeout: 10_000,
    });
  } else {
    if (!existsSync(DEV_MAIN)) {
      throw new Error(
        `PLANET-1492: ${DEV_MAIN} missing. Run \`pnpm --filter @tally/desktop build\` first.`,
      );
    }
    app = await electron.launch({
      args: [DEV_MAIN],
      cwd: DESKTOP_DIR,
      env,
      timeout: 10_000,
    });
  }

  const page = await app.firstWindow({ timeout: 10_000 });
  // Wait for the renderer to mark itself ready (cheap deterministic gate).
  await page.waitForFunction(
    () => document.documentElement.getAttribute('data-tally-ready') === '1',
    null,
    { timeout: 8_000 },
  ).catch(() => {
    /* renderer may be slower on first paint — title check downstream catches the rest */
  });

  const supervisor = {
    async pids(): Promise<number[]> {
      // Stage 0: only the Electron main + renderer pids exist.
      try {
        return await app.evaluate(() => [process.pid]);
      } catch {
        return [];
      }
    },
    async serverPort(): Promise<number> {
      // aw-server isn't bundled yet (PLANET-1476). Return 0 to mean "no server".
      return 0;
    },
    async pause(): Promise<void> {
      // Pause/resume lands in PLANET-1480; no-op for Stage 0.
    },
    async resume(): Promise<void> {
      // Counterpart to pause(); no-op for Stage 0.
    },
  };

  return { app, page, supervisor };
}

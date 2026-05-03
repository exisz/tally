/**
 * PLANET-1492 (S6.1) — Playwright-Electron harness.
 *
 * STATUS: SKELETON. The function below is the contract; implementation belongs
 * to the engineer who picks up the story. The integration/e2e tests that rely
 * on this fixture will fail until it is implemented.
 */
import type { ElectronApplication, Page } from '@playwright/test';

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
}

export interface LaunchResult {
  app: ElectronApplication;
  page: Page;
  /** Supervisor handle exposed via test-only IPC channel `__test__/supervisor`. */
  supervisor: {
    pids(): Promise<number[]>;
    serverPort(): Promise<number>;
    pause(): Promise<void>;
    resume(): Promise<void>;
  };
}

/**
 * Boots the packaged tally Electron app for an e2e test.
 *
 * Acceptance (from PLANET-1492):
 * - Returns within 10 s on CI hardware.
 * - tmpDataDir is honored (no leakage between tests).
 * - Teardown via `await result.app.close()` kills supervisor + all children.
 */
export async function launchApp(_opts: LaunchOptions): Promise<LaunchResult> {
  throw new Error(
    'PLANET-1492 not implemented: launchApp() helper is missing. ' +
      'Implement against the contract in this file before any other e2e test can run.',
  );
}

/**
 * PLANET-1493 (S6.2) — Fake watcher binary fixture.
 *
 * STATUS: SKELETON. A small Node executable that masquerades as
 * `aw-watcher-window` (or `aw-watcher-afk`). It reads a script of timed events
 * and POSTs them to the supervised aw-server.
 *
 * The supervisor under test must be told (via env or binary-resolver override)
 * to spawn this fake instead of the real watcher.
 *
 * Script format (JSON):
 * [
 *   { "at": "+0s", "app": "VSCode", "title": "tally.project.dna", "duration": 30 },
 *   { "at": "+30s", "app": "Chrome", "title": "github.com", "duration": 30 }
 * ]
 */
export interface FakeWatcherScriptEntry {
  /** Offset from watcher start, e.g. "+5s", "+1m". */
  at: string;
  app: string;
  title: string;
  /** Event duration in seconds. */
  duration: number;
}

export interface FakeWatcherOptions {
  serverPort: number;
  bucketId: string;
  script: FakeWatcherScriptEntry[];
  /** Override the wall clock for fast-forwarding in tests. */
  clock?: 'real' | 'fast';
}

export async function runFakeWatcher(_opts: FakeWatcherOptions): Promise<void> {
  throw new Error(
    'PLANET-1493 not implemented: runFakeWatcher() is missing. ' +
      'Build a Node binary at resources/bin/<platform>/fake-aw-watcher that wraps this and accepts the script via FAKE_WATCHER_SCRIPT env.',
  );
}

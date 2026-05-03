/**
 * PLANET-1478 (S2.3) — Watchers spawn after backend ready and register buckets.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { hostname } from 'node:os';

describe('Watchers bootstrap', () => {
  let cleanup: (() => Promise<void>) | null = null;
  afterEach(async () => { if (cleanup) await cleanup(); cleanup = null; });

  it('spawns aw-watcher-window and aw-watcher-afk; both buckets exist within 10 s', async () => {
    const { Supervisor } = await import('../../src/main/supervisor').catch(() => {
      throw new Error('PLANET-1478: Supervisor module missing.');
    });
    const sup = new (Supervisor as any)({ binaryRoot: 'tests/fixtures/bin', testing: true });
    cleanup = () => sup.shutdown();

    const ready = sup.waitFor('backend-ready', 10_000);
    await sup.start();
    const { port } = await ready;

    const host = hostname();
    const deadline = Date.now() + 10_000;
    let buckets: Record<string, unknown> = {};
    while (Date.now() < deadline) {
      const r = await fetch(`http://127.0.0.1:${port}/api/0/buckets`);
      buckets = (await r.json()) as Record<string, unknown>;
      if (
        Object.keys(buckets).some((id) => id.startsWith(`aw-watcher-window_${host}`)) &&
        Object.keys(buckets).some((id) => id.startsWith(`aw-watcher-afk_${host}`))
      ) break;
      await new Promise((r) => setTimeout(r, 200));
    }
    expect(Object.keys(buckets).find((id) => id.startsWith(`aw-watcher-window_${host}`))).toBeDefined();
    expect(Object.keys(buckets).find((id) => id.startsWith(`aw-watcher-afk_${host}`))).toBeDefined();
  }, 30_000);
});

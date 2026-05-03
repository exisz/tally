/**
 * PLANET-1504 (S2.6) — External watcher REST extensibility.
 *
 * Validates AW-parity extensibility: any 3rd-party process can POST
 * buckets + events to the bundled aw-server on the loopback port and
 * have them appear in Tally's UI. Without this, AW's whole watcher
 * ecosystem (vim, vscode, jetbrains, obsidian, etc.) cannot plug in.
 */
import { describe, it, expect, afterEach } from 'vitest';

describe('External watcher → bundled aw-server', () => {
  let cleanup: (() => Promise<void>) | null = null;
  afterEach(async () => { if (cleanup) await cleanup(); cleanup = null; });

  it('accepts a foreign bucket + event over loopback', async () => {
    const { Supervisor } = await import('../../src/main/supervisor').catch(() => {
      throw new Error('PLANET-1504: Supervisor missing.');
    });
    const sup = new (Supervisor as any)({ binaryRoot: 'tests/fixtures/bin', testing: true });
    cleanup = () => sup.shutdown();
    await sup.start();
    const port = await sup.waitFor('backend-ready', 10_000).then((e: any) => e.port);

    const bucketId = 'aw-watcher-foo_test-host';
    const create = await fetch(`http://127.0.0.1:${port}/api/0/buckets/${bucketId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client: 'aw-watcher-foo', type: 'foo.activity', hostname: 'test-host' }),
    });
    expect([200, 304]).toContain(create.status);

    const post = await fetch(`http://127.0.0.1:${port}/api/0/buckets/${bucketId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([
        { timestamp: new Date().toISOString(), duration: 1, data: { foo: 'bar' } },
      ]),
    });
    expect(post.status).toBe(200);

    const r = await fetch(`http://127.0.0.1:${port}/api/0/buckets/${bucketId}/events?limit=10`);
    const events = (await r.json()) as any[];
    expect(events[0]!.data.foo).toBe('bar');
  }, 30_000);
});

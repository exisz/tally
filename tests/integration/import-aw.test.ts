/**
 * PLANET-1503 (S3.11) — Import from existing AW install.
 */
import { describe, it, expect, afterEach } from 'vitest';

describe('Import (AW JSON)', () => {
  let cleanup: (() => Promise<void>) | null = null;
  afterEach(async () => { if (cleanup) await cleanup(); cleanup = null; });

  it('imports an upstream AW export and surfaces conflicts on duplicate bucket id', async () => {
    const { Supervisor } = await import('../../src/main/supervisor').catch(() => {
      throw new Error('PLANET-1503: Supervisor missing.');
    });
    const { importAll } = await import('../../src/main/import-export').catch(() => {
      throw new Error('PLANET-1503: import-export module missing.');
    });

    const sup = new (Supervisor as any)({ binaryRoot: 'tests/fixtures/bin', testing: true });
    cleanup = () => sup.shutdown();
    await sup.start();
    const port = await sup.waitFor('backend-ready', 10_000).then((e: any) => e.port);

    // A blob shaped like upstream `aw-client export`
    const awBlob = {
      buckets: {
        'aw-watcher-window_other-host': {
          id: 'aw-watcher-window_other-host',
          type: 'currentwindow',
          client: 'aw-watcher-window',
          hostname: 'other-host',
          created: '2024-01-01T00:00:00Z',
          events: [
            { timestamp: '2024-01-01T00:00:00Z', duration: 12, data: { app: 'OldApp', title: 'old' } },
          ],
        },
      },
    };

    await (importAll as any)({ port, blob: awBlob, conflict: 'merge' });

    const r = await fetch(`http://127.0.0.1:${port}/api/0/buckets/aw-watcher-window_other-host/events?limit=10`);
    expect(r.status).toBe(200);
    const events = (await r.json()) as any[];
    expect(events.find((e) => e.data?.app === 'OldApp')).toBeDefined();

    // Re-import with conflict='cancel' on existing bucket → throws ConflictError
    await expect(
      (importAll as any)({ port, blob: awBlob, conflict: 'cancel' }),
    ).rejects.toThrow(/conflict/i);
  }, 60_000);
});

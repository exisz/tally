/**
 * PLANET-1502 (S3.10) — Export data (JSON).
 *
 * Output format MUST be a superset-compatible drop of upstream AW export:
 *   { "buckets": { "<bucket-id>": { "id":..., "type":..., "events": [...] }, ... } }
 */
import { describe, it, expect, afterEach } from 'vitest';

describe('Export', () => {
  let cleanup: (() => Promise<void>) | null = null;
  afterEach(async () => { if (cleanup) await cleanup(); cleanup = null; });

  it('exports an AW-compatible JSON blob and round-trips through import', async () => {
    const { Supervisor } = await import('../../src/main/supervisor').catch(() => {
      throw new Error('PLANET-1502: Supervisor missing.');
    });
    const { exportAll, importAll } = await import('../../src/main/import-export').catch(() => {
      throw new Error('PLANET-1502: src/main/import-export module missing.');
    });

    const sup = new (Supervisor as any)({ binaryRoot: 'tests/fixtures/bin', testing: true });
    cleanup = () => sup.shutdown();
    await sup.start();
    const port = await sup.waitFor('backend-ready', 10_000).then((e: any) => e.port);

    // Seed: one bucket, two events
    await fetch(`http://127.0.0.1:${port}/api/0/buckets/test-bucket`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client: 't', type: 'currentwindow', hostname: 'h' }),
    });
    await fetch(`http://127.0.0.1:${port}/api/0/buckets/test-bucket/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([
        { timestamp: '2026-05-01T00:00:00Z', duration: 5, data: { app: 'A', title: 't1' } },
        { timestamp: '2026-05-01T00:00:05Z', duration: 5, data: { app: 'B', title: 't2' } },
      ]),
    });

    const exported = await (exportAll as any)({ port });
    expect(exported.buckets).toBeDefined();
    expect(exported.buckets['test-bucket']).toBeDefined();
    expect(exported.buckets['test-bucket'].events).toHaveLength(2);
    const ids = exported.buckets['test-bucket'].events.map((e: any) => e.id).filter(Boolean);
    expect(new Set(ids).size).toBe(ids.length);

    // Round-trip into a fresh server
    await sup.shutdown();
    const sup2 = new (Supervisor as any)({ binaryRoot: 'tests/fixtures/bin', testing: true });
    cleanup = () => sup2.shutdown();
    await sup2.start();
    const port2 = await sup2.waitFor('backend-ready', 10_000).then((e: any) => e.port);
    await (importAll as any)({ port: port2, blob: exported, conflict: 'replace' });

    const round = await (exportAll as any)({ port: port2 });
    expect(round.buckets['test-bucket'].events).toHaveLength(2);
  }, 60_000);
});

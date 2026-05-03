/**
 * PLANET-1486 (S4.3) — Incremental sync.
 */
import { describe, it, expect } from 'vitest';

describe('Cloud sync incremental upload', () => {
  it('uploads only new events since last cursor; idempotent under retry', async () => {
    const { CloudSyncWorker } = await import('../../src/main/cloud-sync').catch(() => {
      throw new Error('PLANET-1486: CloudSyncWorker module missing.');
    });
    const calls: { url: string; bodyLen: number }[] = [];
    const worker = new (CloudSyncWorker as any)({
      cursorStore: new Map(),
      fetcher: async (url: string, init: any) => {
        const body = JSON.parse(init.body);
        calls.push({ url, bodyLen: Array.isArray(body) ? body.length : 1 });
        return { ok: true, status: 200, json: async () => ({ ok: true }) };
      },
    });

    const bucketId = 'aw-watcher-window_test';
    const ev = (id: string) => ({ id, timestamp: new Date().toISOString(), duration: 1, data: { app: 'X', title: 't' } });

    // Initial 10
    await worker.uploadBucket(bucketId, [ev('1'), ev('2'), ev('3'), ev('4'), ev('5'), ev('6'), ev('7'), ev('8'), ev('9'), ev('10')]);
    expect(calls.at(-1)!.bodyLen).toBe(10);

    // Add 5 new — exactly one PUT with body length 5
    calls.length = 0;
    await worker.uploadBucket(bucketId, [ev('11'), ev('12'), ev('13'), ev('14'), ev('15')]);
    expect(calls.length).toBe(1);
    expect(calls[0]!.bodyLen).toBe(5);

    // Retry the same batch → idempotent (no duplicates uploaded)
    calls.length = 0;
    await worker.uploadBucket(bucketId, [ev('11'), ev('12'), ev('13'), ev('14'), ev('15')]);
    expect(calls.length).toBe(0);
  });
});

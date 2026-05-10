import { describe, expect, it } from 'vitest';
import { LifeOsExporter, MemoryCursorStore, MemoryPairingStore, MockAwAdapter } from '../../src/bridge/lifeos-exporter';

const ev = (id: string, sec: number) => ({
  id,
  timestamp: `2026-05-10T00:00:${String(sec).padStart(2, '0')}Z`,
  duration: 1,
  data: { app: 'VSCode', title: `event-${id}` },
});

describe('Local ActivityWatch REST adapter', () => {
  it('lists AW buckets and events from the local API shape', async () => {
    const { LocalAwRestAdapter } = await import('../../src/bridge/lifeos-exporter');
    const seen: string[] = [];
    const adapter = new LocalAwRestAdapter({
      baseUrl: 'http://127.0.0.1:5600/',
      fetcher: async (url: string) => {
        seen.push(url);
        if (url.endsWith('/api/0/buckets')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({ bucket_from_map: { id: 'ignored_payload_id', type: 'currentwindow', hostname: 'desk' } }),
          };
        }
        return { ok: true, status: 200, json: async () => [ev('1', 1)] };
      },
    });

    const buckets = await adapter.listBuckets();
    expect(buckets).toEqual([{ id: 'bucket_from_map', type: 'currentwindow', hostname: 'desk' }]);
    const events = await adapter.listEvents('bucket/from map', { start: '2026-05-10T00:00:00Z', limit: 50 });
    expect(events[0].id).toBe('1');
    expect(seen[1]).toContain('/api/0/buckets/bucket%2Ffrom%20map/events?');
    expect(seen[1]).toContain('limit=50');
  });
});

describe('Tally LifeOS exporter bridge', () => {
  it('exchanges a pairing token, persists the device token, and sends LifeOS auth headers', async () => {
    const calls: any[] = [];
    const store = new MemoryPairingStore();
    const exporter = new LifeOsExporter(
      new MockAwAdapter([{ id: 'aw-watcher-window_test', type: 'currentwindow', hostname: 'desk', events: [ev('1', 1)] }]),
      {
        baseUrl: 'https://lifeforge.example',
        deviceId: 'mac-mini',
        pairingToken: 'pair_once',
        pairingStore: store,
        fetcher: async (url: string, init: any) => {
          calls.push({ url, init });
          if (url.endsWith('/api/activity/tally/pair/exchange')) {
            expect(JSON.parse(init.body)).toMatchObject({ pairingToken: 'pair_once', deviceId: 'mac-mini', app: 'tally-aw-bridge' });
            return { ok: true, status: 200, json: async () => ({ deviceToken: 'device_secret' }) };
          }
          return { ok: true, status: 200, json: async () => ({ ok: true }) };
        },
      },
    );

    const result = await exporter.exportOnce();
    expect(result.uploadedEvents).toBe(1);
    expect(await store.getToken()).toBe('device_secret');
    const ingest = calls.find((c) => c.url.endsWith('/api/activity/tally/ingest'));
    expect(ingest.init.headers.Authorization).toBe('Bearer device_secret');
    expect(ingest.init.headers['X-Tally-Device-Id']).toBe('mac-mini');
  });

  it('uploads only not-yet-committed AW events and dedupes retries', async () => {
    const calls: any[] = [];
    const adapter = new MockAwAdapter([{ id: 'bucket', type: 'currentwindow', events: [ev('1', 1), ev('2', 2), ev('3', 3)] }]);
    const exporter = new LifeOsExporter(adapter, {
      baseUrl: 'https://lifeforge.example',
      deviceId: 'desk',
      token: 'token',
      cursorStore: new MemoryCursorStore(),
      fetcher: async (_url: string, init: any) => {
        calls.push(JSON.parse(init.body));
        return { ok: true, status: 200, json: async () => ({ ok: true }) };
      },
    });

    await exporter.exportOnce();
    expect(calls.at(-1).buckets[0].events.map((e: any) => e.id)).toEqual(['1', '2', '3']);

    adapter['buckets'][0].events = [ev('2', 2), ev('3', 3), ev('4', 4), ev('5', 5)];
    await exporter.exportOnce();
    expect(calls.at(-1).buckets[0].events.map((e: any) => e.id)).toEqual(['4', '5']);

    const callCount = calls.length;
    await exporter.exportOnce();
    expect(calls).toHaveLength(callCount);
  });

  it('builds the documented LifeOS ingest payload shape', async () => {
    const exporter = new LifeOsExporter(
      new MockAwAdapter([{ id: 'aw-watcher-afk_host', type: 'afkstatus', hostname: 'host', events: [ev('afk-1', 1)] }]),
      { baseUrl: 'https://lifeforge.example', deviceId: 'host-1', token: 'token', fetcher: async () => ({ ok: true, status: 200, json: async () => ({ ok: true }) }) },
    );
    const payload = await exporter.buildIncrementalPayload();
    expect(payload).toMatchObject({
      source: 'tally-aw-bridge',
      deviceId: 'host-1',
      buckets: [{ id: 'aw-watcher-afk_host', type: 'afkstatus', hostname: 'host' }],
    });
    expect(payload.buckets[0].events[0]).toMatchObject({ id: 'afk-1', duration: 1, data: { app: 'VSCode' } });
  });
});

/**
 * PLANET-1481 (S3.1) — Local SDK with Zod schemas.
 */
import { describe, it, expect } from 'vitest';

describe('@tally/local-sdk', () => {
  it('lists buckets and queries events with typed schemas', async () => {
    const mod = await import('../../src/sdk/local').catch(() => {
      throw new Error('PLANET-1481: src/sdk/local module missing.');
    });
    const { createLocalClient } = mod as any;

    // Mock fetcher
    const client = createLocalClient({
      port: 5600,
      fetcher: async (url: string) => {
        if (url.endsWith('/api/0/buckets')) {
          return {
            ok: true,
            json: async () => ({
              'aw-watcher-window_host': {
                id: 'aw-watcher-window_host',
                type: 'currentwindow',
                hostname: 'host',
                created: '2026-05-02T00:00:00Z',
              },
            }),
          };
        }
        if (url.includes('/events')) {
          return {
            ok: true,
            json: async () => [
              { id: 1, timestamp: '2026-05-02T00:00:00Z', duration: 5, data: { app: 'VSCode', title: 't' } },
            ],
          };
        }
        return { ok: false, status: 404 };
      },
    });

    const buckets = await client.buckets.list();
    expect(buckets[0]!.id).toBe('aw-watcher-window_host');

    const events = await client.events.query('aw-watcher-window_host', { limit: 10 });
    expect(events[0]!.data.app).toBe('VSCode');

    // Invalid payload throws
    const bad = createLocalClient({
      port: 5600,
      fetcher: async () => ({ ok: true, json: async () => 'not-an-object' }),
    });
    await expect(bad.buckets.list()).rejects.toThrow(/zod|schema|invalid/i);
  });
});

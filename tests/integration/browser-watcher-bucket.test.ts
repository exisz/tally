/**
 * PLANET-1505 (S2.7) — aw-watcher-web bucket compatibility.
 */
import { describe, it, expect, afterEach } from 'vitest';

describe('Browser watcher (aw-watcher-web) compatibility', () => {
  let cleanup: (() => Promise<void>) | null = null;
  afterEach(async () => { if (cleanup) await cleanup(); cleanup = null; });

  it('renders web.tab.current events under Browsing default category', async () => {
    const { Supervisor } = await import('../../src/main/supervisor').catch(() => {
      throw new Error('PLANET-1505: Supervisor missing.');
    });
    const { categorize } = await import('../../src/main/categorizer').catch(() => {
      throw new Error('PLANET-1505: categorizer missing.');
    });
    const { defaultCategories } = await import('../../src/main/default-categories').catch(() => {
      throw new Error('PLANET-1505: default-categories missing — must include "Browsing" rule.');
    });

    const sup = new (Supervisor as any)({ binaryRoot: 'tests/fixtures/bin', testing: true });
    cleanup = () => sup.shutdown();
    await sup.start();
    const port = await sup.waitFor('backend-ready', 10_000).then((e: any) => e.port);

    const bucketId = 'aw-watcher-web-chrome_test-host';
    await fetch(`http://127.0.0.1:${port}/api/0/buckets/${bucketId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client: 'aw-watcher-web', type: 'web.tab.current', hostname: 'test-host' }),
    });
    const ev = {
      timestamp: new Date().toISOString(),
      duration: 30,
      data: { url: 'https://github.com/x/y', title: 'x/y', audible: false, incognito: false, tabCount: 5 },
    };
    await fetch(`http://127.0.0.1:${port}/api/0/buckets/${bucketId}/events`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([ev]),
    });

    const tagged = (categorize as any)([ev], defaultCategories);
    expect(tagged[0].category[0]).toBe('Browsing');
    expect(tagged[0].data.url).toBe('https://github.com/x/y');
  }, 30_000);
});

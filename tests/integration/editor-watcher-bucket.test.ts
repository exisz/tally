/**
 * PLANET-1506 (S2.8) — Editor watcher compatibility.
 */
import { describe, it, expect, afterEach } from 'vitest';

describe('Editor watcher (aw-watcher-vscode/vim/jetbrains) compatibility', () => {
  let cleanup: (() => Promise<void>) | null = null;
  afterEach(async () => { if (cleanup) await cleanup(); cleanup = null; });

  it('renders app.editor.activity events under Coding default category, preserving project + language', async () => {
    const { Supervisor } = await import('../../src/main/supervisor').catch(() => {
      throw new Error('PLANET-1506: Supervisor missing.');
    });
    const { categorize } = await import('../../src/main/categorizer').catch(() => {
      throw new Error('PLANET-1506: categorizer missing.');
    });
    const { defaultCategories } = await import('../../src/main/default-categories').catch(() => {
      throw new Error('PLANET-1506: default-categories module missing — must include "Coding" rule.');
    });

    const sup = new (Supervisor as any)({ binaryRoot: 'tests/fixtures/bin', testing: true });
    cleanup = () => sup.shutdown();
    await sup.start();
    const port = await sup.waitFor('backend-ready', 10_000).then((e: any) => e.port);

    const bucketId = 'aw-watcher-vscode_test-host';
    await fetch(`http://127.0.0.1:${port}/api/0/buckets/${bucketId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client: 'aw-watcher-vscode', type: 'app.editor.activity', hostname: 'test-host' }),
    });
    const ev = {
      timestamp: new Date().toISOString(),
      duration: 60,
      data: { file: '/p/src/main.ts', project: 'tally', language: 'typescript' },
    };
    await fetch(`http://127.0.0.1:${port}/api/0/buckets/${bucketId}/events`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([ev]),
    });

    const tagged = (categorize as any)([ev], defaultCategories);
    expect(tagged[0].category).toContain('Coding');
    expect(tagged[0].data.project).toBe('tally');
    expect(tagged[0].data.language).toBe('typescript');
  }, 30_000);
});

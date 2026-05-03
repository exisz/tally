/**
 * PLANET-1476 (S2.1) — Supervisor spawns aw-server and reports via IPC.
 */
import { describe, it, expect, afterEach } from 'vitest';

describe('Supervisor.spawn', () => {
  let cleanup: (() => Promise<void>) | null = null;
  afterEach(async () => { if (cleanup) await cleanup(); cleanup = null; });

  it('finds a free port in 49152-65535 and reports backend-ready', async () => {
    const { Supervisor } = await importSupervisor();
    const sup = new Supervisor({ binaryRoot: 'tests/fixtures/bin', testing: true });
    cleanup = () => sup.shutdown();

    const ready = sup.waitFor('backend-ready', 10_000);
    await sup.start();
    const evt = await ready;

    expect(evt.port).toBeGreaterThanOrEqual(49152);
    expect(evt.port).toBeLessThanOrEqual(65535);
    expect(evt.pid).toBeTypeOf('number');
    expect(evt.version).toMatch(/^\d+\.\d+/);

    const res = await fetch(`http://127.0.0.1:${evt.port}/api/0/info`);
    expect(res.status).toBe(200);
  });
});

async function importSupervisor() {
  try {
    return await import('../../src/main/supervisor');
  } catch (e) {
    throw new Error(
      'PLANET-1476: src/main/supervisor.ts is missing. ' +
        'Implement Supervisor with .start(), .shutdown(), .waitFor(event, ms).',
    );
  }
}

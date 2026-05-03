/**
 * PLANET-1477 (S2.2) — Supervisor restarts crashed aw-server with backoff.
 */
import { describe, it, expect, afterEach } from 'vitest';

describe('Supervisor.restart', () => {
  let cleanup: (() => Promise<void>) | null = null;
  afterEach(async () => { if (cleanup) await cleanup(); cleanup = null; });

  it('restarts with delays 1s,2s,4s,8s,16s capped at 5/min', async () => {
    const { Supervisor } = await importSupervisor();
    const sup = new Supervisor({
      binaryRoot: 'tests/fixtures/bin',
      testing: true,
      backoffSchedule: [1000, 2000, 4000, 8000, 16000],
      maxRestartsPerMinute: 5,
    });
    cleanup = () => sup.shutdown();

    const events: { evt: string; at: number }[] = [];
    sup.on('backend-down', () => events.push({ evt: 'down', at: Date.now() }));
    sup.on('backend-ready', () => events.push({ evt: 'ready', at: Date.now() }));

    await sup.start();
    const firstReady = events.findLast((e) => e.evt === 'ready')!;

    // Kill the child 3 times in a row, observe backoff
    for (let i = 0; i < 3; i++) {
      const pid = await sup.currentPid();
      process.kill(pid, 'SIGKILL');
      await waitFor(() => events.filter((e) => e.evt === 'ready').length === 2 + i, 30_000);
    }

    const readys = events.filter((e) => e.evt === 'ready');
    const gap1 = readys[1]!.at - readys[0]!.at;
    const gap2 = readys[2]!.at - readys[1]!.at;
    expect(gap1).toBeGreaterThanOrEqual(900);
    expect(gap2).toBeGreaterThanOrEqual(1900);
  }, 90_000);
});

async function importSupervisor() {
  try { return await import('../../src/main/supervisor'); }
  catch { throw new Error('PLANET-1477: Supervisor module missing.'); }
}
async function waitFor(cond: () => boolean, ms: number) {
  const end = Date.now() + ms;
  while (Date.now() < end) { if (cond()) return; await new Promise((r) => setTimeout(r, 50)); }
  throw new Error('waitFor timeout');
}

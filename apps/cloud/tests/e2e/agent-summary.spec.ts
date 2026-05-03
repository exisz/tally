/**
 * PLANET-1489 (S5.1) — Agent SDK getSummary.
 *
 * Runs against the deployed cloud (or PLAYWRIGHT_BASE_URL override).
 * Pattern mirrors peopleclaw/apps/admin/tests/e2e/journeys/08-scheduled-task.spec.ts.
 */
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.TALLY_CLOUD_BASE_URL ?? 'https://tally.rollersoft.com.au';
const E2E_SECRET = process.env.E2E_SECRET ?? '';
const M2M_TOKEN = process.env.TALLY_AGENT_TEST_TOKEN ?? '';

test.describe('PLANET-1489: agent.getSummary', () => {
  test.skip(!E2E_SECRET, 'E2E_SECRET not set');
  test.skip(!M2M_TOKEN, 'TALLY_AGENT_TEST_TOKEN not set');

  test('returns structured byApp/totalSec/afkSec when gateway registered', async () => {
    // Setup: seed encrypted events + register a test gateway via internal endpoint.
    const seed = await fetch(`${BASE_URL}/api/internal/e2e-seed-summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-E2E-Secret': E2E_SECRET },
      body: JSON.stringify({
        events: [
          { app: 'VSCode', durationSec: 1800 },
          { app: 'Chrome', durationSec: 600 },
          { app: 'AFK', durationSec: 300 },
        ],
      }),
    });
    expect(seed.status).toBe(200);

    const res = await fetch(`${BASE_URL}/api/v1/agent/summary?since=24h`, {
      headers: { Authorization: `Bearer ${M2M_TOKEN}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.totalSec).toBe(2700);
    expect(body.afkSec).toBe(300);
    const byApp = new Map(body.byApp.map((b: any) => [b.app, b.durationSec]));
    expect(byApp.get('VSCode')).toBe(1800);
    expect(byApp.get('Chrome')).toBe(600);
  });

  test('returns opaque blobs when no gateway is registered', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/agent/summary?since=24h&_noGateway=1`, {
      headers: { Authorization: `Bearer ${M2M_TOKEN}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.encrypted).toBe(true);
    expect(body.byApp).toBeUndefined();
  });
});

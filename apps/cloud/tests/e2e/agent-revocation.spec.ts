/**
 * PLANET-1491 (S5.3) — Token revocation propagates within 60 s.
 */
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.TALLY_CLOUD_BASE_URL ?? 'https://tally.rollersoft.com.au';
const E2E_SECRET = process.env.E2E_SECRET ?? '';

test.describe('PLANET-1491: agent token revocation', () => {
  test.skip(!E2E_SECRET, 'E2E_SECRET not set');

  test('revoked token returns 401 within 60 s; audit log captures event', async () => {
    test.setTimeout(120_000);
    const ts = Date.now();
    const mint = await fetch(`${BASE_URL}/api/internal/e2e-mint-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-E2E-Secret': E2E_SECRET },
      body: JSON.stringify({ email: `e2e-1491-${ts}@aw.test` }),
    });
    const { accessToken } = (await mint.json()) as any;

    const create = await fetch(`${BASE_URL}/api/agent-tokens`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'rev-test' }),
    });
    const { id, token } = (await create.json()) as any;

    // Token works
    let probe = await fetch(`${BASE_URL}/api/v1/agent/summary?since=24h`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 404]).toContain(probe.status); // 404 ok if no events seeded

    // Revoke
    const del = await fetch(`${BASE_URL}/api/agent-tokens/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(del.status).toBe(200);

    // Within 60 s, probe → 401
    const deadline = Date.now() + 60_000;
    while (Date.now() < deadline) {
      probe = await fetch(`${BASE_URL}/api/v1/agent/summary?since=24h`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (probe.status === 401) break;
      await new Promise((r) => setTimeout(r, 2_000));
    }
    expect(probe.status).toBe(401);

    // Audit log
    const audit = await fetch(`${BASE_URL}/api/agent-tokens/${id}/audit`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const log = (await audit.json()) as any[];
    expect(log.some((e) => e.event === 'revoked')).toBe(true);
  });
});

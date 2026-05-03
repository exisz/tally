/**
 * PLANET-1490 (S5.2) — M2M token issuance via Logto.
 */
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.TALLY_CLOUD_BASE_URL ?? 'https://tally.rollersoft.com.au';
const E2E_SECRET = process.env.E2E_SECRET ?? '';

test.describe('PLANET-1490: agent token issuance', () => {
  test.skip(!E2E_SECRET, 'E2E_SECRET not set');

  test('user can mint an M2M token shown once and bound to userId', async () => {
    const ts = Date.now();
    const mint = await fetch(`${BASE_URL}/api/internal/e2e-mint-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-E2E-Secret': E2E_SECRET },
      body: JSON.stringify({ email: `e2e-1490-${ts}@aw.test` }),
    });
    expect(mint.status).toBe(200);
    const { accessToken, sub: userId } = (await mint.json()) as any;

    const create = await fetch(`${BASE_URL}/api/agent-tokens`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'My OpenClaw' }),
    });
    expect(create.status).toBe(200);
    const created = (await create.json()) as any;
    expect(created.token).toMatch(/^[A-Za-z0-9_\-\.]{40,}$/);
    expect(created.userId).toBe(userId);

    // Token NOT retrievable on subsequent GET
    const get = await fetch(`${BASE_URL}/api/agent-tokens/${created.id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(get.status).toBe(200);
    const detail = (await get.json()) as any;
    expect(detail.token).toBeUndefined();
    expect(detail.logtoAppId).toMatch(/^[a-z0-9]{6,}$/);
  });
});

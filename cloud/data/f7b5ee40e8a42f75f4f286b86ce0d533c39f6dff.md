# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: agent-revocation.spec.ts >> PLANET-1491: agent token revocation >> revoked token returns 401 within 60 s; audit log captures event
- Location: tests/e2e/agent-revocation.spec.ts:12:7

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected value: 501
Received array: [200, 404]
```

# Test source

```ts
  1  | /**
  2  |  * PLANET-1491 (S5.3) — Token revocation propagates within 60 s.
  3  |  */
  4  | import { test, expect } from '@playwright/test';
  5  | 
  6  | const BASE_URL = process.env.TALLY_CLOUD_BASE_URL ?? 'https://tally.rollersoft.com.au';
  7  | const E2E_SECRET = process.env.E2E_SECRET ?? '';
  8  | 
  9  | test.describe('PLANET-1491: agent token revocation', () => {
  10 |   test.skip(!E2E_SECRET, 'E2E_SECRET not set');
  11 | 
  12 |   test('revoked token returns 401 within 60 s; audit log captures event', async () => {
  13 |     test.setTimeout(120_000);
  14 |     const ts = Date.now();
  15 |     const mint = await fetch(`${BASE_URL}/api/internal/e2e-mint-session`, {
  16 |       method: 'POST',
  17 |       headers: { 'Content-Type': 'application/json', 'X-E2E-Secret': E2E_SECRET },
  18 |       body: JSON.stringify({ email: `e2e-1491-${ts}@aw.test` }),
  19 |     });
  20 |     const { accessToken } = (await mint.json()) as any;
  21 | 
  22 |     const create = await fetch(`${BASE_URL}/api/agent-tokens`, {
  23 |       method: 'POST',
  24 |       headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
  25 |       body: JSON.stringify({ name: 'rev-test' }),
  26 |     });
  27 |     const { id, token } = (await create.json()) as any;
  28 | 
  29 |     // Token works
  30 |     let probe = await fetch(`${BASE_URL}/api/v1/agent/summary?since=24h`, {
  31 |       headers: { Authorization: `Bearer ${token}` },
  32 |     });
> 33 |     expect([200, 404]).toContain(probe.status); // 404 ok if no events seeded
     |                        ^ Error: expect(received).toContain(expected) // indexOf
  34 | 
  35 |     // Revoke
  36 |     const del = await fetch(`${BASE_URL}/api/agent-tokens/${id}`, {
  37 |       method: 'DELETE',
  38 |       headers: { Authorization: `Bearer ${accessToken}` },
  39 |     });
  40 |     expect(del.status).toBe(200);
  41 | 
  42 |     // Within 60 s, probe → 401
  43 |     const deadline = Date.now() + 60_000;
  44 |     while (Date.now() < deadline) {
  45 |       probe = await fetch(`${BASE_URL}/api/v1/agent/summary?since=24h`, {
  46 |         headers: { Authorization: `Bearer ${token}` },
  47 |       });
  48 |       if (probe.status === 401) break;
  49 |       await new Promise((r) => setTimeout(r, 2_000));
  50 |     }
  51 |     expect(probe.status).toBe(401);
  52 | 
  53 |     // Audit log
  54 |     const audit = await fetch(`${BASE_URL}/api/agent-tokens/${id}/audit`, {
  55 |       headers: { Authorization: `Bearer ${accessToken}` },
  56 |     });
  57 |     const log = (await audit.json()) as any[];
  58 |     expect(log.some((e) => e.event === 'revoked')).toBe(true);
  59 |   });
  60 | });
  61 | 
```
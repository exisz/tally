# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: agent-token-issue.spec.ts >> PLANET-1490: agent token issuance >> user can mint an M2M token shown once and bound to userId
- Location: tests/e2e/agent-token-issue.spec.ts:12:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 501
```

# Test source

```ts
  1  | /**
  2  |  * PLANET-1490 (S5.2) — M2M token issuance via Logto.
  3  |  */
  4  | import { test, expect } from '@playwright/test';
  5  | 
  6  | const BASE_URL = process.env.TALLY_CLOUD_BASE_URL ?? 'https://tally.rollersoft.com.au';
  7  | const E2E_SECRET = process.env.E2E_SECRET ?? '';
  8  | 
  9  | test.describe('PLANET-1490: agent token issuance', () => {
  10 |   test.skip(!E2E_SECRET, 'E2E_SECRET not set');
  11 | 
  12 |   test('user can mint an M2M token shown once and bound to userId', async () => {
  13 |     const ts = Date.now();
  14 |     const mint = await fetch(`${BASE_URL}/api/internal/e2e-mint-session`, {
  15 |       method: 'POST',
  16 |       headers: { 'Content-Type': 'application/json', 'X-E2E-Secret': E2E_SECRET },
  17 |       body: JSON.stringify({ email: `e2e-1490-${ts}@aw.test` }),
  18 |     });
> 19 |     expect(mint.status).toBe(200);
     |                         ^ Error: expect(received).toBe(expected) // Object.is equality
  20 |     const { accessToken, sub: userId } = (await mint.json()) as any;
  21 | 
  22 |     const create = await fetch(`${BASE_URL}/api/agent-tokens`, {
  23 |       method: 'POST',
  24 |       headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
  25 |       body: JSON.stringify({ name: 'My OpenClaw' }),
  26 |     });
  27 |     expect(create.status).toBe(200);
  28 |     const created = (await create.json()) as any;
  29 |     expect(created.token).toMatch(/^[A-Za-z0-9_\-\.]{40,}$/);
  30 |     expect(created.userId).toBe(userId);
  31 | 
  32 |     // Token NOT retrievable on subsequent GET
  33 |     const get = await fetch(`${BASE_URL}/api/agent-tokens/${created.id}`, {
  34 |       headers: { Authorization: `Bearer ${accessToken}` },
  35 |     });
  36 |     expect(get.status).toBe(200);
  37 |     const detail = (await get.json()) as any;
  38 |     expect(detail.token).toBeUndefined();
  39 |     expect(detail.logtoAppId).toMatch(/^[a-z0-9]{6,}$/);
  40 |   });
  41 | });
  42 | 
```
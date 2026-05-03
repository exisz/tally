import { NextResponse } from 'next/server';
import { ticketFor, type EndpointKey } from './tickets';

/**
 * Standard 501 response for unimplemented endpoints.
 * Body shape is part of the test contract — do not change without updating
 * apps/cloud/tests/e2e/*.spec.ts and tests/e2e/journeys/11-cloud-sync-enable.spec.ts.
 */
export function notImplemented(key: EndpointKey, extra: Record<string, unknown> = {}) {
  const ticket = ticketFor(key);
  return NextResponse.json(
    {
      error: 'not_implemented',
      message: `Endpoint not yet implemented; tracked by ${ticket}.`,
      ticket,
      endpoint: key,
      ...extra,
    },
    { status: 501 },
  );
}

/**
 * Internal endpoints (e2e helpers, cron) are gated by a shared secret in the
 * `X-E2E-Secret` header. Returns null on success, or a 401 NextResponse on failure.
 */
export function requireE2eSecret(req: Request): NextResponse | null {
  const expected = process.env.E2E_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: 'unauthorized', message: 'E2E_SECRET not configured on server' },
      { status: 401 },
    );
  }
  const provided = req.headers.get('x-e2e-secret');
  if (!provided || provided !== expected) {
    return NextResponse.json(
      { error: 'unauthorized', message: 'invalid or missing X-E2E-Secret header' },
      { status: 401 },
    );
  }
  return null;
}

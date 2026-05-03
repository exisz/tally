import { notImplemented, requireE2eSecret } from '@/lib/responses';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const gate = requireE2eSecret(req);
  if (gate) return gate;
  return notImplemented('internal.e2e-seed-summary');
}

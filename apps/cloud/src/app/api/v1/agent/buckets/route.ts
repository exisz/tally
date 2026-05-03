import { notImplemented } from '@/lib/responses';

export const runtime = 'nodejs';

export async function GET() {
  return notImplemented('agent.buckets');
}

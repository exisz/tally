import { notImplemented } from '@/lib/responses';

export const runtime = 'nodejs';

export async function GET() {
  return notImplemented('sync.buckets');
}

export async function POST() {
  return notImplemented('sync.buckets');
}

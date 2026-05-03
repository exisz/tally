import { notImplemented } from '@/lib/responses';

export const runtime = 'nodejs';

export async function GET() {
  return notImplemented('agent-tokens.list');
}

export async function POST() {
  return notImplemented('agent-tokens.create');
}

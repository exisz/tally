import { notImplemented } from '@/lib/responses';

export const runtime = 'nodejs';

export async function GET() {
  return notImplemented('agent-tokens.get');
}

export async function DELETE() {
  return notImplemented('agent-tokens.revoke');
}

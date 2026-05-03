/**
 * Endpoint → Jira story map (PLANET-1513 / Stage 0 skeleton).
 *
 * Every API route returns 501 with the ticket id of the story that will
 * implement it. Keep this file in sync with `tally.project.dna` §1.4.
 */
export const ENDPOINT_TICKETS = {
  // Cloud sync — S4.x (PLANET-1484..1488)
  'sync.push':           'PLANET-1484', // S4.1 enable cloud sync
  'sync.pull':           'PLANET-1484',
  'sync.buckets':        'PLANET-1484',

  // Agent API — S5.x (PLANET-1489..1491)
  'agent.summary':       'PLANET-1489', // S5.1 agent summary
  'agent.events':        'PLANET-1489',
  'agent.buckets':       'PLANET-1489',
  'agent-tokens.create': 'PLANET-1490', // S5.2 token issuance
  'agent-tokens.list':   'PLANET-1490',
  'agent-tokens.get':    'PLANET-1490',
  'agent-tokens.revoke': 'PLANET-1491', // S5.3 revocation
  'agent-tokens.audit':  'PLANET-1491',

  // Internal e2e helpers — gated by X-E2E-Secret
  'internal.e2e-mint-session':  'PLANET-1490',
  'internal.e2e-seed-summary':  'PLANET-1489',
} as const;

export type EndpointKey = keyof typeof ENDPOINT_TICKETS;

export function ticketFor(key: EndpointKey): string {
  return ENDPOINT_TICKETS[key];
}

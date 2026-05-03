/**
 * PLANET-1525 — DNA: e2e-dashboard node type registered + mandated.
 *
 * RED until:
 *  - dna://e2e-dashboard/peopleclaw + dna://e2e-dashboard/tally are scanned
 *  - both URLs return HTTP 200
 *  - dna://convention/e2e-dashboard-mandatory exists
 *  - dna://flow/setup-e2e-dashboard exists
 *  - tally + peopleclaw project specs declare e2e_dashboard: <url> in frontmatter
 */
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

function dnaLs(type: string): string[] {
  const out = execFileSync('dna', ['mesh', 'ls', '--type', type], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  return out.split('\n').map((l) => (l.match(/dna:\/\/[\w-]+\/[\w./-]+/) || [])[0]).filter(Boolean) as string[];
}

describe('PLANET-1525 e2e-dashboard DNA wiring', () => {
  it('lists ≥2 e2e-dashboard nodes (peopleclaw, tally)', () => {
    const ids = dnaLs('e2e-dashboard');
    expect(ids).toContain('dna://e2e-dashboard/peopleclaw');
    expect(ids).toContain('dna://e2e-dashboard/tally');
  });

  it('e2e-dashboard URLs are reachable (HTTP 200)', async () => {
    const urls = ['https://exisz.github.io/peopleclaw/', 'https://exisz.github.io/tally/'];
    for (const u of urls) {
      const r = await fetch(u, { cache: 'no-store' as any });
      expect(r.status, `URL ${u} not reachable (got ${r.status})`).toBe(200);
    }
  });

  it('dna://convention/e2e-dashboard-mandatory renders', () => {
    const out = execFileSync('dna', ['convention', 'e2e-dashboard-mandatory'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    expect(out).toMatch(/e2e/i);
    expect(out).toMatch(/dashboard/i);
  });

  it('dna://flow/setup-e2e-dashboard renders', () => {
    const out = execFileSync('dna', ['flow', 'setup-e2e-dashboard'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    expect(out.toLowerCase()).toMatch(/setup|step|dashboard/);
  });

  it('tally + peopleclaw project specs declare e2e_dashboard frontmatter', () => {
    const tally = readFileSync('/Users/c/.openclaw/workspaces/planetbuild/projects/tally/tally.project.dna', 'utf8');
    const pc    = readFileSync('/Users/c/.openclaw/workspaces/planetbuild/projects/peopleclaw/peopleclaw.project.dna', 'utf8');
    expect(tally).toMatch(/^e2e_dashboard:\s*\S/m);
    expect(pc).toMatch(/^e2e_dashboard:\s*\S/m);
  });
});

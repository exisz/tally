/**
 * PLANET-1523 — Self-hosted GHA runner online check.
 *
 * RED until runner is registered with required labels and ONLINE.
 */
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';

const REQUIRED_LABELS = ['self-hosted', 'macOS', 'arm64', 'mac-mini', 'tally-desktop'];

describe('PLANET-1523 self-hosted runner', () => {
  it('reports ≥1 ONLINE runner with required labels', () => {
    const raw = execFileSync(
      'gh',
      ['api', 'repos/exisz/tally/actions/runners', '--jq', '.runners'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    );
    const runners: Array<{ name: string; status: string; labels: Array<{ name: string }> }> = JSON.parse(raw || '[]');
    const ok = runners.find((r) => {
      if (r.status !== 'online') return false;
      const names = (r.labels || []).map((l) => l.name);
      return REQUIRED_LABELS.every((req) => names.includes(req));
    });
    expect(ok, `no online runner with all labels ${REQUIRED_LABELS.join(',')}; got=${JSON.stringify(runners)}`).toBeTruthy();
  });
});

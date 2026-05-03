/**
 * PLANET-1479 (S2.4) — Per-platform binary resolver.
 */
import { describe, it, expect } from 'vitest';
import { existsSync, statSync } from 'node:fs';

describe('binary-resolver', () => {
  it('resolves aw-server per platform/arch', async () => {
    const { resolveBinary } = await import('../../src/main/binary-resolver').catch(() => {
      throw new Error('PLANET-1479: binary-resolver module missing.');
    });

    const cases: { platform: string; arch: string; expected: string }[] = [
      { platform: 'darwin', arch: 'arm64', expected: 'resources/bin/darwin-arm64/aw-server' },
      { platform: 'darwin', arch: 'x64', expected: 'resources/bin/darwin-x64/aw-server' },
      { platform: 'win32', arch: 'x64', expected: 'resources/bin/win32-x64/aw-server.exe' },
      { platform: 'linux', arch: 'x64', expected: 'resources/bin/linux-x64/aw-server' },
    ];
    for (const c of cases) {
      const p = (resolveBinary as any)('aw-server', { platform: c.platform, arch: c.arch });
      expect(p).toMatch(new RegExp(c.expected.replace(/\//g, '[\\\\/]') + '$'));
    }
    expect(() => (resolveBinary as any)('aw-server', { platform: 'aix', arch: 'ppc' })).toThrow(
      /unsupported/i,
    );
  });

  it('returns existing executable file for current platform (when bundled)', async () => {
    const { resolveBinary } = await import('../../src/main/binary-resolver');
    const p = (resolveBinary as any)('aw-server');
    expect(existsSync(p)).toBe(true);
    const mode = statSync(p).mode;
    // Owner exec bit set
    expect(mode & 0o100).toBeTruthy();
  });
});

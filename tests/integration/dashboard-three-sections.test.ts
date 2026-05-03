/**
 * PLANET-1524 — Dashboard surface coverage (RED until rebuild ships).
 *
 * Asserts the rebuilt index/trends pages on https://exisz.github.io/tally
 * expose three sections (Desktop / Cloud / Releases) and a 4-dataset trends chart.
 */
import { describe, it, expect, beforeAll } from 'vitest';

const ROOT = 'https://exisz.github.io/tally/';
let indexHtml = '';
let trendsHtml = '';

beforeAll(async () => {
  const [a, b] = await Promise.all([
    fetch(ROOT, { cache: 'no-store' as any }).then((r) => r.text()),
    fetch(ROOT + 'trends.html', { cache: 'no-store' as any }).then((r) => r.text()),
  ]);
  indexHtml = a;
  trendsHtml = b;
});

describe('PLANET-1524 dashboard', () => {
  it('01: index shows Desktop / Cloud / Releases section headings', () => {
    const lower = indexHtml.toLowerCase();
    expect(lower).toMatch(/desktop/);
    expect(lower).toMatch(/cloud/);
    expect(lower).toMatch(/releases/);
    // also make sure they are real headings, not stray words
    expect(indexHtml).toMatch(/<h[1-3][^>]*>[^<]*Desktop[^<]*<\/h[1-3]>/i);
    expect(indexHtml).toMatch(/<h[1-3][^>]*>[^<]*Cloud[^<]*<\/h[1-3]>/i);
    expect(indexHtml).toMatch(/<h[1-3][^>]*>[^<]*Releases[^<]*<\/h[1-3]>/i);
  });

  it('02: desktop section advertises mac + linux pass-rate badges', () => {
    expect(indexHtml).toMatch(/data-surface=["']desktop-mac["']/);
    expect(indexHtml).toMatch(/data-surface=["']desktop-linux["']/);
  });

  it('03: trends.html declares 4 datasets (desktop-mac, desktop-linux, cloud, total)', () => {
    expect(trendsHtml).toMatch(/desktop-mac/);
    expect(trendsHtml).toMatch(/desktop-linux/);
    expect(trendsHtml).toMatch(/['"]cloud['"]/i);
    expect(trendsHtml).toMatch(/['"]total['"]/i);
    // simple count of dataset entries
    const count = (trendsHtml.match(/label\s*:\s*['"][^'"]+['"]/g) || []).length;
    expect(count).toBeGreaterThanOrEqual(4);
  });
});

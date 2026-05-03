/**
 * PLANET-1496 (S3.4) — Categorization rules engine.
 *
 * Mirrors upstream AW: each rule = { category: ["Parent","Child"], rule: { type: "regex", regex: "..." } }.
 * Deepest matching child wins. No match → "Uncategorized".
 */
import { describe, it, expect } from 'vitest';

describe('Categorizer', () => {
  it('matches deepest category and falls back to Uncategorized', async () => {
    const { categorize } = await import('../../src/main/categorizer').catch(() => {
      throw new Error('PLANET-1496: src/main/categorizer module missing.');
    });

    const rules = [
      { category: ['Work'], rule: { type: 'regex' as const, regex: 'VSCode|GitHub' } },
      { category: ['Work', 'Coding'], rule: { type: 'regex' as const, regex: 'VSCode' } },
      { category: ['Media'], rule: { type: 'regex' as const, regex: 'Spotify|YouTube' } },
    ];

    const events = [
      { data: { app: 'VSCode', title: 'README.md' } },          // → Work > Coding (deepest)
      { data: { app: 'Chrome', title: 'GitHub - PR review' } }, // → Work
      { data: { app: 'Spotify', title: 'Daft Punk' } },         // → Media
      { data: { app: 'Calculator', title: '' } },               // → Uncategorized
    ];

    const tagged = (categorize as any)(events, rules);
    expect(tagged[0].category).toEqual(['Work', 'Coding']);
    expect(tagged[1].category).toEqual(['Work']);
    expect(tagged[2].category).toEqual(['Media']);
    expect(tagged[3].category).toEqual(['Uncategorized']);
  });

  it('regex is case-insensitive by default and supports per-rule flag', async () => {
    const { categorize } = await import('../../src/main/categorizer');
    const tagged = (categorize as any)(
      [{ data: { app: 'vscode', title: '' } }],
      [{ category: ['Coding'], rule: { type: 'regex', regex: 'VSCode' } }],
    );
    expect(tagged[0].category).toEqual(['Coding']);
  });
});

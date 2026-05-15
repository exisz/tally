#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const resultsPath = process.argv[2] ?? 'test-results/results.json';
const outDir = process.argv[3] ?? 'test-results/html';
const json = JSON.parse(readFileSync(resultsPath, 'utf8'));

const total = Number(json.numTotalTests ?? 0);
const passed = Number(json.numPassedTests ?? 0);
const failed = Number(json.numFailedTests ?? 0);
const pending = Number(json.numPendingTests ?? 0) + Number(json.numTodoTests ?? 0);
const durationMs = (json.testResults ?? []).reduce((sum, suite) => {
  if (typeof suite.startTime === 'number' && typeof suite.endTime === 'number') return sum + Math.max(0, suite.endTime - suite.startTime);
  return sum + (suite.assertionResults ?? []).reduce((s, t) => s + Number(t.duration ?? 0), 0);
}, 0);
const startedAt = new Date(Number(json.startTime ?? Date.now())).toISOString();
const sha = process.env.GITHUB_SHA || process.env.COMMIT_SHA || 'local';

const status = {
  suite: 'additional-data-pipe',
  runner: 'vitest',
  reportKind: 'headless-html',
  passed,
  failed,
  pending,
  total,
  durationMs: Math.round(durationMs),
  startedAt,
  sha,
  success: failed === 0 && total > 0,
};

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'status.json'), JSON.stringify(status, null, 2) + '\n');

const csv = 'timestamp,sha,duration,total,passed,failed\n' +
  `${startedAt},${sha},${status.durationMs},${total},${passed},${failed}\n`;
writeFileSync(join(outDir, 'results.csv'), csv);

// Also keep machine-readable status at the test-results root for CI artifacts.
mkdirSync(dirname('test-results/status.json'), { recursive: true });
writeFileSync('test-results/status.json', JSON.stringify(status, null, 2) + '\n');

console.log(`Wrote ${outDir}/status.json and results.csv for ${passed}/${total} tests.`);

# tally — Test Suite

Tally is no longer a standalone PlanetBuild project with Electron/cloud/browser E2E gates. It is a LifeForge/LifeOS bridge component.

## Required suite

| Scope | Path | Runner | Purpose |
|---|---|---|---|
| Additional data pipe | `tests/bridge/lifeos-exporter.test.ts` | Vitest | Verifies ActivityWatch-compatible buckets/events are paired, deduped, and uploaded to the LifeOS ingest contract. |

Run locally:

```bash
pnpm test
pnpm test:report
```

`pnpm test:report` writes a Vitest HTML report plus `status.json`/`results.csv` under `test-results/html/`, so the central GitHub Pages testing site can keep the same rich report contract without Playwright.

## Archived tests

Old `tests/e2e/**`, `tests/unit/**`, `tests/integration/**`, and `apps/cloud/tests/e2e/**` files are historical scaffolding only. They are intentionally excluded from `vitest.config.ts` and must not be used as product gates unless Tally is re-scoped again by updating the LifeForge/Tally specs first.

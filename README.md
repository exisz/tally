# Tally

> Archived standalone ActivityWatch product plan. The surviving code is a small **ActivityWatch → LifeForge/LifeOS bridge**.

**Status:** archived as an independent product (2026-05-10). Per the project DNA, LifeForge/LifeOS now owns the user-facing activity timeline, cloud storage, mobile/PWA surface, summaries, and agent exports. This repo must not regrow a separate Tally cloud/dashboard/Electron product.

## What remains here

```
src/bridge/          Dependency-light AW bridge/exporter code
tests/bridge/        Vitest coverage for LifeOS pairing + ingest payloads
apps/desktop/        Frozen historical Electron scaffold / local helper reference
apps/cloud/          Historical superseded cloud scaffold; do not extend
```

The bridge reads local ActivityWatch-compatible buckets/events and uploads opt-in incremental payloads to a LifeOS endpoint:

- pairing: `POST /api/activity/tally/pair/exchange`
- ingest: `POST /api/activity/tally/ingest`
- auth: `Authorization: Bearer <device token>` + `X-Tally-Device-Id`

See `tally.project.dna` for the canonical pivot and hard boundaries.

## Development

```bash
pnpm install
pnpm exec vitest run tests/bridge
```

Do **not** recreate the removed GitHub Actions/Playwright workflows for Tally. CI/deploy ownership moves with the LifeForge module.

## License

TBD.

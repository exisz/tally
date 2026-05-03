# tally — Test Suite

> **TDD Source of Truth.** Every story under Epic PLANET-1470 has a test file here.
> Tests must exist and fail meaningfully **before** any implementation begins.
> See `tally.project.dna` §4 for the full rule.

## Layout

| Layer | Path | Runner |
|-------|------|--------|
| Unit | `tests/unit/` | Vitest |
| Integration | `tests/integration/` | Vitest (with child_process) |
| E2E (renderer + supervisor) | `tests/e2e/journeys/` | Playwright (electron driver) |
| E2E fixtures / POMs | `tests/e2e/fixtures/`, `tests/e2e/pages/`, `tests/e2e/helpers/` | shared |
| Cloud E2E | `apps/cloud/tests/e2e/` (separate workspace, monorepo sibling) | Playwright (HTTP) |

## Story → Test mapping

| Ticket | Test file |
|--------|-----------|
| PLANET-1471 (S1.1) | `tests/e2e/journeys/01-fresh-launch.spec.ts` |
| PLANET-1472 (S1.2) | `tests/e2e/journeys/02-tray-icon.spec.ts` |
| PLANET-1473 (S1.3) | `tests/e2e/journeys/03-autostart.spec.ts` |
| PLANET-1474 (S1.4) | `tests/e2e/journeys/04-dark-mode.spec.ts` |
| PLANET-1475 (S1.5) | `tests/e2e/journeys/06-clean-shutdown.spec.ts` |
| PLANET-1476 (S2.1) | `tests/integration/supervisor-spawn.test.ts` |
| PLANET-1477 (S2.2) | `tests/integration/supervisor-restart.test.ts` |
| PLANET-1478 (S2.3) | `tests/integration/watchers-bootstrap.test.ts` |
| PLANET-1479 (S2.4) | `tests/unit/binary-resolver.test.ts` |
| PLANET-1480 (S2.5) | `tests/e2e/journeys/07-pause-tracking.spec.ts` |
| PLANET-1481 (S3.1) | `tests/unit/local-sdk.test.ts` |
| PLANET-1482 (S3.2) | `tests/e2e/journeys/05-event-collection.spec.ts` |
| PLANET-1483 (S3.3) | `tests/e2e/journeys/10-bucket-explorer.spec.ts` |
| PLANET-1484 (S4.1) | `tests/e2e/journeys/11-cloud-sync-enable.spec.ts` |
| PLANET-1485 (S4.2) | `tests/unit/encryption.test.ts` |
| PLANET-1486 (S4.3) | `tests/integration/sync-incremental.test.ts` |
| PLANET-1487 (S4.4) | `tests/integration/sync-multi-device.test.ts` |
| PLANET-1488 (S4.5) | `tests/e2e/journeys/12-offline-mode.spec.ts` |
| PLANET-1489 (S5.1) | `apps/cloud/tests/e2e/agent-summary.spec.ts` |
| PLANET-1490 (S5.2) | `apps/cloud/tests/e2e/agent-token-issue.spec.ts` |
| PLANET-1491 (S5.3) | `apps/cloud/tests/e2e/agent-revocation.spec.ts` |
| PLANET-1492 (S6.1) | `tests/e2e/fixtures/electron-app.ts` |
| PLANET-1493 (S6.2) | `tests/e2e/fixtures/fake-watcher.ts` |
| PLANET-1494 (S6.3) | `.github/workflows/test.yml` |
| PLANET-1495 (S6.4) | `tests/e2e/journeys/13-clean-uninstall.spec.ts` |

## How a story moves to "Engineering"

Engineer pod (or human engineer) is gated on:

1. The named test file at the path above exists in `main`.
2. Running it produces a **failing** result (not "skipped", not "passed").
3. The failure mode matches the acceptance criteria in the ticket (i.e. it's failing because the feature doesn't exist, not because of a typo).

Only then may production code be written. Test file MUST NOT be modified during implementation; if the test was wrong, open a sub-task to fix the test first.

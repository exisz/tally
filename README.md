# Tally

> Agent-era ActivityWatch — privacy-first local time tracker with opt-in E2EE cloud sync and an agent API.

**Status:** Stage 0 scaffolding (TDD red foundation). Tests under `tests/` and `apps/cloud/tests/` are the source of truth; production code follows.

## Layout

```
apps/
  cloud/        Next.js 15 app at https://tally.rollersoft.com.au
                landing + /app dashboard + /api/v1/sync + /api/v1/agent
  desktop/      Electron app (Stage 1+)
packages/
  agent-sdk/    @tally/agent npm package
tests/
  unit/         Vitest unit tests (desktop)
  integration/  Vitest + child_process integration tests
  e2e/          Playwright (Electron driver) end-to-end tests
```

See `tally.project.dna` for the canonical architecture spec.

## License

TBD.

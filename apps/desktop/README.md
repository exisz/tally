# @tally/desktop

Electron shell for **Tally — agent-era ActivityWatch**. Stage 0 (PLANET-1470) ships an empty 1024×720 window that says hello; subsequent stories add the supervisor, watchers, sync, and agent API.

## Develop

```bash
pnpm install
pnpm --filter @tally/desktop dev
```

## Package locally

```bash
pnpm --filter @tally/desktop package:mac    # macOS arm64+x64 dmg
pnpm --filter @tally/desktop package:win    # Windows x64 nsis (requires Wine on non-Windows)
pnpm --filter @tally/desktop package:linux  # Linux x64 AppImage+deb
```

Output lands in `apps/desktop/release/`.

## Release

Tag the repo from `main`:

```bash
git tag v0.1.0
git push origin v0.1.0
```

`.github/workflows/release.yml` builds macOS/Windows/Linux installers in parallel and uploads them as a GitHub Release.

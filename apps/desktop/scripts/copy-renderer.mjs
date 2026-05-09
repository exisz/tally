// Renderer is plain HTML/CSS for Stage 0 — nothing to compile.
// This script exists so the build pipeline has a single `pnpm build:renderer`
// hook that future stories (Vite + React) can replace without changing CI.
console.log('[tally] renderer is plain HTML for Stage 0 — no build step required.');

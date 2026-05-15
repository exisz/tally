#!/usr/bin/env bash
# Build the lightweight Tally component test dashboard.
# Tally is no longer an independent product/E2E surface; this page exists only
# to expose the single LifeOS additional-data-pipe bridge report to the central
# GitHub Pages testing site.
set -euo pipefail

OUT="${1:-public}"
mkdir -p "$OUT"

GH_REPO="${GH_REPO:-exisz/tally}"
BASE="${DASHBOARD_BASE_URL:-https://exisz.github.io/tally}"
REPORT_PATH="${REPORT_PATH:-additional-data-pipe/}"

cat > "$OUT/index.html" <<HTML
<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Tally — Additional Data Pipe Test Report</title>
<meta name="generator" content="build-dashboard-root.sh"/>
<style>
  :root { color-scheme: dark; }
  body { font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif; max-width: 1040px; margin: 0 auto; padding: 28px; background:#090d16; color:#e5e7eb; }
  h1 { font-size: 30px; margin: 0 0 6px; letter-spacing:-.02em; }
  h2 { margin-top: 26px; }
  .lede { color:#9ca3af; max-width: 760px; line-height:1.55; }
  .card { margin-top:22px; background:linear-gradient(135deg,#111827,#17132a); border:1px solid #283044; border-radius:18px; padding:22px; box-shadow:0 18px 60px rgba(0,0,0,.28); }
  .badge { display:inline-flex; align-items:center; gap:7px; padding:6px 12px; border-radius:999px; background:#374151; color:#d1d5db; font-size:13px; font-weight:700; }
  .pass { background:#064e3b; color:#a7f3d0; }
  .fail { background:#7f1d1d; color:#fecaca; }
  .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:12px; margin:18px 0; }
  .metric { background:#0b1220; border:1px solid #1f2937; border-radius:12px; padding:14px; }
  .metric b { display:block; font-size:24px; margin-top:4px; }
  .label { color:#9ca3af; font-size:12px; text-transform:uppercase; letter-spacing:.08em; }
  a { color:#c4b5fd; }
  .btn { display:inline-block; margin-right:10px; margin-top:8px; padding:10px 14px; border-radius:10px; background:#7c3aed; color:white; text-decoration:none; font-weight:800; }
  code { background:#111827; border:1px solid #1f2937; border-radius:6px; padding:2px 6px; }
</style>
</head><body>
<h1>🧪 Tally additional data pipe</h1>
<p class="lede">Tally is now a LifeForge/LifeOS bridge component, not a standalone PlanetBuild project. This dashboard intentionally tracks one headless Vitest suite: ActivityWatch-compatible buckets/events → LifeOS pairing + ingest payload.</p>

<section class="card">
  <span class="badge" id="badge">loading…</span>
  <h2>Single required suite</h2>
  <p><code>tests/bridge/lifeos-exporter.test.ts</code> replaces the old 3-platform Playwright product gate.</p>
  <div class="grid">
    <div class="metric"><span class="label">Passed</span><b id="passed">—</b></div>
    <div class="metric"><span class="label">Failed</span><b id="failed">—</b></div>
    <div class="metric"><span class="label">Duration</span><b id="duration">—</b></div>
    <div class="metric"><span class="label">Commit</span><b id="sha">—</b></div>
  </div>
  <a class="btn" href="${REPORT_PATH}">Open HTML report →</a>
  <a class="btn" href="trends.html">Trends →</a>
  <p class="lede">Runner: <strong>Vitest HTML reporter</strong>. No Playwright browser/Electron run is required for this scope.</p>
</section>

<script>
(async () => {
  try {
    const r = await fetch('${REPORT_PATH}status.json', { cache: 'no-store' });
    if (!r.ok) throw new Error('missing status');
    const s = await r.json();
    const badge = document.getElementById('badge');
    badge.textContent = s.success ? ('✓ ' + s.passed + '/' + s.total + ' passing') : ('✗ ' + s.failed + ' failing');
    badge.classList.add(s.success ? 'pass' : 'fail');
    document.getElementById('passed').textContent = s.passed ?? 0;
    document.getElementById('failed').textContent = s.failed ?? 0;
    document.getElementById('duration').textContent = Math.round((s.durationMs ?? 0) / 1000 * 10) / 10 + 's';
    document.getElementById('sha').textContent = String(s.sha || 'local').slice(0, 7);
  } catch (_) {
    document.getElementById('badge').textContent = 'no report published yet';
  }
})();
</script>
</body></html>
HTML

cat > "$OUT/trends.html" <<'HTML'
<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Tally additional data pipe · Trends</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<style>
  body { font-family: system-ui, sans-serif; max-width: 1040px; margin:0 auto; padding:28px; background:#090d16; color:#e5e7eb; }
  a { color:#c4b5fd; } canvas { background:#111827; border:1px solid #1f2937; border-radius:14px; padding:14px; }
</style>
</head><body>
<a href="index.html">← Back</a>
<h1>📈 Additional data pipe trends</h1>
<p>Single-suite Vitest results from <code>additional-data-pipe/results.csv</code>.</p>
<canvas id="passRate"></canvas>
<script>
async function loadCsv() {
  const r = await fetch('additional-data-pipe/results.csv', { cache: 'no-store' });
  if (!r.ok) return [];
  const text = await r.text();
  return text.trim().split('\n').slice(1).filter(Boolean).map(line => {
    const [ts, sha, duration, total, passed, failed] = line.split(',');
    return { ts, sha, duration:+duration, total:+total, passed:+passed, failed:+failed };
  });
}
(async () => {
  const rows = await loadCsv();
  new Chart(document.getElementById('passRate'), {
    type: 'line',
    data: { labels: rows.map(r => (r.ts || '').slice(5,16)), datasets: [{ label:'pass rate %', data: rows.map(r => r.total ? Math.round(r.passed / r.total * 100) : 0), borderColor:'#a78bfa', tension:.3 }]},
    options: { scales: { y: { min:0, max:100 } } }
  });
})();
</script>
</body></html>
HTML

echo "✅ Built dashboard root: $OUT/index.html, $OUT/trends.html"

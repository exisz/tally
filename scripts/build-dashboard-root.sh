#!/usr/bin/env bash
# PLANET-1524 — Build the root Tally dashboard (Desktop / Cloud / Releases).
#
# Usage: scripts/build-dashboard-root.sh <output-dir>
#
# Inputs (via env, all optional):
#   GH_REPO               default: exisz/tally
#   DASHBOARD_BASE_URL    default: https://exisz.github.io/tally
#   GITHUB_TOKEN          for releases API (optional but avoids rate limit)
#
# Side-effects: writes <output-dir>/index.html and <output-dir>/trends.html
# Does NOT touch desktop/ or cloud/ subfolders that surface workflows publish.
set -euo pipefail

OUT="${1:-public}"
mkdir -p "$OUT"

GH_REPO="${GH_REPO:-exisz/tally}"
BASE="${DASHBOARD_BASE_URL:-https://exisz.github.io/tally}"

# --- Releases (best-effort) -----------------------------------------------------
RELEASES_JSON="[]"
if command -v curl >/dev/null 2>&1; then
  HDRS=(-H "Accept: application/vnd.github+json")
  if [[ -n "${GITHUB_TOKEN:-}" ]]; then HDRS+=(-H "Authorization: Bearer $GITHUB_TOKEN"); fi
  RELEASES_JSON=$(curl -sSL "${HDRS[@]}" "https://api.github.com/repos/${GH_REPO}/releases?per_page=1" || echo "[]")
fi
RELEASES_BLOCK=""
if command -v jq >/dev/null 2>&1 && [[ "$RELEASES_JSON" != "[]" ]]; then
  TAG=$(echo "$RELEASES_JSON" | jq -r '.[0].tag_name // empty' 2>/dev/null || true)
  if [[ -n "${TAG:-}" ]]; then
    PUB=$(echo "$RELEASES_JSON" | jq -r '.[0].published_at // ""')
    URL=$(echo "$RELEASES_JSON" | jq -r '.[0].html_url // ""')
    ASSETS=$(echo "$RELEASES_JSON" | jq -r '.[0].assets[]? | "<li><a href=\"" + .browser_download_url + "\">" + .name + "</a> — " + ((.size/1024/1024 | floor | tostring) + " MB") + "</li>"' | tr -d '\n')
    [[ -z "$ASSETS" ]] && ASSETS="<li><em>No binary assets attached to this release.</em></li>"
    RELEASES_BLOCK="<p><strong>Latest: <a href=\"${URL}\">${TAG}</a></strong> · published ${PUB}</p><ul>${ASSETS}</ul>"
  fi
fi
[[ -z "$RELEASES_BLOCK" ]] && RELEASES_BLOCK="<p><em>No releases published yet.</em> See <a href=\"https://github.com/${GH_REPO}/releases\">GitHub Releases</a>.</p>"

# --- Desktop / Cloud surface badges --------------------------------------------
# Each surface workflow drops a tiny status.json under its subfolder. We probe
# them via fetch() at view time so the dashboard reflects the latest result
# even if only one surface deployed.
cat > "$OUT/index.html" <<HTML
<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"/>
<title>Tally — E2E Dashboard</title>
<meta name="generator" content="PLANET-1524 build-dashboard-root.sh"/>
<style>
  :root { color-scheme: dark; }
  body { font-family: system-ui, -apple-system, Segoe UI, sans-serif; max-width: 1100px; margin: 0 auto; padding: 24px; background:#0b0f17; color:#e5e7eb; }
  h1 { font-size: 28px; margin: 0 0 4px; }
  h2 { margin: 28px 0 12px; padding-bottom: 6px; border-bottom: 1px solid #1f2937; }
  .lede { opacity: .7; margin: 0 0 24px; }
  .grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
  .card { background: #111827; border: 1px solid #1f2937; border-radius: 10px; padding: 16px; }
  .card h3 { margin: 0 0 8px; font-size: 16px; }
  .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; background:#1f2937; color:#9ca3af; font-size: 12px; margin-right:6px; }
  .pass { background: #14532d; color:#86efac; }
  .fail { background: #7f1d1d; color:#fecaca; }
  .pend { background: #374151; color:#9ca3af; }
  a { color:#a78bfa; }
  .row { display:flex; gap:16px; flex-wrap:wrap; align-items:center; margin-top:8px; }
  .top { display:flex; gap:12px; flex-wrap:wrap; }
  .btn { display:inline-block; padding: 8px 14px; background:#7c3aed; color:#fff; text-decoration:none; border-radius:6px; font-weight:600; font-size: 13px; }
  ul { padding-left: 20px; }
  code { background:#1f2937; padding:1px 6px; border-radius:4px; font-size:12px; }
</style>
</head><body>
<h1>🧪 Tally — End-to-End Dashboard</h1>
<p class="lede">Three surfaces tracked here: Electron desktop app (mac + linux), the cloud sync API, and packaged releases.</p>
<div class="top">
  <a class="btn" href="trends.html">📈 Trends</a>
  <a class="btn" href="https://github.com/${GH_REPO}/actions">⚙️ Actions</a>
  <a class="btn" href="https://github.com/${GH_REPO}/releases">📦 Releases</a>
</div>

<h2>🖥️ Desktop</h2>
<div class="grid">
  <div class="card" data-surface="desktop-mac">
    <h3>macOS · arm64 (mac-mini)</h3>
    <div class="row"><span class="badge pend" id="badge-desktop-mac">pending…</span></div>
    <p><a href="desktop/mac/">Latest Playwright report →</a></p>
  </div>
  <div class="card" data-surface="desktop-linux">
    <h3>Linux · x64 (ubuntu-latest)</h3>
    <div class="row"><span class="badge pend" id="badge-desktop-linux">pending…</span></div>
    <p><a href="desktop/linux/">Latest Playwright report →</a></p>
  </div>
</div>

<h2>☁️ Cloud</h2>
<div class="grid">
  <div class="card" data-surface="cloud">
    <h3>tally.rollersoft.com.au</h3>
    <div class="row"><span class="badge pend" id="badge-cloud">pending…</span></div>
    <p><a href="cloud/">Latest Playwright report →</a></p>
  </div>
</div>

<h2>📦 Releases</h2>
<div class="card">${RELEASES_BLOCK}</div>

<script>
async function loadBadge(surface, path) {
  try {
    const r = await fetch(path + 'status.json', { cache: 'no-store' });
    if (!r.ok) return;
    const s = await r.json();
    const el = document.getElementById('badge-' + surface);
    if (!el) return;
    const total = (s.passed || 0) + (s.failed || 0);
    const pct = total ? Math.round((s.passed || 0) / total * 100) : 0;
    el.textContent = (s.failed === 0 && total > 0)
      ? '✓ ' + s.passed + '/' + total + ' (' + pct + '%)'
      : '✗ ' + (s.failed || 0) + ' failing · ' + pct + '%';
    el.classList.remove('pend');
    el.classList.add(s.failed === 0 && total > 0 ? 'pass' : 'fail');
  } catch (e) { /* ignore */ }
}
loadBadge('desktop-mac',   'desktop/mac/');
loadBadge('desktop-linux', 'desktop/linux/');
loadBadge('cloud',         'cloud/');
</script>
</body></html>
HTML

# --- trends.html (4 datasets) --------------------------------------------------
cat > "$OUT/trends.html" <<'TRENDS'
<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"/>
<title>Tally · E2E Trends</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<style>
  body { font-family: system-ui; max-width: 1200px; margin: 0 auto; padding: 20px; background:#0b0f17; color:#e5e7eb; }
  canvas { max-height: 420px; background:#111827; border-radius:8px; padding:10px; }
  .back { display:inline-block; margin-bottom:20px; color:#a78bfa; text-decoration:none; }
  h1, h2 { color:#fff; }
  .lede { opacity:0.7; }
</style>
</head><body>
<a class="back" href="index.html">← Back to dashboard</a>
<h1>📈 Tally E2E — Trends</h1>
<p class="lede">Four datasets: <strong>desktop-mac</strong>, <strong>desktop-linux</strong>, <strong>cloud</strong>, <strong>total</strong>. Each surface writes its own row; aggregator sums them as <code>total</code>.</p>
<h2>Pass rate (%)</h2><canvas id="passRate"></canvas>
<h2>Duration (s)</h2><canvas id="duration"></canvas>
<script>
async function loadCsv(path) {
  try {
    const r = await fetch(path, { cache: 'no-store' });
    if (!r.ok) return [];
    const csv = await r.text();
    return csv.trim().split('\n').slice(1).filter(Boolean).map(line => {
      const c = line.split(',');
      return { ts: c[0], sha: c[1], duration: +c[2], total: +c[3], passed: +c[4], failed: +c[5] };
    });
  } catch (_) { return []; }
}
function rate(rows) { return rows.map(r => r.total ? Math.round(r.passed / r.total * 100) : 0); }
function dur(rows)  { return rows.map(r => Math.round(r.duration / 1000)); }
function labels(rows) { return rows.map(r => (r.ts || '').slice(5,16)); }

(async () => {
  const [mac, linux, cloud] = await Promise.all([
    loadCsv('desktop/mac/results.csv'),
    loadCsv('desktop/linux/results.csv'),
    loadCsv('cloud/results.csv'),
  ]);
  // Synthetic "total" series — average pass-rate across the three (ignores empties).
  const N = Math.max(mac.length, linux.length, cloud.length);
  const totalRows = [];
  for (let i = 0; i < N; i++) {
    const m = mac[mac.length - N + i], l = linux[linux.length - N + i], c = cloud[cloud.length - N + i];
    const present = [m, l, c].filter(Boolean);
    if (!present.length) continue;
    totalRows.push({
      ts: (m || l || c).ts,
      duration: present.reduce((s, r) => s + (r.duration || 0), 0),
      total: present.reduce((s, r) => s + (r.total || 0), 0),
      passed: present.reduce((s, r) => s + (r.passed || 0), 0),
      failed: present.reduce((s, r) => s + (r.failed || 0), 0),
    });
  }
  const lbl = labels(cloud.length ? cloud : (linux.length ? linux : (mac.length ? mac : totalRows)));

  new Chart(document.getElementById('passRate'), {
    type: 'line',
    data: { labels: lbl, datasets: [
      { label: 'desktop-mac',   data: rate(mac),   borderColor: '#36d399', tension: 0.3, fill: false },
      { label: 'desktop-linux', data: rate(linux), borderColor: '#fbbd23', tension: 0.3, fill: false },
      { label: 'cloud',         data: rate(cloud), borderColor: '#7c3aed', tension: 0.3, fill: false },
      { label: 'total',         data: rate(totalRows), borderColor: '#f87272', tension: 0.3, fill: false, borderDash: [4,4] },
    ]},
    options: { scales: { y: { min: 0, max: 100, grid: { color: '#1f2937' } }, x: { grid: { color: '#1f2937' } } } }
  });
  new Chart(document.getElementById('duration'), {
    type: 'line',
    data: { labels: lbl, datasets: [
      { label: 'desktop-mac',   data: dur(mac),   borderColor: '#36d399', tension: 0.3, fill: false },
      { label: 'desktop-linux', data: dur(linux), borderColor: '#fbbd23', tension: 0.3, fill: false },
      { label: 'cloud',         data: dur(cloud), borderColor: '#7c3aed', tension: 0.3, fill: false },
      { label: 'total',         data: dur(totalRows), borderColor: '#f87272', tension: 0.3, fill: false, borderDash: [4,4] },
    ]},
    options: { scales: { y: { min: 0, grid: { color: '#1f2937' } }, x: { grid: { color: '#1f2937' } } } }
  });
})();
</script>
</body></html>
TRENDS

echo "✅ Built dashboard root: $OUT/index.html, $OUT/trends.html"

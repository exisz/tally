import Link from 'next/link';

const PLATFORMS = [
  { os: 'macOS',   arch: 'Apple Silicon · arm64', file: 'tally-mac-arm64.dmg', icon: '🍎' },
  { os: 'macOS',   arch: 'Intel · x64',           file: 'tally-mac-x64.dmg',   icon: '🍎' },
  { os: 'Windows', arch: 'x64',                   file: 'tally-win-x64.exe',   icon: '🪟' },
  { os: 'Linux',   arch: 'x64 · AppImage',        file: 'tally-linux-x64.AppImage', icon: '🐧' },
];

export default function DownloadPage() {
  return (
    <main className="min-h-screen">
      <nav className="navbar bg-base-200/60 backdrop-blur border-b border-white/5 px-6">
        <div className="flex-1">
          <Link href="/" className="text-xl font-bold tracking-tight">
            <span className="text-primary">tally</span>
          </Link>
        </div>
        <div className="flex-none">
          <Link href="/app" className="btn btn-primary btn-sm">Open dashboard</Link>
        </div>
      </nav>

      <section className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-extrabold tracking-tight">Download Tally</h1>
        <p className="mt-3 opacity-70">
          Stage 0 — installers are not yet shipped. The list below is the planned distribution
          matrix; tracked by{' '}
          <a className="link link-primary" href="https://github.com/exisz/tally/issues">
            project issues
          </a>
          .
        </p>

        <div className="mt-10 grid sm:grid-cols-2 gap-4">
          {PLATFORMS.map((p) => (
            <div
              key={p.file}
              className="card bg-base-200/60 border border-white/5"
              data-testid={`platform-${p.file}`}
            >
              <div className="card-body">
                <h3 className="card-title text-lg">
                  <span className="text-2xl mr-2">{p.icon}</span>
                  {p.os}
                </h3>
                <p className="text-sm opacity-60">{p.arch}</p>
                <code className="text-xs opacity-40 mt-2">{p.file}</code>
                <button className="btn btn-disabled btn-sm mt-4" disabled>
                  Not available yet
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="alert alert-info mt-10 bg-info/10 border-info/30 text-info">
          <span>
            Want a heads-up when v1 ships?{' '}
            <a className="link" href="https://github.com/exisz/tally">Watch the repo</a>.
          </span>
        </div>
      </section>
    </main>
  );
}

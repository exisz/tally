import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen">
      <nav className="navbar bg-base-200/60 backdrop-blur border-b border-white/5 px-6">
        <div className="flex-1">
          <Link href="/" className="text-xl font-bold tracking-tight">
            <span className="text-primary">tally</span>
            <span className="opacity-60 text-sm font-normal ml-2">/ agent-era ActivityWatch</span>
          </Link>
        </div>
        <div className="flex-none gap-2">
          <Link href="/download" className="btn btn-ghost btn-sm">Download</Link>
          <Link href="/app" className="btn btn-primary btn-sm">Open dashboard</Link>
        </div>
      </nav>

      <section className="hero py-24">
        <div className="hero-content text-center max-w-3xl">
          <div>
            <div className="badge badge-outline badge-primary mb-6">Coming soon · Stage 0</div>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
              Your time, <span className="text-primary">local-first</span>.
              <br />
              Your agents, <span className="text-secondary">finally informed</span>.
            </h1>
            <p className="mt-6 text-lg opacity-80">
              Tally is an open-source desktop time tracker that supervises a local{' '}
              <code className="text-accent">aw-server</code> backend and lets your own AI agents
              (OpenClaw, PeopleClaw, anything) ask questions about your day — over an
              end-to-end-encrypted sync channel you control.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Link href="/download" className="btn btn-primary">Get the desktop app</Link>
              <a
                href="https://github.com/exisz/tally"
                className="btn btn-ghost"
                target="_blank"
                rel="noreferrer"
              >
                View on GitHub
              </a>
            </div>
            <p className="mt-6 text-xs opacity-50">
              Local-first · E2EE cloud sync · Agent API · macOS · Windows · Linux
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 pb-24 grid md:grid-cols-3 gap-4">
        {[
          {
            title: 'ActivityWatch parity',
            body: 'Bundles aw-server-rust + watchers. All 3rd-party AW watchers (vim, vscode, browser ext) plug in unmodified.',
          },
          {
            title: 'E2EE cloud sync',
            body: 'Events encrypted client-side with a key derived from your passphrase. Cloud sees opaque blobs only.',
          },
          {
            title: 'Agent-native',
            body: 'M2M tokens scoped to one user. Your agents query a structured summary; never see plaintext titles.',
          },
        ].map((f) => (
          <div key={f.title} className="card bg-base-200/60 border border-white/5">
            <div className="card-body">
              <h3 className="card-title text-base">{f.title}</h3>
              <p className="text-sm opacity-70">{f.body}</p>
            </div>
          </div>
        ))}
      </section>

      <footer className="footer footer-center p-6 text-xs opacity-50">
        <p>tally · PLANET-1470 · {new Date().getFullYear()}</p>
      </footer>
    </main>
  );
}

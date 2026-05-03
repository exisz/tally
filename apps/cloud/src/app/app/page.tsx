import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';

/**
 * /app — gated by Logto.
 *
 * Stage 0 contract: unauthenticated requests redirect (302) to the Logto
 * authorization endpoint; authenticated requests render a placeholder shell.
 *
 * Auth detection: a Logto-issued session cookie (`logto_<appId>`) is
 * present on the request. Full SDK integration lands in Stage 4 alongside
 * agent-token issuance (PLANET-1490).
 */
export default async function AppDashboard() {
  const cookieStore = await cookies();
  const hasLogtoSession = cookieStore
    .getAll()
    .some((c) => c.name.startsWith('logto_'));

  if (!hasLogtoSession) {
    const endpoint = process.env.LOGTO_ENDPOINT ?? 'https://id.rollersoft.com.au';
    const appId = process.env.LOGTO_APP_ID ?? '';
    const baseUrl = process.env.LOGTO_BASE_URL ?? 'https://tally.rollersoft.com.au';
    const redirectUri = `${baseUrl}/api/logto/sign-in-callback`;
    const params = new URLSearchParams({
      client_id: appId,
      response_type: 'code',
      scope: 'openid profile email offline_access',
      redirect_uri: redirectUri,
      prompt: 'consent',
    });
    redirect(`${endpoint}/oidc/auth?${params.toString()}`);
  }

  return (
    <main className="min-h-screen">
      <nav className="navbar bg-base-200/60 backdrop-blur border-b border-white/5 px-6">
        <div className="flex-1">
          <Link href="/" className="text-xl font-bold tracking-tight">
            <span className="text-primary">tally</span>
            <span className="opacity-50 text-sm font-normal ml-2">/app</span>
          </Link>
        </div>
      </nav>
      <section className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-extrabold">Dashboard</h1>
        <p className="mt-3 opacity-70">
          Stage 0 placeholder. Real dashboard lands in S3.2 (PLANET-1482).
        </p>
        <div className="mt-8 grid gap-3">
          <div className="card bg-base-200/60 border border-white/5">
            <div className="card-body">
              <h3 className="card-title text-base">Sync status</h3>
              <p className="text-sm opacity-60">Cloud sync API skeleton — see PLANET-1484.</p>
            </div>
          </div>
          <div className="card bg-base-200/60 border border-white/5">
            <div className="card-body">
              <h3 className="card-title text-base">Agent tokens</h3>
              <p className="text-sm opacity-60">Token UI lands with PLANET-1490 / PLANET-1491.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

import { useEffect, useState } from "react";

type Health = { ok: boolean };
type Me = { id: string; googleSub: string };

function apiUrl(path: string): string {
  const base = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (base && base.length > 0) {
    return `${base.replace(/\/+$/, "")}${path}`;
  }
  return path;
}

export default function App() {
  const [health, setHealth] = useState<Health | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [healthRes, meRes] = await Promise.all([
          fetch(apiUrl("/api/health"), { credentials: "include" }),
          fetch(apiUrl("/api/auth/me"), { credentials: "include" }),
        ]);
        const body = (await healthRes.json()) as Health;
        const meBody = meRes.ok ? ((await meRes.json()) as Me) : null;
        if (!cancelled) {
          setHealth(body);
          setMe(meBody);
        }
      } catch {
        if (!cancelled) {
          setError("Could not reach the API. Run `pnpm dev` from the repo root.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const authBase = apiUrl("/api/auth");

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-6 px-6 py-16">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Drive gallery</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Slice 2: Google OAuth session setup. Continue with{" "}
          <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">docs/PROPOSAL.md</code>.
        </p>
      </header>
      <section className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm">
        <p className="font-medium text-zinc-200">Authentication</p>
        {me ? (
          <p className="mt-2 text-emerald-400">
            Signed in as <span className="font-mono text-xs">{me.googleSub}</span>
          </p>
        ) : (
          <p className="mt-2 text-zinc-400">Not signed in.</p>
        )}
        <div className="mt-3 flex gap-3">
          <a
            className="rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-medium text-zinc-950 hover:bg-emerald-400"
            href={`${authBase}/google/start`}
          >
            Sign in with Google
          </a>
          <form action={`${authBase}/logout`} method="post">
            <button
              className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:border-zinc-500"
              type="submit"
            >
              Logout
            </button>
          </form>
        </div>
      </section>
      <section
        aria-live="polite"
        className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm"
      >
        <p className="font-medium text-zinc-200">API status</p>
        {error ? (
          <p className="mt-2 text-amber-300">{error}</p>
        ) : health ? (
          <p className="mt-2 text-emerald-400">Connected — health: {String(health.ok)}</p>
        ) : (
          <p className="mt-2 text-zinc-500">Checking…</p>
        )}
      </section>
    </div>
  );
}

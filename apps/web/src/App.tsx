import { useEffect, useState } from "react";

type Health = { ok: boolean };

function apiUrl(path: string): string {
  const base = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (base && base.length > 0) {
    return `${base.replace(/\/+$/, "")}${path}`;
  }
  return path;
}

export default function App() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(apiUrl("/api/health"), {
          credentials: "include",
        });
        const body = (await res.json()) as Health;
        if (!cancelled) {
          setHealth(body);
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

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-6 px-6 py-16">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Drive gallery
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Bootstrap slice: API health check. Next steps follow{" "}
          <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">
            docs/PROPOSAL.md
          </code>
          .
        </p>
      </header>
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

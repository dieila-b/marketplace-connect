import { useEffect, useState } from "react";

type FailedStep = { step: string; status: number | null; message: string };

type HealthResponse = {
  ok: boolean;
  status: "healthy" | "unhealthy";
  summary: {
    ok: boolean;
    status: "healthy" | "unhealthy";
    failedSteps: FailedStep[];
    requestId: string;
    logHint: string;
  };
  checks?: Record<string, { ok: boolean; status?: number; message: string }>;
  supabaseUrl?: string;
  requestId: string;
  timestamp?: string;
};

export function SupabaseHealthCheck() {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/public/health", {
          headers: { Accept: "application/json" },
        });
        const json = (await res.json()) as HealthResponse;
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled)
          setFetchError((e as Error).message || "Erreur inconnue");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (hidden) return null;

  if (fetchError) {
    return (
      <Banner
        ok={false}
        title="Health-check indisponible"
        onClose={() => setHidden(true)}
      >
        <p className="mt-1">Impossible d'appeler /api/public/health.</p>
        <p className="mt-2 text-sm">Détail : {fetchError}</p>
      </Banner>
    );
  }

  if (!data) return null;
  if (data.ok) return null;

  const { summary, requestId } = data;

  return (
    <Banner
      ok={false}
      title={`Supabase — statut : ${summary.status}`}
      onClose={() => setHidden(true)}
    >
      <p className="mt-1">
        {summary.failedSteps.length} étape(s) en échec sur le health-check.
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        {summary.failedSteps.map((s) => (
          <li key={s.step}>
            <span className="font-semibold">{s.step}</span>
            {s.status != null ? ` (HTTP ${s.status})` : ""} — {s.message}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs opacity-90">
        requestId :{" "}
        <code className="rounded bg-black/10 px-1 py-0.5">{requestId}</code>
      </p>
      <p className="mt-1 text-xs opacity-90">💡 {summary.logHint}</p>
      <p className="mt-1 text-xs opacity-90">
        Voir aussi :{" "}
        <a href="/api/public/health" className="underline" target="_blank" rel="noreferrer">
          /api/public/health
        </a>
      </p>
    </Banner>
  );
}

function Banner({
  ok,
  title,
  onClose,
  children,
}: {
  ok: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`w-full px-6 py-4 text-black ${ok ? "bg-green-400" : "bg-red-500"}`}
      role="alert"
    >
      <div className="mx-auto flex max-w-6xl items-start justify-between gap-4">
        <div>
          <p className="font-bold">{ok ? "✓" : "⚠"} {title}</p>
          {children}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xl font-bold"
          aria-label="Fermer"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default SupabaseHealthCheck;

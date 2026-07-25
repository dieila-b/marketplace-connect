import { useEffect, useState } from "react";
import { AlertTriangle, Copy, Check } from "lucide-react";

import { generateRequestId, getLastRequestId } from "@/lib/request-id";

type ErrorStateProps = {
  title?: string;
  message?: string;
  requestId?: string | null;
  onRetry?: () => void;
  retryLabel?: string;
  homeHref?: string;
};

/**
 * Écran d'erreur centralisé. Affiche systématiquement un `requestId` copiable
 * pour permettre de retrouver rapidement les logs serveur correspondants.
 */
export function ErrorState({
  title = "Une erreur est survenue",
  message,
  requestId,
  onRetry,
  retryLabel = "Réessayer",
  homeHref = "/",
}: ErrorStateProps) {
  const [rid, setRid] = useState<string>(
    () => requestId || getLastRequestId() || generateRequestId(),
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (requestId) setRid(requestId);
  }, [requestId]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(rid);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h1 className="text-lg font-bold text-slate-950">{title}</h1>
        {message ? (
          <p className="mt-2 break-words text-sm text-slate-500">{message}</p>
        ) : null}

        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-left">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            ID de requête
          </p>
          <div className="mt-1 flex items-center gap-2">
            <code className="flex-1 truncate rounded bg-white px-2 py-1 text-xs text-slate-800 ring-1 ring-slate-200">
              {rid}
            </code>
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
              aria-label="Copier l'ID de requête"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3" /> Copié
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" /> Copier
                </>
              )}
            </button>
          </div>
          <p className="mt-2 text-[11px] leading-snug text-slate-500">
            Communiquez cet ID au support ou recherchez-le dans les logs
            serveur pour retrouver le contexte de l'erreur.
          </p>
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90"
            >
              {retryLabel}
            </button>
          ) : null}
          <a
            href={homeHref}
            className="inline-flex items-center justify-center rounded-xl border border-input bg-background px-5 py-2.5 text-sm font-bold text-foreground hover:bg-accent"
          >
            Accueil
          </a>
        </div>
      </div>
    </main>
  );
}

export default ErrorState;

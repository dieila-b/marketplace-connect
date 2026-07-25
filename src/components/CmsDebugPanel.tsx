import { useEffect, useMemo, useState } from "react";
import { Bug, Copy, Trash2, X, ChevronDown, ChevronRight, FileJson } from "lucide-react";
import {
  clearCmsValidationEvents,
  subscribeCmsValidationEvents,
  type CmsValidationEvent,
} from "@/integrations/supabase/cms/validation-reporter";

const STORAGE_KEY = "kafoo_cms_debug";

function useCmsDebugEnabled() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const params = new URLSearchParams(window.location.search);
      const flag = params.get("debug");
      if (flag === "cms") {
        window.localStorage.setItem(STORAGE_KEY, "1");
      } else if (flag === "off") {
        window.localStorage.removeItem(STORAGE_KEY);
      }
      setEnabled(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  return [enabled, setEnabled] as const;
}

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString("fr-FR", { hour12: false }) +
    "." + String(d.getMilliseconds()).padStart(3, "0");
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    /* ignore */
  }
}

function EventRow({ event }: { event: CmsValidationEvent }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-2 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 font-semibold text-destructive">
            {open ? (
              <ChevronDown className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            )}
            <span className="truncate">{event.context}</span>
            <span className="rounded bg-destructive/15 px-1.5 py-0.5 text-[10px] uppercase">
              {event.scope}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            {formatTime(event.timestamp)} · {event.issues.length} champ(s) invalide(s)
          </div>
        </div>
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          {event.requestId && (
            <div className="flex items-center justify-between gap-2 rounded border border-border bg-background px-2 py-1">
              <span className="truncate font-mono text-[11px]">
                requestId: {event.requestId}
              </span>
              <button
                type="button"
                onClick={() => copyText(event.requestId!)}
                className="flex shrink-0 items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] hover:bg-muted/70"
                title="Copier le requestId"
              >
                <Copy className="h-3 w-3" /> Copier
              </button>
            </div>
          )}

          <ul className="space-y-1">
            {event.issues.length === 0 && (
              <li className="text-muted-foreground">
                Aucun détail — donnée manquante ou format inattendu.
              </li>
            )}
            {event.issues.map((issue, i) => (
              <li
                key={i}
                className="rounded border border-border bg-background px-2 py-1"
              >
                <div className="font-mono text-[11px] text-destructive">
                  {issue.path}
                </div>
                <div className="text-[11px] text-foreground">
                  {issue.message}
                </div>
                {issue.code && (
                  <div className="text-[10px] text-muted-foreground">
                    code: {issue.code}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function CmsDebugPanel() {
  const [enabled, setEnabled] = useCmsDebugEnabled();
  const [events, setEvents] = useState<CmsValidationEvent[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    return subscribeCmsValidationEvents(setEvents);
  }, [enabled]);

  if (!enabled) return null;

  const count = events.length;

  return (
    <div className="fixed bottom-20 right-4 z-[9999] md:bottom-4">
      {open ? (
        <div className="flex max-h-[70vh] w-[min(92vw,420px)] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
          <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Bug className="h-4 w-4 text-destructive" />
              CMS Debug ({count})
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={clearCmsValidationEvents}
                className="rounded p-1 hover:bg-muted"
                title="Vider"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded p-1 hover:bg-muted"
                title="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {count === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">
                Aucune erreur de validation CMS pour le moment.
              </p>
            ) : (
              events.map((e) => <EventRow key={e.id} event={e} />)
            )}
          </div>

          <div className="border-t border-border px-3 py-2 text-[10px] text-muted-foreground">
            Désactiver : ajouter <code>?debug=off</code> à l'URL ou{" "}
            <button
              type="button"
              className="underline"
              onClick={() => {
                try {
                  window.localStorage.removeItem(STORAGE_KEY);
                } catch {
                  /* ignore */
                }
                setEnabled(false);
              }}
            >
              cliquer ici
            </button>
            .
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold shadow-lg hover:bg-muted"
        >
          <Bug
            className={
              count > 0 ? "h-4 w-4 text-destructive" : "h-4 w-4 text-muted-foreground"
            }
          />
          CMS Debug
          {count > 0 && (
            <span className="rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold text-destructive-foreground">
              {count}
            </span>
          )}
        </button>
      )}
    </div>
  );
}

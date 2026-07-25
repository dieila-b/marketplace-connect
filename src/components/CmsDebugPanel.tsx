import { useEffect, useMemo, useState } from "react";
import {
  Bug,
  Copy,
  Filter,
  Trash2,
  X,
  ChevronDown,
  ChevronRight,
  FileJson,
} from "lucide-react";
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

function EventRow({
  event,
  onShowRaw,
}: {
  event: CmsValidationEvent;
  onShowRaw: (event: CmsValidationEvent) => void;
}) {
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

          <button
            type="button"
            onClick={() => onShowRaw(event)}
            disabled={event.sample === undefined}
            className="flex w-full items-center justify-center gap-1.5 rounded border border-border bg-background px-2 py-1.5 text-[11px] font-semibold hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FileJson className="h-3.5 w-3.5" />
            {event.sample === undefined
              ? "Réponse brute indisponible"
              : "Voir la réponse brute"}
          </button>

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

function safeStringify(value: unknown): string {
  const seen = new WeakSet();
  try {
    return JSON.stringify(
      value,
      (_key, val) => {
        if (typeof val === "bigint") return `${val.toString()}n`;
        if (val instanceof Error)
          return { name: val.name, message: val.message, stack: val.stack };
        if (val && typeof val === "object") {
          if (seen.has(val as object)) return "[Circular]";
          seen.add(val as object);
        }
        return val;
      },
      2,
    ) ?? String(value);
  } catch (err) {
    return `// Sérialisation impossible : ${(err as Error).message}\n${String(value)}`;
  }
}

function highlightPaths(issues: CmsValidationEvent["issues"]): Set<string> {
  const set = new Set<string>();
  for (const i of issues) if (i.path && i.path !== "(root)") set.add(i.path);
  return set;
}

function RawResponseModal({
  event,
  onClose,
}: {
  event: CmsValidationEvent;
  onClose: () => void;
}) {
  const json = useMemo(() => safeStringify(event.sample), [event.sample]);
  const invalidPaths = useMemo(() => highlightPaths(event.issues), [event.issues]);

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-[min(96vw,720px)] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <FileJson className="h-4 w-4 text-destructive" />
              Réponse brute — {event.context}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              {formatTime(event.timestamp)} · scope: {event.scope}
              {event.requestId && ` · requestId: ${event.requestId}`}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 hover:bg-muted"
            title="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {invalidPaths.size > 0 && (
          <div className="border-b border-border bg-destructive/5 px-4 py-2">
            <div className="text-[11px] font-semibold text-destructive">
              Champs invalides :
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              {[...invalidPaths].map((p) => (
                <code
                  key={p}
                  className="rounded bg-destructive/15 px-1.5 py-0.5 font-mono text-[10px] text-destructive"
                >
                  {p}
                </code>
              ))}
            </div>
          </div>
        )}

        <pre className="flex-1 overflow-auto whitespace-pre bg-background p-4 font-mono text-[11px] leading-relaxed">
          {event.sample === undefined ? "// Aucune donnée capturée" : json}
        </pre>

        <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-2">
          {event.requestId && (
            <button
              type="button"
              onClick={() => copyText(event.requestId!)}
              className="flex items-center gap-1 rounded border border-border bg-background px-2 py-1 text-[11px] font-semibold hover:bg-muted"
            >
              <Copy className="h-3 w-3" /> requestId
            </button>
          )}
          <button
            type="button"
            onClick={() => copyText(json)}
            className="flex items-center gap-1 rounded bg-primary px-2 py-1 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Copy className="h-3 w-3" /> Copier JSON
          </button>
        </div>
      </div>
    </div>
  );
}



const SCOPE_OPTIONS: Array<CmsValidationEvent["scope"] | "all"> = [
  "all",
  "single",
  "array-item",
  "homepage",
];

export function CmsDebugPanel() {
  const [enabled, setEnabled] = useCmsDebugEnabled();
  const [events, setEvents] = useState<CmsValidationEvent[]>([]);
  const [open, setOpen] = useState(false);
  const [rawEvent, setRawEvent] = useState<CmsValidationEvent | null>(null);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [contextFilter, setContextFilter] = useState<string>("all");
  const [scopeFilter, setScopeFilter] = useState<string>("all");
  const [requestIdFilter, setRequestIdFilter] = useState<string>("");
  const [pathFilter, setPathFilter] = useState<string>("");

  useEffect(() => {
    if (!enabled) return;
    return subscribeCmsValidationEvents(setEvents);
  }, [enabled]);

  // Distinct contexts derived from events (sorted) for the context dropdown.
  const availableContexts = useMemo(() => {
    const set = new Set<string>();
    for (const e of events) set.add(e.context);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [events]);

  const filteredEvents = useMemo(() => {
    const rid = requestIdFilter.trim().toLowerCase();
    return events.filter((e) => {
      if (contextFilter !== "all" && e.context !== contextFilter) return false;
      if (scopeFilter !== "all" && e.scope !== scopeFilter) return false;
      if (rid && !(e.requestId ?? "").toLowerCase().includes(rid)) return false;
      return true;
    });
  }, [events, contextFilter, scopeFilter, requestIdFilter]);

  const hasActiveFilter =
    contextFilter !== "all" ||
    scopeFilter !== "all" ||
    requestIdFilter.trim() !== "";

  function resetFilters() {
    setContextFilter("all");
    setScopeFilter("all");
    setRequestIdFilter("");
  }

  if (!enabled) return null;

  const count = events.length;
  const visibleCount = filteredEvents.length;

  return (
    <div className="fixed bottom-20 right-4 z-[9999] md:bottom-4">
      {open ? (
        <div className="flex max-h-[70vh] w-[min(92vw,440px)] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
          <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Bug className="h-4 w-4 text-destructive" />
              CMS Debug
              <span className="text-xs font-normal text-muted-foreground">
                {hasActiveFilter
                  ? `${visibleCount}/${count}`
                  : `(${count})`}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowFilters((v) => !v)}
                className={`rounded p-1 hover:bg-muted ${
                  hasActiveFilter ? "text-destructive" : "text-muted-foreground"
                }`}
                title="Filtrer"
                aria-pressed={showFilters}
                aria-label="Afficher/masquer les filtres"
              >
                <Filter className="h-4 w-4" />
              </button>
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

          {showFilters && (
            <div className="space-y-2 border-b border-border bg-muted/30 px-3 py-2.5">
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="cms-debug-context"
                  className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Context
                </label>
                <select
                  id="cms-debug-context"
                  value={contextFilter}
                  onChange={(e) => setContextFilter(e.target.value)}
                  className="rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="all">Tous ({count})</option>
                  {availableContexts.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label
                  htmlFor="cms-debug-scope"
                  className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Scope
                </label>
                <select
                  id="cms-debug-scope"
                  value={scopeFilter}
                  onChange={(e) => setScopeFilter(e.target.value)}
                  className="rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {SCOPE_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s === "all" ? "Tous" : s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label
                  htmlFor="cms-debug-requestid"
                  className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Request ID
                </label>
                <input
                  id="cms-debug-requestid"
                  type="text"
                  value={requestIdFilter}
                  onChange={(e) => setRequestIdFilter(e.target.value)}
                  placeholder="Coller/rechercher un requestId…"
                  className="rounded border border-border bg-background px-2 py-1 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              {hasActiveFilter && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="w-full rounded border border-border bg-background px-2 py-1 text-[11px] font-semibold hover:bg-muted"
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          )}

          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {count === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">
                Aucune erreur de validation CMS pour le moment.
              </p>
            ) : visibleCount === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">
                Aucune erreur ne correspond aux filtres actifs.
              </p>
            ) : (
              filteredEvents.map((e) => (
                <EventRow key={e.id} event={e} onShowRaw={setRawEvent} />
              ))
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

      {rawEvent && (
        <RawResponseModal event={rawEvent} onClose={() => setRawEvent(null)} />
      )}
    </div>
  );
}

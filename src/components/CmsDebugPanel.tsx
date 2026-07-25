import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bug,
  Copy,
  Filter,
  Trash2,
  X,
  ChevronDown,
  ChevronLeft,
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
  selected,
}: {
  event: CmsValidationEvent;
  onShowRaw: (event: CmsValidationEvent) => void;
  selected: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selected && rowRef.current) {
      rowRef.current.scrollIntoView({ block: "nearest" });
    }
  }, [selected]);

  return (
    <div
      ref={rowRef}
      className={`rounded-lg border p-3 text-xs transition-colors ${
        selected
          ? "border-primary bg-primary/10 ring-1 ring-primary"
          : "border-destructive/30 bg-destructive/5"
      }`}
    >
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



/**
 * Normalise a Zod issue path by dropping pure-numeric array index segments.
 * e.g. "sections.0.title" -> "sections.title"
 */
function normalizePath(path: string): string {
  return path
    .split(".")
    .filter((seg) => seg.length > 0 && !/^\d+$/.test(seg))
    .join(".");
}

/**
 * Returns true if any issue of the event has a field path matching the query.
 * Matching is case-insensitive and tolerant of nested/array paths:
 *   - raw path ("sections.0.title")
 *   - normalized path ("sections.title")
 *   - context-qualified ("CmsPage.sections.title", "CmsPage.page")
 * A search for a leaf like "title" matches "sections.0.title".
 */
function eventHasMatchingPath(event: CmsValidationEvent, query: string): boolean {
  if (!query) return true;
  const ctx = event.context.toLowerCase();
  for (const issue of event.issues) {
    const raw = issue.path.toLowerCase();
    const norm = normalizePath(issue.path).toLowerCase();
    const candidates = [
      raw,
      norm,
      `${ctx}.${raw}`,
      `${ctx}.${norm}`,
    ];
    if (candidates.some((c) => c.includes(query))) return true;
  }
  return false;
}

const SCOPE_OPTIONS: Array<CmsValidationEvent["scope"] | "all"> = [
  "all",
  "single",
  "array-item",
  "homepage",
];

// Number of error rows rendered at once. Only the current page is kept in the
// DOM, which keeps the panel cheap regardless of how many events accumulate.
const PAGE_SIZE = 10;

export function CmsDebugPanel() {
  const [enabled, setEnabled] = useCmsDebugEnabled();
  const [events, setEvents] = useState<CmsValidationEvent[]>([]);
  const [open, setOpen] = useState(false);
  const [rawEvent, setRawEvent] = useState<CmsValidationEvent | null>(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState(-1);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [contextFilter, setContextFilter] = useState<string>("all");
  const [scopeFilter, setScopeFilter] = useState<string>("all");
  const [requestIdFilter, setRequestIdFilter] = useState<string>("");
  const [pathFilter, setPathFilter] = useState<string>("");

  // Pagination
  const [page, setPage] = useState(1);

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
    const pathQ = pathFilter.trim().toLowerCase();
    return events.filter((e) => {
      if (contextFilter !== "all" && e.context !== contextFilter) return false;
      if (scopeFilter !== "all" && e.scope !== scopeFilter) return false;
      if (rid && !(e.requestId ?? "").toLowerCase().includes(rid)) return false;
      if (pathQ && !eventHasMatchingPath(e, pathQ)) return false;
      return true;
    });
  }, [events, contextFilter, scopeFilter, requestIdFilter, pathFilter]);

  // Reset to the first page whenever the active filters change.
  useEffect(() => {
    setPage(1);
    setSelectedRowIndex(-1);
  }, [contextFilter, scopeFilter, requestIdFilter, pathFilter]);

  // Latest-values snapshot for the keyboard handler. Keeping it in a ref
  // avoids re-binding the window listener on every render.
  const navRef = useRef({
    pagedEvents: [] as CmsValidationEvent[],
    safePage: 1,
    totalPages: 1,
    selectedRowIndex: -1,
    rawEvent: null as CmsValidationEvent | null,
    open: false,
  });

  useEffect(() => {
    if (!enabled) return;
    function onKeyDown(e: KeyboardEvent) {
      const s = navRef.current;
      if (!s.open) return;

      // Escape: close the raw-response modal first, then clear the selection.
      if (e.key === "Escape") {
        if (s.rawEvent) {
          e.preventDefault();
          setRawEvent(null);
        } else if (s.selectedRowIndex !== -1) {
          e.preventDefault();
          setSelectedRowIndex(-1);
        }
        return;
      }

      // Arrow / Enter navigation only when the modal is closed and focus is
      // not in a form field.
      if (s.rawEvent) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;

      const len = s.pagedEvents.length;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (len === 0) return;
        setSelectedRowIndex((prev) => {
          if (prev === -1) return 0;
          if (prev < len - 1) return prev + 1;
          if (s.safePage < s.totalPages) {
            setPage(s.safePage + 1);
            return 0;
          }
          return prev;
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (len === 0) return;
        setSelectedRowIndex((prev) => {
          if (prev === -1) return len - 1;
          if (prev > 0) return prev - 1;
          if (s.safePage > 1) {
            setPage(s.safePage - 1);
            return PAGE_SIZE - 1;
          }
          return prev;
        });
      } else if (e.key === "Enter") {
        if (s.selectedRowIndex < 0) return;
        const ev = s.pagedEvents[s.selectedRowIndex];
        if (ev && ev.sample !== undefined) {
          e.preventDefault();
          setRawEvent(ev);
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);

  const hasActiveFilter =
    contextFilter !== "all" ||
    scopeFilter !== "all" ||
    requestIdFilter.trim() !== "" ||
    pathFilter.trim() !== "";

  function resetFilters() {
    setContextFilter("all");
    setScopeFilter("all");
    setRequestIdFilter("");
    setPathFilter("");
  }

  if (!enabled) return null;

  const count = events.length;
  const visibleCount = filteredEvents.length;

  // Pagination: only the current page's rows are rendered.
  const totalPages = Math.max(1, Math.ceil(visibleCount / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const pagedEvents = filteredEvents.slice(startIndex, startIndex + PAGE_SIZE);

  // Keep the keyboard handler's snapshot in sync with the latest render.
  navRef.current = {
    pagedEvents,
    safePage,
    totalPages,
    selectedRowIndex,
    rawEvent,
    open,
  };

  // Clamp the highlighted index to the current page's rows.
  const safeSelected =
    selectedRowIndex >= 0 && selectedRowIndex < pagedEvents.length
      ? selectedRowIndex
      : -1;

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
                  htmlFor="cms-debug-path"
                  className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Chemin de champ
                </label>
                <input
                  id="cms-debug-path"
                  type="text"
                  value={pathFilter}
                  onChange={(e) => setPathFilter(e.target.value)}
                  placeholder="ex. page, sections.title, CmsPage.page…"
                  className="rounded border border-border bg-background px-2 py-1 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <span className="text-[10px] text-muted-foreground">
                  Recherche insensible à la casse —
                  les chemins nested (ex. <code>sections.0.title</code>) et
                  normalisés (ex. <code>sections.title</code>) sont pris en
                  compte.
                </span>
              </div>

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
              pagedEvents.map((e, i) => (
                <EventRow
                  key={e.id}
                  event={e}
                  onShowRaw={setRawEvent}
                  selected={i === safeSelected}
                />
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Préc.
              </button>
              <span className="text-muted-foreground">
                Page {safePage}/{totalPages} · {visibleCount} erreur(s)
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                Suiv. <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}


          <div className="border-t border-border px-3 py-2 text-[10px] text-muted-foreground">
            <div className="mb-1">
              Clavier :{" "}
              <kbd className="rounded border border-border bg-background px-1 font-sans">↑</kbd>
              /
              <kbd className="rounded border border-border bg-background px-1 font-sans">↓</kbd>{" "}
              naviguer ·{" "}
              <kbd className="rounded border border-border bg-background px-1 font-sans">Entrée</kbd>{" "}
              réponse brute ·{" "}
              <kbd className="rounded border border-border bg-background px-1 font-sans">Esc</kbd>{" "}
              fermer
            </div>
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

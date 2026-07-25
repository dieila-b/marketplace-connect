// Centralised request-id helpers used by both server (logging) and client
// (error UI). A request-id lets us match a UI error back to a server log line.

export function generateRequestId(): string {
  // Short, URL-safe, sortable-ish. Not cryptographically secure — this is a
  // correlation id, not a token.
  const rand = Math.random().toString(36).slice(2, 8);
  const time = Date.now().toString(36);
  return `${time}-${rand}`;
}

export function readRequestIdFromHeaders(headers: Headers): string {
  return (
    headers.get("x-request-id") ||
    headers.get("cf-ray") ||
    generateRequestId()
  );
}

// Client-side registry: stash the last requestId observed from a fetch/server
// response so error boundaries can display it even when the throwing code
// path didn't carry it directly.
const KEY = "__kafoo_last_request_id";

export function rememberRequestId(id: string | null | undefined) {
  if (typeof window === "undefined" || !id) return;
  try {
    (window as unknown as Record<string, string>)[KEY] = id;
    window.sessionStorage?.setItem(KEY, id);
  } catch {
    // ignore storage failures (private mode, etc.)
  }
}

export function getLastRequestId(): string | null {
  if (typeof window === "undefined") return null;
  const fromWindow = (window as unknown as Record<string, string>)[KEY];
  if (fromWindow) return fromWindow;
  try {
    return window.sessionStorage?.getItem(KEY) ?? null;
  } catch {
    return null;
  }
}

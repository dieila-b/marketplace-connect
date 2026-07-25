// In-memory reporter for CMS Zod validation failures.
// Both server (via console) and client (via debug panel) can consume the events.

import { getLastRequestId } from "@/lib/request-id";

export type CmsValidationIssue = {
  path: string;
  message: string;
  code?: string;
};

export type CmsValidationEvent = {
  id: string;
  timestamp: number;
  context: string;
  scope: "single" | "array-item" | "homepage";
  requestId: string | null;
  issues: CmsValidationIssue[];
  sample?: unknown;
};

type Listener = (events: CmsValidationEvent[]) => void;

const MAX_EVENTS = 50;
const store: CmsValidationEvent[] = [];
const listeners = new Set<Listener>();

function emit() {
  const snapshot = store.slice();
  for (const l of listeners) l(snapshot);
}

function flattenIssues(raw: unknown): CmsValidationIssue[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((issue) => {
    const i = (issue ?? {}) as Record<string, unknown>;
    const path = Array.isArray(i.path)
      ? (i.path as unknown[]).map((p) => String(p)).join(".") || "(root)"
      : "(root)";
    return {
      path,
      message: String(i.message ?? "Validation error"),
      code: typeof i.code === "string" ? i.code : undefined,
    };
  });
}

export function reportCmsValidationIssue(input: {
  context: string;
  scope: CmsValidationEvent["scope"];
  issues: unknown;
  sample?: unknown;
}) {
  const event: CmsValidationEvent = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
    context: input.context,
    scope: input.scope,
    requestId: getLastRequestId(),
    issues: flattenIssues(input.issues),
    sample: input.sample,
  };

  store.unshift(event);
  if (store.length > MAX_EVENTS) store.length = MAX_EVENTS;

  const label = `[CMS validation] ${input.context} (${input.scope})`;
  if (event.issues.length) {
    console.warn(label, event.issues, {
      requestId: event.requestId,
    });
  } else {
    console.warn(label, input.issues);
  }

  emit();
  return event;
}

export function getCmsValidationEvents(): CmsValidationEvent[] {
  return store.slice();
}

export function clearCmsValidationEvents() {
  store.length = 0;
  emit();
}

export function subscribeCmsValidationEvents(listener: Listener): () => void {
  listeners.add(listener);
  listener(store.slice());
  return () => {
    listeners.delete(listener);
  };
}

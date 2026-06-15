import "./lib/error-capture";

import process from "node:process";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  const capturedError = consumeLastCapturedError();
  const capturedMessage =
    capturedError instanceof Error ? capturedError.message : String(capturedError ?? "");

  // Bad client request to /_serverFn (missing/invalid id) can be swallowed by h3 as a 500.
  // Keep it as a client error so the preview does not replace the app with the SSR error page.
  if (capturedMessage.includes("Invalid server action param")) {
    return new Response(capturedMessage, {
      status: 400,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  console.error(capturedError ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function syncRuntimeEnv(env: unknown) {
  if (!env || typeof env !== "object") return;

  for (const [key, value] of Object.entries(env)) {
    if (typeof value === "string") {
      process.env[key] = value;
    }
  }
}

function isMalformedServerFnRequest(request: Request) {
  const pathname = new URL(request.url).pathname;
  if (pathname === "/_serverFn" || pathname === "/_serverFn/") return true;
  if (!pathname.startsWith("/_serverFn/")) return false;

  const serverFnId = pathname.slice("/_serverFn/".length).split("/")[0];
  if (!serverFnId) return true;

  try {
    const decoded = JSON.parse(atob(serverFnId.replace(/-/g, "+").replace(/_/g, "/"))) as unknown;
    return !(
      decoded != null &&
      typeof decoded === "object" &&
      "file" in decoded &&
      "export" in decoded &&
      typeof decoded.file === "string" &&
      typeof decoded.export === "string"
    );
  } catch {
    return true;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      if (isMalformedServerFnRequest(request)) {
        return new Response("Invalid request parameter", {
          status: 400,
          headers: { "content-type": "text/plain; charset=utf-8" },
        });
      }

      syncRuntimeEnv(env);
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // Bad client request to /_serverFn (missing/invalid id) — return 400, not the SSR error page.
      if (message.includes("Invalid server action param")) {
        return new Response(message, {
          status: 400,
          headers: { "content-type": "text/plain; charset=utf-8" },
        });
      }
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};

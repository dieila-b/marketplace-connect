import { createFileRoute } from "@tanstack/react-router";

// Health-check endpoint : GET /api/public/health
// Teste la présence des variables d'environnement Supabase, l'accessibilité
// de l'API REST (auth) et l'accès à une table publique.
//
// Tous les logs sont préfixés `[health-check]` et incluent un `requestId`
// pour corréler chaque étape avec la requête reçue en preview (visible dans
// `stack_modern--server-function-logs` ou dans le log dev-server).
export const Route = createFileRoute("/api/public/health")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const requestId =
          request.headers.get("cf-ray") ||
          request.headers.get("x-request-id") ||
          Math.random().toString(36).slice(2, 10);
        const startedAt = Date.now();

        const log = (
          level: "info" | "warn" | "error",
          step: string,
          extra: Record<string, unknown> = {},
        ) => {
          const payload = {
            tag: "health-check",
            requestId,
            step,
            elapsedMs: Date.now() - startedAt,
            ...extra,
          };
          const line = `[health-check] ${step} ${JSON.stringify(payload)}`;
          if (level === "error") console.error(line);
          else if (level === "warn") console.warn(line);
          else console.log(line);
        };

        log("info", "request:received", {
          method: request.method,
          url: request.url,
          userAgent: request.headers.get("user-agent") || null,
          referer: request.headers.get("referer") || null,
        });

        const url =
          process.env.APP_SUPABASE_URL ||
          process.env.SUPABASE_URL ||
          process.env.VITE_SUPABASE_URL ||
          "";
        const anonKey =
          process.env.APP_SUPABASE_ANON_KEY ||
          process.env.SUPABASE_ANON_KEY ||
          process.env.SUPABASE_PUBLISHABLE_KEY ||
          process.env.VITE_SUPABASE_ANON_KEY ||
          process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
          "";

        const checks: Record<
          string,
          { ok: boolean; status?: number; message: string }
        > = {};

        // 1. Env vars
        checks.env = {
          ok: Boolean(url && anonKey),
          message:
            url && anonKey
              ? `URL et clé anon présentes (${new URL(url).host})`
              : `Variables manquantes${!url ? " APP_SUPABASE_URL" : ""}${!anonKey ? " APP_SUPABASE_ANON_KEY" : ""}`,
        };

        log(checks.env.ok ? "info" : "error", "check:env", {
          ok: checks.env.ok,
          hasUrl: Boolean(url),
          hasAnonKey: Boolean(anonKey),
          anonKeyPrefix: anonKey ? anonKey.slice(0, 8) : null,
          host: url ? (() => { try { return new URL(url).host; } catch { return "invalid-url"; } })() : null,
        });

        if (!checks.env.ok) {
          log("error", "response:sent", { ok: false, reason: "missing-env" });
          const failedSteps = [
            { step: "env", status: null as number | null, message: checks.env.message },
          ];
          return Response.json(
            {
              ok: false,
              status: "unhealthy",
              summary: {
                ok: false,
                status: "unhealthy",
                failedSteps,
                requestId,
                logHint: `Filtrez les logs serveur par requestId="${requestId}" ou par tag [health-check].`,
              },
              checks,
              requestId,
            },
            {
              status: 200,
              headers: { "cache-control": "no-store", "x-request-id": requestId },
            },
          );
        }


        const cleanUrl = url.replace(/\/+$/, "");

        // 2. Auth endpoint reachable
        try {
          log("info", "check:auth:start", { target: `${cleanUrl}/auth/v1/settings` });
          const r = await fetch(`${cleanUrl}/auth/v1/settings`, {
            headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
          });
          checks.auth = {
            ok: r.ok,
            status: r.status,
            message: r.ok
              ? "Endpoint /auth/v1/settings joignable"
              : `Auth a répondu ${r.status} — clé anon probablement invalide pour ce projet`,
          };
          log(r.ok ? "info" : "warn", "check:auth:done", {
            ok: r.ok,
            status: r.status,
          });
        } catch (e) {
          const err = e as Error;
          checks.auth = {
            ok: false,
            message: `Impossible de joindre l'endpoint auth : ${err.message}`,
          };
          log("error", "check:auth:error", {
            name: err.name,
            message: err.message,
            stack: err.stack,
          });
        }

        // 3. REST / table access
        try {
          const target = `${cleanUrl}/rest/v1/categories?select=id&limit=1`;
          log("info", "check:database:start", { target });
          const r = await fetch(target, {
            headers: {
              apikey: anonKey,
              Authorization: `Bearer ${anonKey}`,
              Accept: "application/json",
            },
          });
          let hint = "";
          if (r.status === 401 || r.status === 403)
            hint = " — clé invalide ou RLS refuse l'accès anon";
          else if (r.status === 404)
            hint = " — la table 'categories' n'existe pas";
          checks.database = {
            ok: r.ok,
            status: r.status,
            message: r.ok
              ? "Accès à la table 'categories' OK"
              : `REST a répondu ${r.status}${hint}`,
          };
          if (!r.ok) {
            const body = await r.clone().text().catch(() => "");
            log("warn", "check:database:done", {
              ok: false,
              status: r.status,
              bodyPreview: body.slice(0, 300),
            });
          } else {
            log("info", "check:database:done", { ok: true, status: r.status });
          }
        } catch (e) {
          const err = e as Error;
          checks.database = {
            ok: false,
            message: `Impossible de joindre l'API REST : ${err.message}`,
          };
          log("error", "check:database:error", {
            name: err.name,
            message: err.message,
            stack: err.stack,
          });
        }

        const ok = Object.values(checks).every((c) => c.ok);
        log(ok ? "info" : "warn", "response:sent", {
          ok,
          checks: Object.fromEntries(
            Object.entries(checks).map(([k, v]) => [k, { ok: v.ok, status: v.status }]),
          ),
        });

        return Response.json(
          {
            ok,
            status: ok ? "healthy" : "unhealthy",
            supabaseUrl: cleanUrl,
            checks,
            requestId,
            timestamp: new Date().toISOString(),
          },
          {
            status: 200,
            headers: {
              "cache-control": "no-store",
              "x-request-id": requestId,
            },
          },
        );
      },
    },
  },
});

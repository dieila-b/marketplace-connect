import { createFileRoute } from "@tanstack/react-router";

// Health-check endpoint : GET /api/public/health
// Teste la présence des variables d'environnement Supabase, l'accessibilité
// de l'API REST (auth) et l'accès à une table publique.
export const Route = createFileRoute("/api/public/health")({
  server: {
    handlers: {
      GET: async () => {
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

        if (!checks.env.ok) {
          return Response.json(
            { ok: false, checks },
            { status: 200, headers: { "cache-control": "no-store" } },
          );
        }

        const cleanUrl = url.replace(/\/+$/, "");

        // 2. Auth endpoint reachable
        try {
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
        } catch (e) {
          checks.auth = {
            ok: false,
            message: `Impossible de joindre l'endpoint auth : ${(e as Error).message}`,
          };
        }

        // 3. REST / table access
        try {
          const r = await fetch(
            `${cleanUrl}/rest/v1/categories?select=id&limit=1`,
            {
              headers: {
                apikey: anonKey,
                Authorization: `Bearer ${anonKey}`,
                Accept: "application/json",
              },
            },
          );
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
        } catch (e) {
          checks.database = {
            ok: false,
            message: `Impossible de joindre l'API REST : ${(e as Error).message}`,
          };
        }

        const ok = Object.values(checks).every((c) => c.ok);
        return Response.json(
          {
            ok,
            status: ok ? "healthy" : "unhealthy",
            supabaseUrl: cleanUrl,
            checks,
            timestamp: new Date().toISOString(),
          },
          {
            status: 200,
            headers: { "cache-control": "no-store" },
          },
        );
      },
    },
  },
});

import { createFileRoute } from "@tanstack/react-router";

import { getServerConfig } from "@/lib/config.server";

type HealthCheck = {
  ok: boolean;
  status?: number;
  message: string;
};

/**
 * Endpoint :
 *
 * GET /api/public/health
 *
 * Vérifie :
 * 1. La configuration Supabase
 * 2. L'accessibilité de Supabase Auth
 * 3. L'accessibilité de l'API REST / base de données
 *
 * Les variables principales utilisées par Kafoo sont :
 *
 * VITE_SUPABASE_URL
 * VITE_SUPABASE_PUBLISHABLE_KEY
 *
 * Les anciens noms restent supportés en fallback,
 * mais les variables VITE sont prioritaires.
 */

export const Route = createFileRoute("/api/public/health")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const requestId =
          request.headers.get("cf-ray") ||
          request.headers.get("x-request-id") ||
          Math.random().toString(36).slice(2, 10);

        const startedAt = Date.now();

        /**
         * Logger standardisé.
         */
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

          if (level === "error") {
            console.error(line);
          } else if (level === "warn") {
            console.warn(line);
          } else {
            console.log(line);
          }
        };

        log("info", "request:received", {
          method: request.method,
          url: request.url,
          userAgent: request.headers.get("user-agent") || null,
          referer: request.headers.get("referer") || null,
        });

        /**
         * Récupération centralisée de la configuration serveur.
         */
        const config = getServerConfig();

        const url = config.supabaseUrl || "";
        const publicKey = config.supabasePublicKey || "";

        const checks: Record<string, HealthCheck> = {};

        /**
         * ---------------------------------------------------------
         * 1. Vérification des variables d'environnement
         * ---------------------------------------------------------
         */

        let parsedUrl: URL | null = null;

        try {
          parsedUrl = url ? new URL(url) : null;
        } catch {
          parsedUrl = null;
        }

        const validUrl =
          Boolean(parsedUrl) &&
          parsedUrl?.protocol === "https:" &&
          parsedUrl.hostname.endsWith(".supabase.co");

        const validKey =
          publicKey.startsWith("eyJ") ||
          publicKey.startsWith("sb_publishable_");

        checks.env = {
          ok: Boolean(url && publicKey && validUrl && validKey),

          message:
            url && publicKey && validUrl && validKey
              ? `Configuration Supabase détectée (${parsedUrl?.host})`
              : !url
                ? "VITE_SUPABASE_URL est manquante"
                : !validUrl
                  ? `URL Supabase invalide : ${url}`
                  : !publicKey
                    ? "VITE_SUPABASE_PUBLISHABLE_KEY est manquante"
                    : "La clé Supabase n'a pas un format reconnu",
        };

        log(
          checks.env.ok ? "info" : "error",
          "check:env",
          {
            ok: checks.env.ok,

            hasUrl: Boolean(url),

            hasPublicKey: Boolean(publicKey),

            urlSource:
              config.supabaseUrlSource || "unknown",

            keySource:
              config.supabaseKeySource || "unknown",

            keyPrefix: publicKey
              ? publicKey.slice(0, 12)
              : null,

            host: parsedUrl?.host || null,
          },
        );

        /**
         * Si la configuration est invalide,
         * inutile de continuer les tests réseau.
         */
        if (!checks.env.ok) {
          const failedSteps = [
            {
              step: "env",
              status: null as number | null,
              message: checks.env.message,
            },
          ];

          log(
            "error",
            "response:sent",
            {
              ok: false,
              reason: "invalid-env",
            },
          );

          return Response.json(
            {
              ok: false,

              status: "unhealthy",

              summary: {
                ok: false,

                status: "unhealthy",

                failedSteps,

                requestId,

                logHint:
                  `Filtrez les logs serveur par requestId="${requestId}" ` +
                  `ou par tag [health-check].`,
              },

              checks,

              /**
               * Diagnostic sans exposer la clé.
               */
              configuration: {
                supabaseUrl: url || null,

                urlSource:
                  config.supabaseUrlSource || null,

                keySource:
                  config.supabaseKeySource || null,

                keyType: publicKey.startsWith(
                  "sb_publishable_",
                )
                  ? "publishable"
                  : publicKey.startsWith("eyJ")
                    ? "legacy-anon-jwt"
                    : "unknown",
              },

              requestId,
            },
            {
              status: 200,

              headers: {
                "cache-control": "no-store",
                "x-request-id": requestId,
              },
            },
          );
        }

        /**
         * ---------------------------------------------------------
         * Préparation des headers Supabase
         * ---------------------------------------------------------
         *
         * Le header apikey fonctionne avec :
         *
         * - les anciennes clés anon JWT : eyJ...
         * - les nouvelles clés : sb_publishable_...
         *
         * Pour une ancienne clé JWT anon,
         * on ajoute également Authorization.
         *
         * Pour sb_publishable_, on évite d'envoyer
         * la clé comme JWT Bearer.
         */

        const supabaseHeaders: Record<
          string,
          string
        > = {
          apikey: publicKey,
          Accept: "application/json",
        };

        if (publicKey.startsWith("eyJ")) {
          supabaseHeaders.Authorization =
            `Bearer ${publicKey}`;
        }

        /**
         * Fonction permettant de générer un message
         * adapté au véritable code HTTP retourné.
         */
        const getHttpErrorMessage = (
          service: string,
          status: number,
        ): string => {
          if (
            status === 401 ||
            status === 403
          ) {
            return (
              `${service} a répondu ${status} — ` +
              "clé API invalide, non autorisée ou incompatible avec ce projet"
            );
          }

          if (status === 404) {
            return (
              `${service} a répondu 404 — ` +
              "ressource ou endpoint introuvable"
            );
          }

          if (status === 429) {
            return (
              `${service} a répondu 429 — ` +
              "trop de requêtes"
            );
          }

          if (status === 530) {
            return (
              `${service} a répondu 530 — ` +
              "le service Supabase ou son infrastructure amont " +
              "n'est actuellement pas disponible pour ce projet. " +
              "Ce code ne signifie pas nécessairement que la clé API est invalide."
            );
          }

          if (status === 540) {
            return (
              `${service} a répondu 540 — ` +
              "le projet Supabase semble être en pause"
            );
          }

          if (status === 544) {
            return (
              `${service} a répondu 544 — ` +
              "timeout de la passerelle API Supabase"
            );
          }

          if (status >= 500) {
            return (
              `${service} a répondu ${status} — ` +
              "erreur serveur ou service Supabase temporairement indisponible"
            );
          }

          return `${service} a répondu ${status}`;
        };

        /**
         * ---------------------------------------------------------
         * 2. Vérification Supabase Auth
         * ---------------------------------------------------------
         */

        try {
          const target =
            `${url}/auth/v1/settings`;

          log(
            "info",
            "check:auth:start",
            {
              target,
            },
          );

          const response = await fetch(
            target,
            {
              method: "GET",

              headers: supabaseHeaders,
            },
          );

          let bodyPreview = "";

          if (!response.ok) {
            bodyPreview = await response
              .clone()
              .text()
              .catch(() => "");
          }

          checks.auth = {
            ok: response.ok,

            status: response.status,

            message: response.ok
              ? "Supabase Auth est accessible"
              : getHttpErrorMessage(
                  "Auth",
                  response.status,
                ),
          };

          log(
            response.ok ? "info" : "warn",
            "check:auth:done",
            {
              ok: response.ok,

              status: response.status,

              bodyPreview: bodyPreview.slice(
                0,
                300,
              ),
            },
          );
        } catch (error) {
          const err = error as Error;

          checks.auth = {
            ok: false,

            message:
              `Impossible de joindre Supabase Auth : ${err.message}`,
          };

          log(
            "error",
            "check:auth:error",
            {
              name: err.name,
              message: err.message,
              stack: err.stack,
            },
          );
        }

        /**
         * ---------------------------------------------------------
         * 3. Vérification API REST / Database
         * ---------------------------------------------------------
         */

        try {
          const target =
            `${url}/rest/v1/categories?select=id&limit=1`;

          log(
            "info",
            "check:database:start",
            {
              target,
            },
          );

          const response = await fetch(
            target,
            {
              method: "GET",

              headers: supabaseHeaders,
            },
          );

          let message: string;

          if (response.ok) {
            message =
              "API REST et table 'categories' accessibles";
          } else if (
            response.status === 401 ||
            response.status === 403
          ) {
            message =
              `REST a répondu ${response.status} — ` +
              "clé invalide, accès anon interdit ou politique RLS restrictive";
          } else if (
            response.status === 404
          ) {
            message =
              "REST a répondu 404 — la table 'categories' n'existe pas ou n'est pas exposée";
          } else {
            message =
              getHttpErrorMessage(
                "REST",
                response.status,
              );
          }

          checks.database = {
            ok: response.ok,

            status: response.status,

            message,
          };

          if (!response.ok) {
            const body = await response
              .clone()
              .text()
              .catch(() => "");

            log(
              "warn",
              "check:database:done",
              {
                ok: false,

                status: response.status,

                bodyPreview: body.slice(
                  0,
                  300,
                ),
              },
            );
          } else {
            log(
              "info",
              "check:database:done",
              {
                ok: true,

                status: response.status,
              },
            );
          }
        } catch (error) {
          const err = error as Error;

          checks.database = {
            ok: false,

            message:
              `Impossible de joindre l'API REST Supabase : ${err.message}`,
          };

          log(
            "error",
            "check:database:error",
            {
              name: err.name,
              message: err.message,
              stack: err.stack,
            },
          );
        }

        /**
         * ---------------------------------------------------------
         * Résultat global
         * ---------------------------------------------------------
         */

        const ok = Object.values(
          checks,
        ).every(
          (check) => check.ok,
        );

        const failedSteps =
          Object.entries(checks)
            .filter(
              ([, check]) =>
                !check.ok,
            )
            .map(
              ([step, check]) => ({
                step,

                status:
                  check.status ?? null,

                message:
                  check.message,
              }),
            );

        log(
          ok ? "info" : "warn",
          "response:sent",
          {
            ok,

            checks:
              Object.fromEntries(
                Object.entries(
                  checks,
                ).map(
                  ([key, value]) => [
                    key,
                    {
                      ok: value.ok,

                      status:
                        value.status,
                    },
                  ],
                ),
              ),
          },
        );

        /**
         * ---------------------------------------------------------
         * Réponse
         * ---------------------------------------------------------
         */

        return Response.json(
          {
            ok,

            status: ok
              ? "healthy"
              : "unhealthy",

            summary: {
              ok,

              status: ok
                ? "healthy"
                : "unhealthy",

              failedSteps,

              requestId,

              logHint: ok
                ? "Aucune étape échouée."
                : `Filtrez les logs serveur par requestId="${requestId}" ou par tag [health-check].`,
            },

            /**
             * Permet de vérifier quel projet
             * est réellement utilisé.
             */
            configuration: {
              supabaseUrl: url,

              host:
                parsedUrl?.host ||
                null,

              urlSource:
                config.supabaseUrlSource ||
                null,

              keySource:
                config.supabaseKeySource ||
                null,

              keyType:
                publicKey.startsWith(
                  "sb_publishable_",
                )
                  ? "publishable"
                  : "legacy-anon-jwt",
            },

            checks,

            requestId,

            timestamp:
              new Date().toISOString(),
          },
          {
            status: 200,

            headers: {
              "cache-control":
                "no-store",

              "x-request-id":
                requestId,
            },
          },
        );
      },
    },
  },
});

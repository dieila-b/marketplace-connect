import { useEffect, useState } from "react";
import { initSupabase } from "@/integrations/supabase/client";

type Status =
  | { state: "checking" }
  | { state: "ok" }
  | { state: "error"; title: string; detail: string; hint?: string };

// Vérifie automatiquement que la liaison Supabase fonctionne :
// 1) config (URL + anon key) présente,
// 2) auth.getSession() répond,
// 3) une requête sur une table publique (profiles) répond sans erreur réseau/permissions.
export function SupabaseHealthCheck() {
  const [status, setStatus] = useState<Status>({ state: "checking" });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const client = await initSupabase();

        // 1) AUTH
        const { error: authError } = await client.auth.getSession();
        if (authError) {
          throw {
            title: "Erreur d'authentification Supabase",
            detail: authError.message,
            hint: "Vérifie que l'URL et la clé anon correspondent bien au projet Supabase actif.",
          };
        }

        // 2) Accès à une table (profiles) — head+count évite de charger des lignes
        const { error: dbError } = await client
          .from("profiles")
          .select("id", { head: true, count: "exact" });

        if (dbError) {
          const msg = dbError.message || "";
          let hint =
            "Vérifie que la table 'profiles' existe et qu'une policy RLS autorise la lecture (anon ou authenticated).";
          if (/JWT|Invalid API key|Expected 3 parts/i.test(msg)) {
            hint =
              "La clé anon est invalide ou ne correspond pas au projet. Regénère/remplace APP_SUPABASE_ANON_KEY.";
          } else if (/permission denied|not.*allowed/i.test(msg)) {
            hint =
              "Permissions manquantes : ajoute GRANT SELECT ON public.profiles TO anon/authenticated et une policy RLS de lecture.";
          } else if (/relation .* does not exist|not find the table/i.test(msg)) {
            hint =
              "La table 'profiles' est absente du projet Supabase connecté. Vérifie que c'est bien le bon projet (OCAZ).";
          } else if (/Failed to fetch|NetworkError/i.test(msg)) {
            hint =
              "Impossible de joindre Supabase. Vérifie APP_SUPABASE_URL et la connectivité réseau.";
          }
          throw {
            title: "Erreur d'accès à la base Supabase",
            detail: msg,
            hint,
          };
        }

        if (!cancelled) setStatus({ state: "ok" });
      } catch (e: unknown) {
        if (cancelled) return;
        if (e && typeof e === "object" && "title" in e) {
          setStatus(e as Exclude<Status, { state: "checking" } | { state: "ok" }>);
        } else {
          const msg = e instanceof Error ? e.message : String(e);
          let hint =
            "Vérifie les secrets APP_SUPABASE_URL et APP_SUPABASE_ANON_KEY dans Lovable Cloud.";
          if (/Secrets manquants/i.test(msg)) {
            hint =
              "Ajoute les secrets APP_SUPABASE_URL et APP_SUPABASE_ANON_KEY, puis recharge la page.";
          }
          setStatus({
            state: "error",
            title: "Liaison Supabase indisponible",
            detail: msg,
            hint,
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (status.state !== "error" || dismissed) return null;

  return (
    <div
      role="alert"
      className="fixed inset-x-0 top-0 z-[100] border-b border-destructive/40 bg-destructive text-destructive-foreground shadow-lg"
    >
      <div className="mx-auto flex w-full max-w-6xl items-start gap-3 px-4 py-3">
        <div className="flex-1 text-sm">
          <div className="font-bold">⚠ {status.title}</div>
          <div className="mt-1 opacity-90 break-words">{status.detail}</div>
          {status.hint && (
            <div className="mt-1 text-xs opacity-80">💡 {status.hint}</div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="rounded-md px-2 py-1 text-xs font-bold hover:bg-black/20"
          aria-label="Fermer"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

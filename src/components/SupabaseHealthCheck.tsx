import { useEffect, useState } from "react";

type HealthStatus = {
  ok: boolean;
  title: string;
  message: string;
  details?: string;
};

const normalizeSupabaseUrl = (value?: string) => {
  if (!value) return "";

  return String(value)
    .trim()
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/+$/, "");
};

const normalizeSupabaseKey = (value?: string) => {
  if (!value) return "";

  return String(value).trim();
};

const isValidSupabaseKeyFormat = (key: string) => {
  if (!key) return false;

  // Ancienne clé anon JWT Supabase : commence généralement par eyJ...
  if (key.startsWith("eyJ")) return true;

  // Nouvelle clé publishable Supabase : commence souvent par sb_publishable_...
  if (key.startsWith("sb_publishable_")) return true;

  return false;
};

const getSupabaseConfig = () => {
  const url = normalizeSupabaseUrl(
    import.meta.env.VITE_SUPABASE_URL ||
      import.meta.env.APP_SUPABASE_URL ||
      import.meta.env.SUPABASE_URL,
  );

  const possibleKeys = [
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    import.meta.env.APP_SUPABASE_ANON_KEY,
    import.meta.env.SUPABASE_ANON_KEY,
    import.meta.env.SUPABASE_PUBLISHABLE_KEY,
  ]
    .map((key) => normalizeSupabaseKey(key))
    .filter(Boolean)
    .filter((key) => !key.includes("supabase.co"))
    .filter((key) => !key.includes("/rest/v1"))
    .filter(isValidSupabaseKeyFormat);

  const anonKey = possibleKeys[0] || "";

  return { url, anonKey };
};

export function SupabaseHealthCheck() {
  const [status, setStatus] = useState<HealthStatus | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const checkSupabase = async () => {
      const { url, anonKey } = getSupabaseConfig();

      if (!url || !anonKey) {
        setStatus({
          ok: false,
          title: "Configuration Supabase manquante",
          message:
            "Les variables Supabase ne sont pas correctement configurées dans l’environnement.",
          details:
            "Vérifie dans Netlify : VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY. L’URL doit être sans /rest/v1/ et la clé doit commencer par eyJ... ou sb_publishable_...",
        });
        return;
      }

      try {
        const response = await fetch(
          `${url}/rest/v1/categories?select=id&limit=1`,
          {
            method: "GET",
            headers: {
              apikey: anonKey,
              Authorization: `Bearer ${anonKey}`,
              Accept: "application/json",
            },
          },
        );

        if (response.ok) {
          setStatus({
            ok: true,
            title: "Supabase connecté",
            message: "La liaison Supabase fonctionne correctement.",
          });
          return;
        }

        if (response.status === 404) {
          setStatus({
            ok: false,
            title: "Tables Supabase manquantes",
            message: "La table categories n’existe pas encore dans Supabase.",
            details:
              "Crée les tables dans Supabase via SQL Editor, puis redéploie le site.",
          });
          return;
        }

        if (response.status === 401 || response.status === 403) {
          setStatus({
            ok: false,
            title: "Clé Supabase invalide",
            message:
              "La clé Supabase ne correspond pas au projet configuré ou n’a pas les droits nécessaires.",
            details:
              "Dans Netlify, vérifie que VITE_SUPABASE_URL vaut https://pvedsyclugdunyodkpob.supabase.co et que VITE_SUPABASE_PUBLISHABLE_KEY contient uniquement la clé anon/public du même projet.",
          });
          return;
        }

        const errorText = await response.text();

        setStatus({
          ok: false,
          title: "Réponse Supabase inattendue",
          message: `Supabase a répondu avec le statut ${response.status}.`,
          details:
            errorText ||
            "Vérifie l’URL, la clé anon/public et l’existence de la table categories.",
        });
      } catch (error) {
        setStatus({
          ok: false,
          title: "Liaison Supabase indisponible",
          message: "Impossible de joindre Supabase.",
          details:
            "Vérifie VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY et la connexion réseau.",
        });
      }
    };

    checkSupabase();
  }, []);

  if (!status || status.ok || hidden) {
    return null;
  }

  return (
    <div className="w-full bg-red-500 px-6 py-4 text-black">
      <div className="mx-auto flex max-w-6xl items-start justify-between gap-4">
        <div>
          <p className="font-bold">⚠ {status.title}</p>
          <p className="mt-1">{status.message}</p>
          {status.details && <p className="mt-2 text-sm">💡 {status.details}</p>}
        </div>

        <button
          type="button"
          onClick={() => setHidden(true)}
          className="text-xl font-bold"
          aria-label="Fermer"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default SupabaseHealthCheck;
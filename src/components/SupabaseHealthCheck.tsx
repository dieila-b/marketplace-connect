import { useEffect, useState } from "react";

type HealthStatus = {
  ok: boolean;
  title: string;
  message: string;
  details?: string;
};

const getSupabaseConfig = () => {
  const url =
    import.meta.env.VITE_SUPABASE_URL ||
    import.meta.env.APP_SUPABASE_URL;

  const anonKey =
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.APP_SUPABASE_ANON_KEY;

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
            "Les variables Supabase ne sont pas configurées dans l’environnement.",
          details:
            "Ajoute VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY dans Netlify, puis redéploie le site.",
        });
        return;
      }

      try {
        const cleanUrl = String(url).replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
        const response = await fetch(`${cleanUrl}/rest/v1/`, {
          method: "GET",
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
          },
        });

        if (response.status === 401 || response.status === 403) {
          setStatus({
            ok: false,
            title: "Clé Supabase invalide",
            message:
              "La clé Supabase ne correspond pas au projet configuré.",
            details:
              "Vérifie que VITE_SUPABASE_PUBLISHABLE_KEY correspond bien à la clé anon/public du projet Supabase.",
          });
          return;
        }

        setStatus({
          ok: true,
          title: "Supabase connecté",
          message: "La liaison Supabase fonctionne correctement.",
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
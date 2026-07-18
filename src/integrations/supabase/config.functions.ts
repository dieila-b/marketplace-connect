/**
 * Configuration Supabase
 *
 * Variables recommandées dans Netlify :
 *
 * VITE_SUPABASE_URL
 * VITE_SUPABASE_PUBLISHABLE_KEY
 *
 * Pour assurer la compatibilité avec les anciennes configurations,
 * VITE_SUPABASE_ANON_KEY est également acceptée.
 */

/**
 * Configuration de secours.
 *
 * Elle permet au site de fonctionner même si les variables
 * d'environnement ne sont temporairement pas injectées par Netlify.
 */
const FALLBACK_SUPABASE_URL =
  "https://pvedsyclugdunyodkpob.supabase.co";

const FALLBACK_SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2ZWRzeWNsdWdkdW55b2RrcG9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4MzA1NjIsImV4cCI6MjA5OTQwNjU2Mn0.zM80KCjkaNfg0o488f_xewkrGxkjZUEpfxwT-Gb_XQc";

/**
 * Nettoie automatiquement l'URL Supabase.
 *
 * Exemple :
 *
 * https://xxx.supabase.co/rest/v1/
 *
 * devient :
 *
 * https://xxx.supabase.co
 */
function normalizeSupabaseUrl(value: string): string {
  return value
    .trim()
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/+$/, "");
}

/**
 * Nettoie la clé Supabase.
 */
function normalizeSupabaseKey(value: string): string {
  return value.trim();
}

/**
 * Vérifie que l'URL ressemble à une URL Supabase valide.
 */
function isValidSupabaseUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);

    return (
      parsedUrl.protocol === "https:" &&
      parsedUrl.hostname.endsWith(".supabase.co")
    );
  } catch {
    return false;
  }
}

/**
 * Vérifie les formats de clés Supabase actuellement supportés.
 *
 * Ancienne clé anon :
 * eyJ...
 *
 * Nouvelle clé publishable :
 * sb_publishable_...
 */
function isValidSupabaseKey(key: string): boolean {
  return (
    key.startsWith("eyJ") ||
    key.startsWith("sb_publishable_")
  );
}

/**
 * Retourne la configuration Supabase utilisée par l'application.
 */
export async function getSupabaseConfig(): Promise<{
  url: string;
  anonKey: string;
}> {
  /**
   * URL définie dans Netlify.
   */
  const envUrl = import.meta.env
    .VITE_SUPABASE_URL as string | undefined;

  /**
   * Priorité :
   *
   * 1. VITE_SUPABASE_PUBLISHABLE_KEY
   * 2. VITE_SUPABASE_ANON_KEY
   * 3. Clé de secours
   */
  const envPublishableKey = import.meta.env
    .VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

  const envAnonKey = import.meta.env
    .VITE_SUPABASE_ANON_KEY as string | undefined;

  const url = normalizeSupabaseUrl(
    envUrl || FALLBACK_SUPABASE_URL
  );

  const anonKey = normalizeSupabaseKey(
    envPublishableKey ||
      envAnonKey ||
      FALLBACK_SUPABASE_KEY
  );

  /**
   * Vérification de l'URL
   */
  if (!url) {
    throw new Error(
      "Configuration Supabase manquante : VITE_SUPABASE_URL n'est pas définie."
    );
  }

  if (!isValidSupabaseUrl(url)) {
    throw new Error(
      `URL Supabase invalide : "${url}". ` +
        "L'URL doit être de la forme https://xxxx.supabase.co et ne doit pas contenir /rest/v1/."
    );
  }

  /**
   * Vérification de la clé
   */
  if (!anonKey) {
    throw new Error(
      "Configuration Supabase manquante : aucune clé Supabase n'est définie."
    );
  }

  if (!isValidSupabaseKey(anonKey)) {
    throw new Error(
      "Clé Supabase invalide. La clé doit commencer par 'eyJ' ou 'sb_publishable_'."
    );
  }

  return {
    url,
    anonKey,
  };
}

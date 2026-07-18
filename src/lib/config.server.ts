import process from "node:process";

/**
 * Configuration serveur centralisée.
 *
 * Ce fichier est server-only grâce au suffixe .server.ts.
 * Les valeurs sont lues à chaque requête afin d'être compatibles
 * avec les environnements serverless / Netlify.
 */

type EnvResult = {
  value: string;
  source: string | null;
};

/**
 * Retourne la première variable d'environnement définie et non vide.
 */
function getFirstEnv(
  candidates: Array<[string, string | undefined]>,
): EnvResult {
  for (const [name, value] of candidates) {
    if (typeof value === "string" && value.trim() !== "") {
      return {
        value: value.trim(),
        source: name,
      };
    }
  }

  return {
    value: "",
    source: null,
  };
}

/**
 * Nettoie l'URL Supabase.
 *
 * Accepte par exemple :
 * https://xxx.supabase.co
 * https://xxx.supabase.co/
 * https://xxx.supabase.co/rest/v1/
 *
 * Retourne toujours :
 * https://xxx.supabase.co
 */
function normalizeSupabaseUrl(value: string): string {
  if (!value) return "";

  return value
    .trim()
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/+$/, "");
}

/**
 * Retourne la configuration serveur.
 *
 * IMPORTANT :
 * Les variables VITE actuellement utilisées par Kafoo sont prioritaires.
 * Cela évite qu'une ancienne variable APP_SUPABASE_URL ou SUPABASE_URL
 * pointe encore vers un ancien projet Supabase.
 */
export function getServerConfig() {
  const supabaseUrlResult = getFirstEnv([
    ["VITE_SUPABASE_URL", process.env.VITE_SUPABASE_URL],
    ["APP_SUPABASE_URL", process.env.APP_SUPABASE_URL],
    ["SUPABASE_URL", process.env.SUPABASE_URL],
  ]);

  const supabaseKeyResult = getFirstEnv([
    [
      "VITE_SUPABASE_PUBLISHABLE_KEY",
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    ],
    ["VITE_SUPABASE_ANON_KEY", process.env.VITE_SUPABASE_ANON_KEY],
    [
      "APP_SUPABASE_PUBLISHABLE_KEY",
      process.env.APP_SUPABASE_PUBLISHABLE_KEY,
    ],
    ["APP_SUPABASE_ANON_KEY", process.env.APP_SUPABASE_ANON_KEY],
    [
      "SUPABASE_PUBLISHABLE_KEY",
      process.env.SUPABASE_PUBLISHABLE_KEY,
    ],
    ["SUPABASE_ANON_KEY", process.env.SUPABASE_ANON_KEY],
  ]);

  return {
    nodeEnv: process.env.NODE_ENV,

    supabaseUrl: normalizeSupabaseUrl(
      supabaseUrlResult.value,
    ),

    supabasePublicKey: supabaseKeyResult.value.trim(),

    /**
     * Utilisé uniquement pour le diagnostic.
     * La valeur de la clé elle-même n'est jamais exposée.
     */
    supabaseUrlSource: supabaseUrlResult.source,
    supabaseKeySource: supabaseKeyResult.source,
  };
}

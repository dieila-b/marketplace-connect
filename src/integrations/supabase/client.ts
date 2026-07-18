import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./config.functions";

let _client: SupabaseClient | null = null;
let _initPromise: Promise<SupabaseClient> | null = null;

/**
 * Initialise le client Supabase une seule fois.
 *
 * La configuration est récupérée depuis les variables d'environnement Vite :
 * - VITE_SUPABASE_URL
 * - VITE_SUPABASE_PUBLISHABLE_KEY
 *
 * VITE_SUPABASE_ANON_KEY reste également supportée
 * pour assurer la compatibilité avec une ancienne configuration.
 */
export async function initSupabase(): Promise<SupabaseClient> {
  // Retourner immédiatement le client s'il est déjà initialisé
  if (_client) {
    return _client;
  }

  // Éviter plusieurs initialisations simultanées
  if (_initPromise) {
    return _initPromise;
  }

  _initPromise = (async () => {
    try {
      const cfg = await getSupabaseConfig();

      _client = createClient(cfg.url, cfg.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });

      return _client;
    } catch (error) {
      // Permettre une nouvelle tentative en cas d'échec
      _initPromise = null;

      console.error(
        "[Supabase] Erreur lors de l'initialisation du client :",
        error
      );

      throw error;
    }
  })();

  return _initPromise;
}

/**
 * Retourne le client Supabase déjà initialisé.
 *
 * Cette fonction doit uniquement être appelée après initSupabase().
 */
export function getSupabaseSync(): SupabaseClient {
  if (!_client) {
    throw new Error(
      "Supabase non initialisé. Appelle initSupabase() avant d'utiliser getSupabaseSync()."
    );
  }

  return _client;
}

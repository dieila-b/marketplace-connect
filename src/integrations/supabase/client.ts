import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./config.functions";

let _client: SupabaseClient | null = null;
let _initPromise: Promise<SupabaseClient> | null = null;

export async function initSupabase(): Promise<SupabaseClient> {
  if (_client) return _client;
  if (_initPromise) return _initPromise;
  _initPromise = (async () => {
    const cfg = await getSupabaseConfig();
    _client = createClient(cfg.url, cfg.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    return _client;
  })();
  return _initPromise;
}

export function getSupabaseSync(): SupabaseClient {
  if (!_client) throw new Error("Supabase non initialisé. Appelle initSupabase() d'abord.");
  return _client;
}

// Renvoie la config publique de ton projet Supabase (URL + anon key).
// L'anon key est conçue pour être publique côté navigateur — pas de risque
// à la mettre en dur ici (Supabase s'appuie sur les RLS pour la sécurité).
// Compatible avec un déploiement statique (Netlify SPA), aucune server function requise.
const SUPABASE_URL = "https://pvedsyclugdunyodkpob.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2ZWRzeWNsdWdkdW55b2RrcG9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4MzA1NjIsImV4cCI6MjA5OTQwNjU2Mn0.zM80KCjkaNfg0o488f_xewkrGxkjZUEpfxwT-Gb_XQc";
export async function getSupabaseConfig(): Promise<{
  url: string;
  anonKey: string;
}> {
  // Priorité : variables d'env Vite si présentes, sinon valeurs en dur ci-dessus.
  const url =
    (import.meta.env.VITE_SUPABASE_URL as string | undefined) || SUPABASE_URL;
  const anonKey =
    (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
    SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Configuration Supabase manquante.");
  }
  return { url, anonKey };
}

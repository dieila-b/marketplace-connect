// Renvoie la config publique de ton projet Supabase (URL + anon key).
// L'anon key est conçue pour être publique côté navigateur, donc on la lit
// directement depuis les variables d'environnement Vite au build (VITE_*).
// Plus besoin de server function : compatible avec un déploiement statique (Netlify SPA).
export async function getSupabaseConfig(): Promise<{
  url: string;
  anonKey: string;
}> {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!url || !anonKey) {
    throw new Error(
      "Variables manquantes : VITE_SUPABASE_URL et/ou VITE_SUPABASE_ANON_KEY ne sont pas définies. Ajoute-les dans les variables d'environnement de ton hébergeur (Netlify → Site configuration → Environment variables) puis redéploie.",
    );
  }
  return { url, anonKey };
}

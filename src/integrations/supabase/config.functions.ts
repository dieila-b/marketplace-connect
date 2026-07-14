import { createServerFn } from "@tanstack/react-start";

// Renvoie la config publique de TON projet Supabase (URL + anon key).
// Les valeurs viennent des secrets APP_SUPABASE_URL / APP_SUPABASE_ANON_KEY.
// L'anon key est conçue pour être publique côté navigateur.
export const getSupabaseConfig = createServerFn({ method: "GET" }).handler(async () => {
  console.log("[supabase config] env keys sample:", Object.keys(process.env).filter(k => k.includes("SUPABASE")));
  const url = process.env.APP_SUPABASE_URL || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey =
    process.env.APP_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Secrets manquants : APP_SUPABASE_URL et/ou APP_SUPABASE_ANON_KEY ne sont pas définis.",
    );
  }
  return { url, anonKey };
});

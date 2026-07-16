const SUPABASE_URL = "https://fqzghhehpocbcxgetckk.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxemdoaGVocG9jYmN4Z2V0Y2trIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0ODQ2OTAsImV4cCI6MjA5NzA2MDY5MH0.oJmyC_EqlA3OV1tAUQ8Jo5aYnW5pFX6fByOou628y6E";

export async function getSupabaseConfig(): Promise<{
  url: string;
  anonKey: string;
}> {
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

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { initSupabase } from "./client";
type Profile = {
  id: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
  account_type: "particulier" | "professionnel";
  avatar_url: string | null;
  phone: string | null;
  whatsapp: string | null;
};
type Ctx = {
  supabase: SupabaseClient;
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  refreshProfile: () => Promise<void>;
};
const SupabaseCtx = createContext<Ctx | null>(null);
export function SupabaseProvider({ children }: { children: ReactNode }) {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  useEffect(() => {
    let unsub: (() => void) | undefined;
    let cancelled = false;
    // Timeout de sécurité : si l'init prend plus de 8 s, on débloque l'UI
    const timeoutId = window.setTimeout(() => {
      if (cancelled) return;
      setInitError((prev) => prev ?? "L'initialisation a pris trop de temps.");
      setLoading(false);
    }, 8000);
    initSupabase()
      .then(async (client) => {
        if (cancelled) return;
        setSupabase(client);
        try {
          const { data } = await client.auth.getSession();
          setUser(data.session?.user ?? null);
        } catch (e) {
          console.error("getSession a échoué", e);
        }
        const sub = client.auth.onAuthStateChange((_evt, session) => {
          setUser(session?.user ?? null);
        });
        unsub = () => sub.data.subscription.unsubscribe();
      })
      .catch((e: unknown) => {
        console.error("Init Supabase a échoué", e);
        if (!cancelled) {
          setInitError(
            e instanceof Error ? e.message : "Impossible d'initialiser Supabase.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
        window.clearTimeout(timeoutId);
      });
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      unsub?.();
    };
  }, []);
  const loadProfile = useCallback(async () => {
    if (!supabase || !user) {
      setProfile(null);
      setIsAdmin(false);
      return;
    }
    try {
      const { data: prof } = await supabase
        .from("profiles")
        .select("id,user_id,display_name,email,account_type,avatar_url,phone,whatsapp")
        .eq("user_id", user.id)
        .maybeSingle();
      setProfile(prof as Profile | null);
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      setIsAdmin(
        !!roles?.some((r: { role: string }) =>
          ["admin", "super_admin", "moderator"].includes(r.role),
        ),
      );
    } catch (e) {
      console.error("loadProfile a échoué", e);
    }
  }, [supabase, user]);
  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);
  // 1) Pendant le check initial de session : petit loader
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
          <p className="text-sm text-muted-foreground">Chargement…</p>
        </div>
      </div>
    );
  }
  // 2) Si init a échoué : écran d'erreur explicite avec bouton "Réessayer"
  //    (au lieu d'un chargement infini)
  if (!supabase) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
              <circle cx="12" cy="12" r="10" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-slate-950">
            Connexion au serveur impossible
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {initError ??
              "Impossible de se connecter au serveur. Vérifiez votre connexion internet."}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }
  return (
    <SupabaseCtx.Provider
      value={{
        supabase,
        user,
        profile,
        isAdmin,
        loading,
        refreshProfile: loadProfile,
      }}
    >
      {children}
    </SupabaseCtx.Provider>
  );
}
export function useSupabase() {
  const ctx = useContext(SupabaseCtx);
  if (!ctx) throw new Error("useSupabase doit être utilisé dans SupabaseProvider");
  return ctx;
}

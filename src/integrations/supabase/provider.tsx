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

  useEffect(() => {
    let unsub: (() => void) | undefined;
    initSupabase()
      .then(async (client) => {
        setSupabase(client);
        const { data } = await client.auth.getSession();
        setUser(data.session?.user ?? null);
        const sub = client.auth.onAuthStateChange((_evt, session) => {
          setUser(session?.user ?? null);
        });
        unsub = () => sub.data.subscription.unsubscribe();
        setLoading(false);
      })
      .catch((e) => {
        console.error("Init Supabase a échoué", e);
        setLoading(false);
      });
    return () => unsub?.();
  }, []);

  const loadProfile = useCallback(async () => {
    if (!supabase || !user) {
      setProfile(null);
      setIsAdmin(false);
      return;
    }
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
    setIsAdmin(!!roles?.some((r: { role: string }) => ["admin", "super_admin", "moderator"].includes(r.role)));
  }, [supabase, user]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const canRenderWithoutBackend =
    typeof window === "undefined" || window.location.pathname === "/";

  if ((loading || !supabase) && !canRenderWithoutBackend) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-sm text-muted-foreground">Chargement…</div>
      </div>
    );
  }

  return (
    <SupabaseCtx.Provider value={{ supabase: supabase as SupabaseClient, user, profile, isAdmin, loading, refreshProfile: loadProfile }}>
      {children}
    </SupabaseCtx.Provider>
  );
}

export function useSupabase() {
  const ctx = useContext(SupabaseCtx);
  if (!ctx) throw new Error("useSupabase doit être utilisé dans SupabaseProvider");
  return ctx;
}

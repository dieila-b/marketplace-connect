import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useSupabase } from "@/integrations/supabase/provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Mon compte — Kafoo" }] }),
});

type MyListing = { id: string; slug: string; title: string; status: string; views_count: number; favorites_count: number; created_at: string };

function Dashboard() {
  const { supabase, user, profile, refreshProfile } = useSupabase();
  const navigate = useNavigate();
  const [listings, setListings] = useState<MyListing[]>([]);
  const [phone, setPhone] = useState(""); const [whatsapp, setWhatsapp] = useState(""); const [name, setName] = useState("");

  useEffect(() => { if (!user) navigate({ to: "/auth" }); }, [user, navigate]);
  useEffect(() => {
    if (!profile) return;
    setPhone(profile.phone ?? ""); setWhatsapp(profile.whatsapp ?? ""); setName(profile.display_name ?? "");
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    void supabase.from("listings").select("id,slug,title,status,views_count,favorites_count,created_at")
      .eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => setListings((data ?? []) as MyListing[]));
  }, [supabase, user]);

  const saveProfile = async () => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ display_name: name, phone, whatsapp }).eq("user_id", user.id);
    if (error) toast.error(error.message); else { toast.success("Profil mis à jour"); await refreshProfile(); }
  };

  const del = async (id: string) => {
    if (!confirm("Supprimer cette annonce ?")) return;
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (error) toast.error(error.message); else setListings((l) => l.filter((x) => x.id !== id));
  };
  const markSold = async (id: string) => {
    const { error } = await supabase.from("listings").update({ status: "sold", sold_at: new Date().toISOString() }).eq("id", id);
    if (error) toast.error(error.message); else setListings((l) => l.map((x) => x.id === id ? { ...x, status: "sold" } : x));
  };

  if (!user) return null;
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Mon compte</h1>
      <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
        <section className="rounded-lg border bg-card p-4">
          <h2 className="mb-3 font-semibold">Profil</h2>
          <div className="space-y-3">
            <div><Label>Nom affiché</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><Label>Téléphone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            <div><Label>WhatsApp</Label><Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="ex: 224620000000" /></div>
            <Button onClick={saveProfile} className="w-full">Enregistrer</Button>
          </div>
        </section>

        <section className="rounded-lg border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Mes annonces ({listings.length})</h2>
            <Link to="/publier"><Button size="sm">+ Publier</Button></Link>
          </div>
          {listings.length === 0 ? (
            <p className="text-sm text-muted-foreground">Vous n'avez pas encore publié d'annonce.</p>
          ) : (
            <ul className="divide-y">
              {listings.map((l) => (
                <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div className="min-w-0 flex-1">
                    <Link to="/annonces/$slug" params={{ slug: l.slug }} className="block truncate font-medium hover:underline">{l.title}</Link>
                    <p className="text-xs text-muted-foreground">{l.status} · {l.views_count} vues · {l.favorites_count} favoris</p>
                  </div>
                  <div className="flex gap-1">
                    {l.status !== "sold" && <Button size="sm" variant="outline" onClick={() => markSold(l.id)}>Vendu</Button>}
                    <Button size="sm" variant="destructive" onClick={() => del(l.id)}>Suppr.</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

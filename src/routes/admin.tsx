import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useSupabase } from "@/integrations/supabase/provider";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({ meta: [{ title: "Admin — Kafoo" }] }),
});

type AdminListing = { id: string; title: string; slug: string; status: string; created_at: string };

function AdminPage() {
  const { supabase, user, isAdmin, loading } = useSupabase();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ users: 0, listings: 0, pending: 0, reports: 0 });
  const [items, setItems] = useState<AdminListing[]>([]);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate({ to: "/" });
  }, [loading, user, isAdmin, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    void (async () => {
      const [u, l, p, r] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("listings").select("*", { count: "exact", head: true }),
        supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "open"),
      ]);
      setStats({ users: u.count ?? 0, listings: l.count ?? 0, pending: p.count ?? 0, reports: r.count ?? 0 });

      const { data } = await supabase.from("listings").select("id,title,slug,status,created_at").order("created_at", { ascending: false }).limit(50);
      setItems((data ?? []) as AdminListing[]);
    })();
  }, [supabase, isAdmin]);

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("listings").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Mis à jour"); setItems((l) => l.map((x) => x.id === id ? { ...x, status } : x)); }
  };

  if (!isAdmin) return null;
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Espace admin</h1>
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Utilisateurs", v: stats.users },
          { label: "Annonces", v: stats.listings },
          { label: "En attente", v: stats.pending },
          { label: "Signalements", v: stats.reports },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border bg-card p-4 text-center">
            <p className="text-xs uppercase text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-bold text-primary">{s.v}</p>
          </div>
        ))}
      </div>
      <h2 className="mb-3 font-semibold">Annonces récentes</h2>
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/30 text-left">
            <tr><th className="p-2">Titre</th><th className="p-2">Statut</th><th className="p-2">Date</th><th className="p-2">Actions</th></tr>
          </thead>
          <tbody>
            {items.map((l) => (
              <tr key={l.id} className="border-b">
                <td className="p-2"><a href={`/annonces/${l.slug}`} className="hover:underline">{l.title}</a></td>
                <td className="p-2"><span className="rounded bg-muted px-2 py-0.5 text-xs">{l.status}</span></td>
                <td className="p-2 text-xs text-muted-foreground">{new Date(l.created_at).toLocaleDateString("fr-FR")}</td>
                <td className="space-x-1 p-2">
                  <Button size="sm" variant="outline" onClick={() => setStatus(l.id, "published")}>✓</Button>
                  <Button size="sm" variant="outline" onClick={() => setStatus(l.id, "rejected")}>✗</Button>
                  <Button size="sm" variant="outline" onClick={() => setStatus(l.id, "suspended")}>⏸</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

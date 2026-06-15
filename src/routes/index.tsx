import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useSupabase } from "@/integrations/supabase/provider";
import { ListingCard, type ListingRow } from "@/components/ListingCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kafoo — Petites annonces près de chez vous" },
      { name: "description", content: "Marketplace de petites annonces en Guinée : achetez, vendez, échangez." },
    ],
  }),
  component: Home,
});

type Category = { id: string; name: string; slug: string; icon: string | null };

function Home() {
  const { supabase } = useSupabase();
  const [categories, setCategories] = useState<Category[]>([]);
  const [recent, setRecent] = useState<ListingRow[]>([]);
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    void (async () => {
      const { data: cats } = await supabase
        .from("categories")
        .select("id,name,slug,icon")
        .is("parent_id", null)
        .eq("is_active", true)
        .order("sort_order");
      setCategories((cats ?? []) as Category[]);

      const { data: list } = await supabase
        .from("listings")
        .select(`
          id,slug,title,price,currency,condition,is_featured,is_sponsored,created_at,
          region:regions(name), city:cities(name), commune:communes(name),
          images:listing_images(image_url,is_main)
        `)
        .eq("status", "published")
        .order("is_sponsored", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(24);
      setRecent((list ?? []) as unknown as ListingRow[]);
    })();
  }, [supabase]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/annonces", search: { q: q || undefined } as never });
  };

  return (
    <main>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-primary/70 px-4 py-10 text-primary-foreground">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-3xl font-bold sm:text-4xl">Achetez et vendez près de chez vous</h1>
          <p className="mt-2 text-sm opacity-90">Téléphones, véhicules, immobilier, mode et bien plus en Guinée.</p>
          <form onSubmit={onSearch} className="mt-6 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Que recherchez-vous ?"
                className="h-12 bg-background pl-9 text-foreground"
              />
            </div>
            <Button type="submit" size="lg" variant="secondary">Rechercher</Button>
          </form>
        </div>
      </section>

      {/* Catégories */}
      <section className="mx-auto max-w-7xl px-4 py-8">
        <h2 className="mb-4 text-lg font-semibold">Catégories</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-10">
          {categories.map((c) => (
            <Link
              key={c.id}
              to="/annonces"
              search={{ category: c.slug } as never}
              className="flex flex-col items-center gap-1 rounded-lg border bg-card p-3 text-center text-xs transition hover:border-primary hover:bg-accent"
            >
              <span className="text-2xl">📦</span>
              <span className="line-clamp-2">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Annonces récentes */}
      <section className="mx-auto max-w-7xl px-4 pb-12">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Annonces récentes</h2>
          <Link to="/annonces" className="text-sm text-primary hover:underline">Tout voir</Link>
        </div>
        {recent.length === 0 ? (
          <p className="rounded-lg border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            Aucune annonce publiée. <Link to="/publier" className="text-primary underline">Soyez le premier à publier.</Link>
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {recent.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </section>
    </main>
  );
}

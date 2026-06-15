import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { useEffect, useState } from "react";
import { useSupabase } from "@/integrations/supabase/provider";
import { ListingCard, type ListingRow } from "@/components/ListingCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  region: z.string().optional(),
  city: z.string().optional(),
  commune: z.string().optional(),
  min: z.coerce.number().optional(),
  max: z.coerce.number().optional(),
  sort: z.enum(["recent", "price_asc", "price_desc"]).optional().default("recent"),
});

export const Route = createFileRoute("/annonces")({
  validateSearch: (s) => searchSchema.parse(s),
  component: AnnoncesPage,
  head: () => ({ meta: [{ title: "Annonces — Kafoo" }] }),
});

type Opt = { id: string; name: string; slug: string };

function AnnoncesPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { supabase } = useSupabase();
  const [items, setItems] = useState<ListingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [cats, setCats] = useState<Opt[]>([]);
  const [regions, setRegions] = useState<Opt[]>([]);
  const [cities, setCities] = useState<Opt[]>([]);
  const [communes, setCommunes] = useState<Opt[]>([]);

  // Local filter state synced with URL
  const [q, setQ] = useState(search.q ?? "");
  const [min, setMin] = useState<string>(search.min != null ? String(search.min) : "");
  const [max, setMax] = useState<string>(search.max != null ? String(search.max) : "");

  useEffect(() => {
    void (async () => {
      const [{ data: c }, { data: r }] = await Promise.all([
        supabase.from("categories").select("id,name,slug").is("parent_id", null).eq("is_active", true).order("sort_order"),
        supabase.from("regions").select("id,name,slug").eq("is_active", true).order("name"),
      ]);
      setCats((c ?? []) as Opt[]); setRegions((r ?? []) as Opt[]);
    })();
  }, [supabase]);

  useEffect(() => {
    if (!search.region) { setCities([]); return; }
    void (async () => {
      const { data: reg } = await supabase.from("regions").select("id").eq("slug", search.region!).maybeSingle();
      if (!reg) { setCities([]); return; }
      const { data } = await supabase.from("cities").select("id,name,slug").eq("region_id", reg.id).order("name");
      setCities((data ?? []) as Opt[]);
    })();
  }, [supabase, search.region]);

  useEffect(() => {
    if (!search.city) { setCommunes([]); return; }
    void (async () => {
      const { data: city } = await supabase.from("cities").select("id").eq("slug", search.city!).maybeSingle();
      if (!city) { setCommunes([]); return; }
      const { data } = await supabase.from("communes").select("id,name,slug").eq("city_id", city.id).order("name");
      setCommunes((data ?? []) as Opt[]);
    })();
  }, [supabase, search.city]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      let qry = supabase
        .from("listings")
        .select(`
          id,slug,title,price,currency,condition,is_featured,is_sponsored,created_at,
          region:regions(name), city:cities(name), commune:communes(name),
          images:listing_images(image_url,is_main)
        `)
        .eq("status", "published");

      if (search.q) qry = qry.ilike("title", `%${search.q}%`);
      if (search.min != null) qry = qry.gte("price", search.min);
      if (search.max != null) qry = qry.lte("price", search.max);
      if (search.category) {
        const { data: cat } = await supabase.from("categories").select("id").eq("slug", search.category).maybeSingle();
        if (cat) qry = qry.eq("category_id", cat.id);
      }
      if (search.region) {
        const { data: reg } = await supabase.from("regions").select("id").eq("slug", search.region).maybeSingle();
        if (reg) qry = qry.eq("region_id", reg.id);
      }
      if (search.city) {
        const { data: city } = await supabase.from("cities").select("id").eq("slug", search.city).maybeSingle();
        if (city) qry = qry.eq("city_id", city.id);
      }
      if (search.commune) {
        const { data: com } = await supabase.from("communes").select("id").eq("slug", search.commune).maybeSingle();
        if (com) qry = qry.eq("commune_id", com.id);
      }
      if (search.sort === "price_asc") qry = qry.order("price", { ascending: true, nullsFirst: false });
      else if (search.sort === "price_desc") qry = qry.order("price", { ascending: false, nullsFirst: false });
      else qry = qry.order("is_sponsored", { ascending: false }).order("created_at", { ascending: false });

      const { data } = await qry.limit(60);
      setItems((data ?? []) as unknown as ListingRow[]);
      setLoading(false);
    })();
  }, [supabase, search]);

  const applyFilters = () => {
    navigate({
      search: (prev) => ({
        ...prev,
        q: q || undefined,
        min: min ? Number(min) : undefined,
        max: max ? Number(max) : undefined,
      }),
    });
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-4 rounded-lg border bg-card p-4">
          <div>
            <Label>Recherche</Label>
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Mots-clés" />
          </div>
          <div>
            <Label>Catégorie</Label>
            <select
              className="mt-1 w-full rounded-md border bg-background px-2 py-2 text-sm"
              value={search.category ?? ""}
              onChange={(e) => navigate({ search: (p) => ({ ...p, category: e.target.value || undefined }) })}
            >
              <option value="">Toutes</option>
              {cats.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <Label>Région</Label>
            <select
              className="mt-1 w-full rounded-md border bg-background px-2 py-2 text-sm"
              value={search.region ?? ""}
              onChange={(e) => navigate({ search: (p) => ({ ...p, region: e.target.value || undefined, city: undefined, commune: undefined }) })}
            >
              <option value="">Toutes</option>
              {regions.map((r) => <option key={r.id} value={r.slug}>{r.name}</option>)}
            </select>
          </div>
          {cities.length > 0 && (
            <div>
              <Label>Ville</Label>
              <select
                className="mt-1 w-full rounded-md border bg-background px-2 py-2 text-sm"
                value={search.city ?? ""}
                onChange={(e) => navigate({ search: (p) => ({ ...p, city: e.target.value || undefined, commune: undefined }) })}
              >
                <option value="">Toutes</option>
                {cities.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
              </select>
            </div>
          )}
          {communes.length > 0 && (
            <div>
              <Label>Commune</Label>
              <select
                className="mt-1 w-full rounded-md border bg-background px-2 py-2 text-sm"
                value={search.commune ?? ""}
                onChange={(e) => navigate({ search: (p) => ({ ...p, commune: e.target.value || undefined }) })}
              >
                <option value="">Toutes</option>
                {communes.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Prix min</Label><Input value={min} onChange={(e) => setMin(e.target.value)} type="number" /></div>
            <div><Label>Prix max</Label><Input value={max} onChange={(e) => setMax(e.target.value)} type="number" /></div>
          </div>
          <div>
            <Label>Tri</Label>
            <select
              className="mt-1 w-full rounded-md border bg-background px-2 py-2 text-sm"
              value={search.sort ?? "recent"}
              onChange={(e) => navigate({ search: (p) => ({ ...p, sort: e.target.value as "recent" | "price_asc" | "price_desc" }) })}
            >
              <option value="recent">Plus récentes</option>
              <option value="price_asc">Prix croissant</option>
              <option value="price_desc">Prix décroissant</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={applyFilters}>Appliquer</Button>
            <Button variant="outline" onClick={() => { setQ(""); setMin(""); setMax(""); navigate({ search: { sort: "recent" } as never }); }}>
              Réinit
            </Button>
          </div>
        </aside>

        <section>
          <div className="mb-3 text-sm text-muted-foreground">
            {loading ? "Chargement…" : `${items.length} annonce(s)`}
          </div>
          {items.length === 0 && !loading ? (
            <div className="rounded-lg border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
              Aucun résultat. <Link to="/publier" className="text-primary underline">Publier une annonce</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((l) => <ListingCard key={l.id} listing={l} />)}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

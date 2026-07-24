import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

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

  /*
   * Compatibilité avec les deux formats utilisés dans le projet :
   * - /annonces?min=...
   * - /annonces?minPrice=...
   */
  min: z.coerce.number().optional(),
  max: z.coerce.number().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),

  sort: z
    .enum(["recent", "price_asc", "price_desc"])
    .optional()
    .default("recent"),
});

export const Route = createFileRoute("/annonces/")({
  validateSearch: (s) => searchSchema.parse(s),
  component: AnnoncesPage,
  head: () => ({
    meta: [{ title: "Annonces — Kafoo" }],
  }),
});

type Opt = {
  id: string;
  name: string;
  slug: string;
};

type ListingFilters = {
  q?: string;
  categoryId?: string | null;
  regionId?: string | null;
  cityId?: string | null;
  communeId?: string | null;
  min?: number;
  max?: number;
  sort: "recent" | "price_asc" | "price_desc";
};

/* ════════════════════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════════════════════ */

async function resolveIdBySlug(
  supabase: SupabaseClient,
  table: "categories" | "regions" | "cities" | "communes",
  slug?: string,
): Promise<string | null> {
  if (!slug) return null;

  const { data, error } = await supabase
    .from(table)
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.warn(`[Annonces] Impossible de résoudre ${table}/${slug} :`, error);
    return null;
  }

  return data?.id ?? null;
}

function applyListingFilters(query: any, filters: ListingFilters) {
  let qry = query.eq("status", "published");

  if (filters.q) {
    qry = qry.ilike("title", `%${filters.q}%`);
  }

  if (filters.min != null) {
    qry = qry.gte("price", filters.min);
  }

  if (filters.max != null) {
    qry = qry.lte("price", filters.max);
  }

  if (filters.categoryId) {
    qry = qry.eq("category_id", filters.categoryId);
  }

  if (filters.regionId) {
    qry = qry.eq("region_id", filters.regionId);
  }

  if (filters.cityId) {
    qry = qry.eq("city_id", filters.cityId);
  }

  if (filters.communeId) {
    qry = qry.eq("commune_id", filters.communeId);
  }

  if (filters.sort === "price_asc") {
    qry = qry.order("price", {
      ascending: true,
      nullsFirst: false,
    });
  } else if (filters.sort === "price_desc") {
    qry = qry.order("price", {
      ascending: false,
      nullsFirst: false,
    });
  } else {
    qry = qry
      .order("is_sponsored", { ascending: false })
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false });
  }

  return qry.limit(60);
}

function normalizeListings(rows: any[] | null | undefined): ListingRow[] {
  return (rows ?? []).map((row) => ({
    ...row,
    region: row.region ?? null,
    city: row.city ?? null,
    commune: row.commune ?? null,
    images: Array.isArray(row.images) ? row.images : [],
    is_featured: Boolean(row.is_featured),
    is_sponsored: Boolean(row.is_sponsored),
  })) as unknown as ListingRow[];
}

/**
 * Charge les annonces avec plusieurs fallbacks.
 *
 * Une relation PostgREST absente ne doit plus faire disparaître
 * toute la liste des annonces.
 */
async function loadPublishedListings(
  supabase: SupabaseClient,
  filters: ListingFilters,
): Promise<ListingRow[]> {
  /*
   * 1. Requête complète.
   */
  const full = await applyListingFilters(
    supabase.from("listings").select(`
      id,
      slug,
      title,
      price,
      currency,
      condition,
      is_featured,
      is_sponsored,
      created_at,
      region:regions(name),
      city:cities(name),
      commune:communes(name),
      images:listing_images(image_url,is_main,sort_order)
    `),
    filters,
  );

  if (!full.error) {
    return normalizeListings(full.data);
  }

  console.warn(
    "[Annonces] Requête complète impossible, fallback sans localisation :",
    full.error,
  );

  /*
   * 2. Fallback sans relations géographiques.
   */
  const withoutLocations = await applyListingFilters(
    supabase.from("listings").select(`
      id,
      slug,
      title,
      price,
      currency,
      condition,
      is_featured,
      is_sponsored,
      created_at,
      images:listing_images(image_url,is_main,sort_order)
    `),
    filters,
  );

  if (!withoutLocations.error) {
    return normalizeListings(withoutLocations.data);
  }

  console.warn(
    "[Annonces] Fallback images uniquement impossible :",
    withoutLocations.error,
  );

  /*
   * 3. Fallback sans aucune relation.
   */
  const withoutRelations = await applyListingFilters(
    supabase.from("listings").select(`
      id,
      slug,
      title,
      price,
      currency,
      condition,
      is_featured,
      is_sponsored,
      created_at
    `),
    filters,
  );

  if (!withoutRelations.error) {
    return normalizeListings(withoutRelations.data);
  }

  console.warn(
    "[Annonces] Fallback sans relation impossible :",
    withoutRelations.error,
  );

  /*
   * 4. Dernier fallback avec les colonnes essentielles uniquement.
   *
   * Ici on évite volontairement les colonnes optionnelles
   * is_featured / is_sponsored / condition.
   */
  let coreQuery: any = supabase
    .from("listings")
    .select(`
      id,
      slug,
      title,
      price,
      currency,
      created_at
    `)
    .eq("status", "published");

  if (filters.q) {
    coreQuery = coreQuery.ilike("title", `%${filters.q}%`);
  }

  if (filters.min != null) {
    coreQuery = coreQuery.gte("price", filters.min);
  }

  if (filters.max != null) {
    coreQuery = coreQuery.lte("price", filters.max);
  }

  if (filters.categoryId) {
    coreQuery = coreQuery.eq("category_id", filters.categoryId);
  }

  if (filters.regionId) {
    coreQuery = coreQuery.eq("region_id", filters.regionId);
  }

  if (filters.cityId) {
    coreQuery = coreQuery.eq("city_id", filters.cityId);
  }

  if (filters.communeId) {
    coreQuery = coreQuery.eq("commune_id", filters.communeId);
  }

  if (filters.sort === "price_asc") {
    coreQuery = coreQuery.order("price", {
      ascending: true,
      nullsFirst: false,
    });
  } else if (filters.sort === "price_desc") {
    coreQuery = coreQuery.order("price", {
      ascending: false,
      nullsFirst: false,
    });
  } else {
    coreQuery = coreQuery.order("created_at", {
      ascending: false,
    });
  }

  const core = await coreQuery.limit(60);

  if (core.error) {
    console.error(
      "[Annonces] Impossible de charger les annonces publiées :",
      core.error,
    );
    throw core.error;
  }

  return normalizeListings(core.data);
}

/* ════════════════════════════════════════════════════════════
   PAGE
════════════════════════════════════════════════════════════ */

function AnnoncesPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { supabase } = useSupabase();

  const [items, setItems] = useState<ListingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [cats, setCats] = useState<Opt[]>([]);
  const [regions, setRegions] = useState<Opt[]>([]);
  const [cities, setCities] = useState<Opt[]>([]);
  const [communes, setCommunes] = useState<Opt[]>([]);

  const effectiveMin = search.min ?? search.minPrice;
  const effectiveMax = search.max ?? search.maxPrice;

  const [q, setQ] = useState(search.q ?? "");
  const [min, setMin] = useState(
    effectiveMin != null ? String(effectiveMin) : "",
  );
  const [max, setMax] = useState(
    effectiveMax != null ? String(effectiveMax) : "",
  );

  useEffect(() => {
    setQ(search.q ?? "");
    setMin(effectiveMin != null ? String(effectiveMin) : "");
    setMax(effectiveMax != null ? String(effectiveMax) : "");
  }, [search.q, effectiveMin, effectiveMax]);

  /*
   * Chargement des catégories et régions.
   */
  useEffect(() => {
    if (!supabase) return;

    let cancelled = false;

    void (async () => {
      const [categoriesResult, regionsResult] = await Promise.all([
        supabase
          .from("categories")
          .select("id,name,slug")
          .is("parent_id", null)
          .eq("is_active", true)
          .order("sort_order"),

        supabase
          .from("regions")
          .select("id,name,slug")
          .order("name"),
      ]);

      if (cancelled) return;

      if (categoriesResult.error) {
        console.warn("[Annonces] Catégories :", categoriesResult.error);
      }

      if (regionsResult.error) {
        console.warn("[Annonces] Régions :", regionsResult.error);
      }

      setCats((categoriesResult.data ?? []) as Opt[]);
      setRegions((regionsResult.data ?? []) as Opt[]);
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  /*
   * Villes dépendantes de la région.
   */
  useEffect(() => {
    if (!supabase) return;

    if (!search.region) {
      setCities([]);
      return;
    }

    let cancelled = false;

    void (async () => {
      const regionId = await resolveIdBySlug(
        supabase,
        "regions",
        search.region,
      );

      if (!regionId || cancelled) {
        setCities([]);
        return;
      }

      const { data, error } = await supabase
        .from("cities")
        .select("id,name,slug")
        .eq("region_id", regionId)
        .order("name");

      if (cancelled) return;

      if (error) {
        console.warn("[Annonces] Villes :", error);
        setCities([]);
        return;
      }

      setCities((data ?? []) as Opt[]);
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase, search.region]);

  /*
   * Communes dépendantes de la ville.
   */
  useEffect(() => {
    if (!supabase) return;

    if (!search.city) {
      setCommunes([]);
      return;
    }

    let cancelled = false;

    void (async () => {
      const cityId = await resolveIdBySlug(
        supabase,
        "cities",
        search.city,
      );

      if (!cityId || cancelled) {
        setCommunes([]);
        return;
      }

      const { data, error } = await supabase
        .from("communes")
        .select("id,name,slug")
        .eq("city_id", cityId)
        .order("name");

      if (cancelled) return;

      if (error) {
        console.warn("[Annonces] Communes :", error);
        setCommunes([]);
        return;
      }

      setCommunes((data ?? []) as Opt[]);
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase, search.city]);

  /*
   * Chargement de la liste des annonces.
   */
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        setLoading(true);
        setLoadError("");

        const [
          categoryId,
          regionId,
          cityId,
          communeId,
        ] = await Promise.all([
          resolveIdBySlug(supabase, "categories", search.category),
          resolveIdBySlug(supabase, "regions", search.region),
          resolveIdBySlug(supabase, "cities", search.city),
          resolveIdBySlug(supabase, "communes", search.commune),
        ]);

        if (cancelled) return;

        const data = await loadPublishedListings(supabase, {
          q: search.q,
          categoryId,
          regionId,
          cityId,
          communeId,
          min: effectiveMin,
          max: effectiveMax,
          sort: search.sort ?? "recent",
        });

        if (!cancelled) {
          setItems(data);
        }
      } catch (error) {
        if (cancelled) return;

        console.error("[Annonces] Chargement impossible :", error);

        setItems([]);
        setLoadError(
          error instanceof Error
            ? error.message
            : "Impossible de charger les annonces.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    supabase,
    search.q,
    search.category,
    search.region,
    search.city,
    search.commune,
    search.sort,
    effectiveMin,
    effectiveMax,
  ]);

  const resultLabel = useMemo(() => {
    if (loading) return "Chargement…";
    return `${items.length} annonce${items.length > 1 ? "s" : ""}`;
  }, [items.length, loading]);

  const applyFilters = () => {
    navigate({
      search: ((prev: Record<string, unknown>) => ({
        ...prev,

        q: q.trim() || undefined,

        /*
         * On standardise désormais sur min/max.
         */
        min: min ? Number(min) : undefined,
        max: max ? Number(max) : undefined,

        /*
         * On supprime les anciens alias.
         */
        minPrice: undefined,
        maxPrice: undefined,
      })) as never,
    });
  };

  const resetFilters = () => {
    setQ("");
    setMin("");
    setMax("");

    navigate({
      search: {
        sort: "recent",
      } as never,
    });
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-4 rounded-xl border bg-card p-4">
          <div>
            <Label>Recherche</Label>
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Mots-clés"
            />
          </div>

          <div>
            <Label>Catégorie</Label>
            <select
              className="mt-1 w-full rounded-md border bg-background px-2 py-2 text-sm"
              value={search.category ?? ""}
              onChange={(e) =>
                navigate({
                  search: ((p: Record<string, unknown>) => ({
                    ...p,
                    category: e.target.value || undefined,
                  })) as never,
                })
              }
            >
              <option value="">Toutes</option>
              {cats.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Région</Label>
            <select
              className="mt-1 w-full rounded-md border bg-background px-2 py-2 text-sm"
              value={search.region ?? ""}
              onChange={(e) =>
                navigate({
                  search: ((p: Record<string, unknown>) => ({
                    ...p,
                    region: e.target.value || undefined,
                    city: undefined,
                    commune: undefined,
                  })) as never,
                })
              }
            >
              <option value="">Toutes</option>
              {regions.map((r) => (
                <option key={r.id} value={r.slug}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {cities.length > 0 && (
            <div>
              <Label>Ville</Label>
              <select
                className="mt-1 w-full rounded-md border bg-background px-2 py-2 text-sm"
                value={search.city ?? ""}
                onChange={(e) =>
                  navigate({
                    search: ((p: Record<string, unknown>) => ({
                      ...p,
                      city: e.target.value || undefined,
                      commune: undefined,
                    })) as never,
                  })
                }
              >
                <option value="">Toutes</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {communes.length > 0 && (
            <div>
              <Label>Commune</Label>
              <select
                className="mt-1 w-full rounded-md border bg-background px-2 py-2 text-sm"
                value={search.commune ?? ""}
                onChange={(e) =>
                  navigate({
                    search: ((p: Record<string, unknown>) => ({
                      ...p,
                      commune: e.target.value || undefined,
                    })) as never,
                  })
                }
              >
                <option value="">Toutes</option>
                {communes.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Prix min</Label>
              <Input
                value={min}
                onChange={(e) => setMin(e.target.value)}
                type="number"
              />
            </div>

            <div>
              <Label>Prix max</Label>
              <Input
                value={max}
                onChange={(e) => setMax(e.target.value)}
                type="number"
              />
            </div>
          </div>

          <div>
            <Label>Tri</Label>
            <select
              className="mt-1 w-full rounded-md border bg-background px-2 py-2 text-sm"
              value={search.sort ?? "recent"}
              onChange={(e) =>
                navigate({
                  search: ((p: Record<string, unknown>) => ({
                    ...p,
                    sort: e.target.value as
                      | "recent"
                      | "price_asc"
                      | "price_desc",
                  })) as never,
                })
              }
            >
              <option value="recent">Plus récentes</option>
              <option value="price_asc">Prix croissant</option>
              <option value="price_desc">Prix décroissant</option>
            </select>
          </div>

          <div className="flex gap-2">
            <Button className="flex-1" onClick={applyFilters}>
              Appliquer
            </Button>

            <Button variant="outline" onClick={resetFilters}>
              Réinit
            </Button>
          </div>
        </aside>

        <section className="min-w-0">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">{resultLabel}</p>
          </div>

          {loadError && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Impossible de charger complètement la liste : {loadError}
            </div>
          )}

          {items.length === 0 && !loading ? (
            <div className="rounded-xl border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
              Aucun résultat.{" "}
              <Link to="/publier" className="text-primary underline">
                Publier une annonce
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}


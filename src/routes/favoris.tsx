import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useSupabase } from "@/integrations/supabase/provider";
import { ListingCard, type ListingRow } from "@/components/ListingCard";

export const Route = createFileRoute("/favoris")({
  component: FavorisPage,
  head: () => ({ meta: [{ title: "Mes favoris — Kafoo" }] }),
});

function FavorisPage() {
  const { supabase, user } = useSupabase();
  const navigate = useNavigate();
  const [items, setItems] = useState<ListingRow[]>([]);
  useEffect(() => { if (!user) navigate({ to: "/auth" }); }, [user, navigate]);
  useEffect(() => {
    if (!user) return;
    void supabase.from("favorites")
      .select(`listing:listings(
        id,slug,title,price,currency,condition,is_featured,is_sponsored,created_at,
        region:regions(name), city:cities(name), commune:communes(name),
        images:listing_images(image_url,is_main)
      )`).eq("user_id", user.id)
      .then(({ data }) => {
        const rows = ((data ?? []) as unknown as { listing: ListingRow | null }[])
          .map((d) => d.listing)
          .filter((l): l is ListingRow => !!l);
        setItems(rows);
      });

  }, [supabase, user]);
  if (!user) return null;
  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold">Mes favoris</h1>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun favori pour le moment.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((l) => <ListingCard key={l.id} listing={l} />)}
        </div>
      )}
    </main>
  );
}

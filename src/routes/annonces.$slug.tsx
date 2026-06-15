import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useSupabase } from "@/integrations/supabase/provider";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, MessageCircle, Heart, Flag, Calendar, Tag } from "lucide-react";
import { formatPrice } from "@/components/ListingCard";
import { toast } from "sonner";

export const Route = createFileRoute("/annonces/$slug")({
  component: ListingDetail,
});

type Listing = {
  id: string; user_id: string; title: string; description: string;
  price: number | null; currency: string; condition: string | null;
  phone_visible: boolean; whatsapp_enabled: boolean; negotiable: boolean;
  created_at: string; address_text: string | null;
  seller: { display_name: string | null; business_name: string | null; phone: string | null; whatsapp: string | null; account_type: string } | null;
  category: { name: string } | null;
  region: { name: string } | null; city: { name: string } | null;
  commune: { name: string } | null; district: { name: string } | null;
  images: { id: string; image_url: string; is_main: boolean }[];
};

function ListingDetail() {
  const { slug } = Route.useParams();
  const { supabase, user } = useSupabase();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [imgIdx, setImgIdx] = useState(0);
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("listings")
        .select(`
          id,user_id,title,description,price,currency,condition,phone_visible,whatsapp_enabled,negotiable,
          created_at,address_text,
          seller:profiles!listings_user_id_fkey(display_name,business_name,phone,whatsapp,account_type),
          category:categories!listings_category_id_fkey(name),
          region:regions(name), city:cities(name), commune:communes(name), district:districts(name),
          images:listing_images(id,image_url,is_main)
        `)
        .eq("slug", slug)
        .maybeSingle();
      setListing(data as unknown as Listing | null);
    })();
  }, [supabase, slug]);

  useEffect(() => {
    if (!user || !listing) return;
    void (async () => {
      const { data } = await supabase.from("favorites").select("id").eq("user_id", user.id).eq("listing_id", listing.id).maybeSingle();
      setIsFav(!!data);
    })();
  }, [supabase, user, listing]);

  if (!listing) return <main className="mx-auto max-w-5xl p-8 text-center text-muted-foreground">Chargement…</main>;

  const images = listing.images.length ? listing.images : [];
  const cur = images[imgIdx];

  const toggleFav = async () => {
    if (!user) { navigate({ to: "/auth" }); return; }
    if (isFav) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("listing_id", listing.id);
      setIsFav(false);
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, listing_id: listing.id });
      setIsFav(true);
    }
  };

  const contactSeller = async () => {
    if (!user) { navigate({ to: "/auth" }); return; }
    const content = window.prompt("Votre message au vendeur :");
    if (!content) return;
    const { data: conv, error: ce } = await supabase
      .from("conversations")
      .upsert({ listing_id: listing.id, buyer_id: user.id, seller_id: listing.user_id, last_message: content, last_message_at: new Date().toISOString() }, { onConflict: "listing_id,buyer_id,seller_id" })
      .select("id")
      .maybeSingle();
    if (ce || !conv) { toast.error(ce?.message ?? "Erreur"); return; }
    const { error: me } = await supabase.from("messages").insert({
      conversation_id: conv.id, sender_id: user.id, receiver_id: listing.user_id, content,
    });
    if (me) toast.error(me.message); else { toast.success("Message envoyé"); navigate({ to: "/messages" }); }
  };

  const report = async () => {
    if (!user) { navigate({ to: "/auth" }); return; }
    const reason = window.prompt("Motif du signalement :");
    if (!reason) return;
    const { error } = await supabase.from("reports").insert({ listing_id: listing.id, reporter_id: user.id, reported_user_id: listing.user_id, reason });
    if (error) toast.error(error.message); else toast.success("Signalement envoyé");
  };

  const loc = [listing.district?.name, listing.commune?.name, listing.city?.name, listing.region?.name].filter(Boolean).join(", ");

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="overflow-hidden rounded-xl border bg-muted">
            {cur ? <img src={cur.image_url} alt={listing.title} className="aspect-square w-full object-cover" /> : <div className="aspect-square w-full" />}
          </div>
          {images.length > 1 && (
            <div className="mt-2 flex gap-2 overflow-x-auto">
              {images.map((i, idx) => (
                <button key={i.id} onClick={() => setImgIdx(idx)} className={"h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 " + (idx === imgIdx ? "border-primary" : "border-transparent")}>
                  <img src={i.image_url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
          <div className="mt-6 rounded-lg border bg-card p-4">
            <h2 className="text-lg font-semibold">Description</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{listing.description}</p>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <h1 className="text-xl font-bold">{listing.title}</h1>
            <p className="mt-2 text-2xl font-bold text-primary">{formatPrice(listing.price, listing.currency)}
              {listing.negotiable && <span className="ml-2 text-xs font-normal text-muted-foreground">Négociable</span>}
            </p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Tag className="h-4 w-4" /> {listing.category?.name}</li>
              {listing.condition && <li className="flex items-center gap-2"><Tag className="h-4 w-4" /> État : {listing.condition}</li>}
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {loc || "—"}</li>
              <li className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Publié le {new Date(listing.created_at).toLocaleDateString("fr-FR")}</li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={contactSeller} className="gap-1"><MessageCircle className="h-4 w-4" /> Message</Button>
              {listing.phone_visible && listing.seller?.phone && (
                <a href={`tel:${listing.seller.phone}`}><Button variant="outline" className="gap-1"><Phone className="h-4 w-4" /> Appeler</Button></a>
              )}
              {listing.whatsapp_enabled && listing.seller?.whatsapp && (
                <a href={`https://wa.me/${listing.seller.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
                  <Button variant="outline" className="gap-1">WhatsApp</Button>
                </a>
              )}
              <Button variant="ghost" size="icon" onClick={toggleFav} aria-label="Favori">
                <Heart className={"h-4 w-4 " + (isFav ? "fill-current text-red-500" : "")} />
              </Button>
              <Button variant="ghost" size="icon" onClick={report} aria-label="Signaler"><Flag className="h-4 w-4" /></Button>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold">Vendeur</h3>
            <p className="mt-1 text-sm">{listing.seller?.business_name ?? listing.seller?.display_name ?? "Utilisateur"}</p>
            <p className="text-xs text-muted-foreground capitalize">{listing.seller?.account_type}</p>
          </div>

          <Link to="/annonces" className="block text-center text-sm text-primary hover:underline">← Retour aux annonces</Link>
        </aside>
      </div>
    </main>
  );
}

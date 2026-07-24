import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ArrowLeft,
  Box,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Flag,
  Heart,
  MapPin,
  MessageCircle,
  Phone,
  Share2,
  Tag,
  User,
} from "lucide-react";

import { useSupabase } from "@/integrations/supabase/provider";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/components/ListingCard";
import { toast } from "sonner";

export const Route = createFileRoute("/annonces/$slug")({
  component: ListingDetail,
  head: () => ({
    meta: [{ title: "Annonce — Kafoo" }],
  }),
});

type Seller = {
  display_name: string | null;
  business_name: string | null;
  phone: string | null;
  whatsapp: string | null;
  account_type: string | null;
};

type NamedRelation = {
  name: string;
};

type ListingImage = {
  id: string;
  image_url: string;
  storage_path?: string | null;
  is_main: boolean;
  sort_order?: number | null;
};

type Listing = {
  id: string;
  user_id: string;
  slug: string;
  title: string;
  description: string | null;
  price: number | null;
  currency: string;
  condition: string | null;
  phone_visible: boolean;
  whatsapp_enabled: boolean;
  negotiable: boolean;
  created_at: string;
  address_text: string | null;
  status: string;

  category_id: string | null;
  region_id: string | null;
  city_id: string | null;
  commune_id: string | null;

  seller: Seller | null;
  category: NamedRelation | null;
  region: NamedRelation | null;
  city: NamedRelation | null;
  commune: NamedRelation | null;
  images: ListingImage[];
};

type RawListing = Omit<
  Listing,
  "seller" | "category" | "region" | "city" | "commune" | "images"
>;

function sortImages(images: ListingImage[]) {
  return [...images].sort((a, b) => {
    if (a.is_main && !b.is_main) return -1;
    if (!a.is_main && b.is_main) return 1;

    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });
}

function conditionLabel(condition?: string | null) {
  if (!condition) return null;

  const normalized = condition.toLowerCase();

  const labels: Record<string, string> = {
    new: "NEUF",
    neuf: "NEUF",
    like_new: "COMME NEUF",
    "like-new": "COMME NEUF",
    very_good: "TRÈS BON ÉTAT",
    "very-good": "TRÈS BON ÉTAT",
    good: "BON ÉTAT",
    bon: "BON ÉTAT",
    used: "OCCASION",
    fair: "ÉTAT CORRECT",
  };

  return (
    labels[normalized] ??
    condition.replace(/[_-]+/g, " ").toUpperCase()
  );
}

async function loadNamedRelation(
  supabase: SupabaseClient,
  table: "categories" | "regions" | "cities" | "communes",
  id: string | null,
): Promise<NamedRelation | null> {
  if (!id) return null;

  const { data, error } = await supabase
    .from(table)
    .select("name")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.warn(`[ListingDetail] ${table}:`, error);
    return null;
  }

  return (data as NamedRelation | null) ?? null;
}

async function loadSeller(
  supabase: SupabaseClient,
  userId: string,
): Promise<Seller | null> {
  const complete = await supabase
    .from("profiles")
    .select("display_name,business_name,phone,whatsapp,account_type")
    .eq("user_id", userId)
    .maybeSingle();

  if (!complete.error) {
    return (complete.data as Seller | null) ?? null;
  }

  const fallback = await supabase
    .from("profiles")
    .select("display_name,phone")
    .eq("user_id", userId)
    .maybeSingle();

  if (fallback.error || !fallback.data) {
    console.warn(
      "[ListingDetail] Profil vendeur indisponible :",
      fallback.error,
    );
    return null;
  }

  const row = fallback.data as {
    display_name: string | null;
    phone: string | null;
  };

  return {
    display_name: row.display_name,
    business_name: null,
    phone: row.phone,
    whatsapp: null,
    account_type: null,
  };
}

async function loadListingImages(
  supabase: SupabaseClient,
  listingId: string,
): Promise<ListingImage[]> {
  const complete = await supabase
    .from("listing_images")
    .select("id,image_url,storage_path,is_main,sort_order")
    .eq("listing_id", listingId)
    .order("is_main", { ascending: false })
    .order("sort_order", { ascending: true });

  if (!complete.error) {
    return sortImages((complete.data ?? []) as ListingImage[]);
  }

  console.warn(
    "[ListingDetail] Galerie complète indisponible, fallback :",
    complete.error,
  );

  const fallback = await supabase
    .from("listing_images")
    .select("id,image_url,is_main")
    .eq("listing_id", listingId)
    .order("is_main", { ascending: false });

  if (fallback.error) {
    console.error("[ListingDetail] Images :", fallback.error);
    return [];
  }

  return sortImages((fallback.data ?? []) as ListingImage[]);
}

async function loadRawListing(
  supabase: SupabaseClient,
  slug: string,
): Promise<RawListing | null> {
  /*
   * Requête détaillée.
   * On n'utilise aucune jointure PostgREST ici : une relation
   * cassée ne peut donc plus masquer toute l'annonce.
   */
  const complete = await supabase
    .from("listings")
    .select(
      `
      id,
      user_id,
      slug,
      title,
      description,
      price,
      currency,
      condition,
      phone_visible,
      whatsapp_enabled,
      negotiable,
      created_at,
      address_text,
      status,
      category_id,
      region_id,
      city_id,
      commune_id
    `,
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!complete.error) {
    return complete.data as RawListing | null;
  }

  console.warn(
    "[ListingDetail] Requête détaillée impossible, fallback :",
    complete.error,
  );

  /*
   * Fallback minimal. Les champs secondaires prennent ensuite
   * des valeurs par défaut, mais titre, description et photos
   * restent affichables.
   */
  const fallback = await supabase
    .from("listings")
    .select(
      `
      id,
      user_id,
      slug,
      title,
      description,
      price,
      currency,
      condition,
      created_at,
      status,
      category_id,
      region_id,
      city_id,
      commune_id
    `,
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (fallback.error) {
    console.error("[ListingDetail] Annonce :", fallback.error);
    throw fallback.error;
  }

  if (!fallback.data) return null;

  return {
    ...(fallback.data as any),
    phone_visible: false,
    whatsapp_enabled: false,
    negotiable: false,
    address_text: null,
  } as RawListing;
}

async function loadListing(
  supabase: SupabaseClient,
  slug: string,
): Promise<Listing | null> {
  const raw = await loadRawListing(supabase, slug);

  if (!raw) return null;

  const [seller, category, region, city, commune, images] =
    await Promise.all([
      loadSeller(supabase, raw.user_id),
      loadNamedRelation(supabase, "categories", raw.category_id),
      loadNamedRelation(supabase, "regions", raw.region_id),
      loadNamedRelation(supabase, "cities", raw.city_id),
      loadNamedRelation(supabase, "communes", raw.commune_id),
      loadListingImages(supabase, raw.id),
    ]);

  return {
    ...raw,
    seller,
    category,
    region,
    city,
    commune,
    images,
  };
}

function ListingDetail() {
  const { slug } = Route.useParams();
  const { supabase, user } = useSupabase();
  const navigate = useNavigate();

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [imgIdx, setImgIdx] = useState(0);
  const [isFav, setIsFav] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    let cancelled = false;

    void (async () => {
      try {
        setLoading(true);
        setLoadError("");
        setImgIdx(0);
        setShowFullDescription(false);

        const result = await loadListing(supabase, slug);

        if (cancelled) return;

        setListing(result);

        if (!result) {
          setLoadError("Cette annonce est introuvable ou n'est plus publiée.");
        }
      } catch (error) {
        if (cancelled) return;

        console.error("[ListingDetail]", error);
        setListing(null);
        setLoadError("Impossible de charger cette annonce.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase, slug]);

  useEffect(() => {
    if (!user || !listing) {
      setIsFav(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      const { data } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("listing_id", listing.id)
        .maybeSingle();

      if (!cancelled) setIsFav(Boolean(data));
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase, user, listing]);

  const images = useMemo(
    () => sortImages(listing?.images ?? []),
    [listing?.images],
  );

  const currentImage = images[imgIdx] ?? images[0] ?? null;

  const location = useMemo(() => {
    if (!listing) return "";

    return [
      listing.address_text,
      listing.commune?.name,
      listing.city?.name,
      listing.region?.name,
    ]
      .filter(Boolean)
      .join(", ");
  }, [listing]);

  const toggleFav = async () => {
    if (!listing) return;

    if (!user) {
      navigate({ to: "/auth" });
      return;
    }

    if (isFav) {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("listing_id", listing.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      setIsFav(false);
      return;
    }

    const { error } = await supabase.from("favorites").insert({
      user_id: user.id,
      listing_id: listing.id,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    setIsFav(true);
  };

  const contactSeller = async () => {
    if (!listing) return;

    if (!user) {
      navigate({ to: "/auth" });
      return;
    }

    if (user.id === listing.user_id) {
      toast.info("Vous êtes le propriétaire de cette annonce.");
      return;
    }

    const content = window.prompt("Votre message au vendeur :");

    if (!content?.trim()) return;

    const message = content.trim();

    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .upsert(
        {
          listing_id: listing.id,
          buyer_id: user.id,
          seller_id: listing.user_id,
          last_message: message,
          last_message_at: new Date().toISOString(),
        },
        {
          onConflict: "listing_id,buyer_id,seller_id",
        },
      )
      .select("id")
      .maybeSingle();

    if (conversationError || !conversation) {
      toast.error(conversationError?.message ?? "Erreur");
      return;
    }

    const { error: messageError } = await supabase.from("messages").insert({
      conversation_id: conversation.id,
      sender_id: user.id,
      receiver_id: listing.user_id,
      content: message,
    });

    if (messageError) {
      toast.error(messageError.message);
      return;
    }

    toast.success("Message envoyé");
    navigate({ to: "/messages" });
  };

  const report = async () => {
    if (!listing) return;

    if (!user) {
      navigate({ to: "/auth" });
      return;
    }

    const reason = window.prompt("Motif du signalement :");

    if (!reason?.trim()) return;

    const { error } = await supabase.from("reports").insert({
      listing_id: listing.id,
      reporter_id: user.id,
      reported_user_id: listing.user_id,
      reason: reason.trim(),
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Signalement envoyé");
  };

  const share = async () => {
    if (!listing) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: listing.title,
          text: listing.description ?? undefined,
          url: window.location.href,
        });
        return;
      }

      await navigator.clipboard.writeText(window.location.href);
      toast.success("Lien copié");
    } catch {
      // L'utilisateur peut simplement annuler la feuille de partage.
    }
  };

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="mt-4 text-sm text-slate-500">Chargement…</p>
        </div>
      </main>
    );
  }

  if (!listing) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <Box className="mx-auto h-12 w-12 text-slate-400" />
          <h1 className="mt-4 text-2xl font-black text-slate-950">
            Annonce introuvable
          </h1>
          <p className="mt-2 text-sm text-slate-500">{loadError}</p>

          <Button asChild className="mt-6 rounded-full bg-blue-600">
            <Link to="/annonces">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux annonces
            </Link>
          </Button>
        </div>
      </main>
    );
  }

  const condition = conditionLabel(listing.condition);
  const sellerName =
    listing.seller?.business_name ||
    listing.seller?.display_name ||
    "Utilisateur Kafoo";

  const description = listing.description?.trim() || "";
  const shouldCollapse = description.length > 320;
  const visibleDescription =
    shouldCollapse && !showFullDescription
      ? `${description.slice(0, 320).trim()}…`
      : description;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Link
          to="/annonces"
          className="mb-5 inline-flex items-center text-sm font-bold text-blue-600"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux annonces
        </Link>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(340px,.75fr)]">
          <div className="min-w-0 space-y-6">
            {/* Résumé visuel inspiré de la carte fournie */}
            <section className="overflow-hidden rounded-[2rem] border bg-white shadow-sm">
              <div className="relative flex min-h-[360px] items-center justify-center bg-slate-100 sm:min-h-[560px]">
                {currentImage ? (
                  <img
                    src={currentImage.image_url}
                    alt={listing.title}
                    className="max-h-[720px] w-full object-contain"
                  />
                ) : (
                  <div className="flex min-h-[420px] flex-col items-center justify-center text-slate-400">
                    <Box className="h-14 w-14" />
                    <span className="mt-3 text-sm font-semibold">
                      Aucune photo
                    </span>
                  </div>
                )}

                <span className="absolute left-5 top-5 rounded-full bg-white/95 px-4 py-2 text-xs font-black text-slate-700 shadow-md">
                  {listing.category?.name || "Annonce"}
                </span>

                {condition && (
                  <span className="absolute right-5 top-5 rounded-full bg-emerald-500 px-4 py-2 text-xs font-black uppercase tracking-wide text-white shadow-md">
                    {condition}
                  </span>
                )}

                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setImgIdx(
                          (current) =>
                            (current - 1 + images.length) % images.length,
                        )
                      }
                      className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg"
                      aria-label="Photo précédente"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setImgIdx((current) => (current + 1) % images.length)
                      }
                      className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg"
                      aria-label="Photo suivante"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>

                    <span className="absolute bottom-4 right-4 rounded-full bg-slate-950/75 px-3 py-1.5 text-xs font-bold text-white">
                      {imgIdx + 1} / {images.length}
                    </span>
                  </>
                )}
              </div>

              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto border-t p-3">
                  {images.map((image, index) => (
                    <button
                      type="button"
                      key={image.id}
                      onClick={() => setImgIdx(index)}
                      className={`h-20 w-24 shrink-0 overflow-hidden rounded-xl border-2 ${
                        index === imgIdx
                          ? "border-blue-600"
                          : "border-transparent"
                      }`}
                    >
                      <img
                        src={image.image_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section
              id="description"
              className="rounded-3xl border bg-white p-6 shadow-sm"
            >
              <h2 className="text-xl font-black text-slate-950">
                Description de l'article
              </h2>

              {description ? (
                <>
                  <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-slate-600 sm:text-base">
                    {visibleDescription}
                  </p>

                  {shouldCollapse && (
                    <button
                      type="button"
                      onClick={() =>
                        setShowFullDescription((current) => !current)
                      }
                      className="mt-4 font-black text-blue-600 hover:underline"
                    >
                      {showFullDescription ? "Voir moins" : "Voir plus"}
                    </button>
                  )}
                </>
              ) : (
                <p className="mt-4 text-sm italic text-slate-400">
                  Le vendeur n'a pas ajouté de description.
                </p>
              )}
            </section>
          </div>

          <aside className="min-w-0 space-y-4">
            <section className="rounded-[2rem] border bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-wide text-blue-600">
                    {listing.category?.name || "Petite annonce"}
                  </p>

                  <h1 className="mt-2 break-words text-2xl font-black leading-tight text-slate-950 sm:text-3xl">
                    {listing.title}
                  </h1>
                </div>

                <button
                  type="button"
                  onClick={() => void toggleFav()}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border bg-white"
                  aria-label="Favori"
                >
                  <Heart
                    className={`h-5 w-5 ${
                      isFav ? "fill-current text-red-500" : "text-slate-500"
                    }`}
                  />
                </button>
              </div>

              <p className="mt-7 text-3xl font-black text-slate-950">
                {formatPrice(listing.price, listing.currency)}
              </p>

              {listing.negotiable && (
                <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                  Prix négociable
                </span>
              )}

              <div className="mt-6 border-t">
                {listing.condition && (
                  <DetailRow
                    icon={<Tag className="h-4 w-4" />}
                    label="État"
                    value={condition || listing.condition}
                  />
                )}

                <DetailRow
                  icon={<MapPin className="h-4 w-4" />}
                  label="Localisation"
                  value={location || "Non renseignée"}
                />

                <DetailRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Publié le"
                  value={new Date(listing.created_at).toLocaleDateString(
                    "fr-FR",
                  )}
                />
              </div>

              <a
                href="#description"
                className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-black text-blue-700 hover:bg-blue-100"
              >
                Voir plus de détails
              </a>

              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <Button
                  type="button"
                  onClick={() => void contactSeller()}
                  className="rounded-xl bg-blue-600 font-bold hover:bg-blue-700"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Message
                </Button>

                {listing.phone_visible && listing.seller?.phone && (
                  <Button asChild variant="outline" className="rounded-xl">
                    <a href={`tel:${listing.seller.phone}`}>
                      <Phone className="mr-2 h-4 w-4" />
                      Appeler
                    </a>
                  </Button>
                )}

                {listing.whatsapp_enabled && listing.seller?.whatsapp && (
                  <Button asChild variant="outline" className="rounded-xl">
                    <a
                      href={`https://wa.me/${listing.seller.whatsapp.replace(
                        /\D/g,
                        "",
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      WhatsApp
                    </a>
                  </Button>
                )}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void share()}
                  className="rounded-xl"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Partager
                </Button>
              </div>
            </section>

            <section className="rounded-3xl border bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <User className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Vendeur
                  </p>
                  <p className="truncate text-lg font-black text-slate-950">
                    {sellerName}
                  </p>
                </div>
              </div>
            </section>

            <button
              type="button"
              onClick={() => void report()}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border bg-white px-4 py-3 text-sm font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600"
            >
              <Flag className="h-4 w-4" />
              Signaler l'annonce
            </button>
          </aside>
        </div>
      </div>
    </main>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b py-4 last:border-b-0">
      <div className="mt-0.5 text-slate-400">{icon}</div>

      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-400">{label}</p>
        <p className="mt-1 break-words text-sm font-semibold text-slate-700">
          {value}
        </p>
      </div>
    </div>
  );
}

from pathlib import Path

code = r'''import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
  district_id: string | null;

  seller: Seller | null;
  category: NamedRelation | null;
  region: NamedRelation | null;
  city: NamedRelation | null;
  commune: NamedRelation | null;
  district: NamedRelation | null;
  images: ListingImage[];
};

type BaseListingRow = Omit<
  Listing,
  | "seller"
  | "category"
  | "region"
  | "city"
  | "commune"
  | "district"
  | "images"
>;

function sortImages(images: ListingImage[]): ListingImage[] {
  return [...images].sort((a, b) => {
    if (a.is_main && !b.is_main) return -1;
    if (!a.is_main && b.is_main) return 1;

    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });
}

async function loadNamedRelation(
  supabase: SupabaseClient,
  table: "categories" | "regions" | "cities" | "communes" | "districts",
  id: string | null,
): Promise<NamedRelation | null> {
  if (!id) return null;

  const { data, error } = await supabase
    .from(table)
    .select("name")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.warn(`[ListingDetail] Relation ${table} indisponible :`, error);
    return null;
  }

  return (data as NamedRelation | null) ?? null;
}

async function loadSeller(
  supabase: SupabaseClient,
  userId: string,
): Promise<Seller | null> {
  const rich = await supabase
    .from("profiles")
    .select("display_name,business_name,phone,whatsapp,account_type")
    .eq("user_id", userId)
    .maybeSingle();

  if (!rich.error) {
    return (rich.data as Seller | null) ?? null;
  }

  console.warn(
    "[ListingDetail] Profil vendeur complet indisponible, fallback minimal :",
    rich.error,
  );

  const basic = await supabase
    .from("profiles")
    .select("display_name,phone")
    .eq("user_id", userId)
    .maybeSingle();

  if (basic.error) {
    console.warn("[ListingDetail] Profil vendeur indisponible :", basic.error);
    return null;
  }

  const row = basic.data as
    | { display_name: string | null; phone: string | null }
    | null;

  if (!row) return null;

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
  const full = await supabase
    .from("listing_images")
    .select("id,image_url,storage_path,is_main,sort_order")
    .eq("listing_id", listingId)
    .order("is_main", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (!full.error) {
    return sortImages((full.data ?? []) as ListingImage[]);
  }

  console.warn(
    "[ListingDetail] Chargement complet des images impossible, fallback :",
    full.error,
  );

  const fallback = await supabase
    .from("listing_images")
    .select("id,image_url,is_main")
    .eq("listing_id", listingId)
    .order("is_main", { ascending: false });

  if (fallback.error) {
    console.error(
      "[ListingDetail] Impossible de charger les images :",
      fallback.error,
    );
    return [];
  }

  return sortImages((fallback.data ?? []) as ListingImage[]);
}

async function loadListingDetail(
  supabase: SupabaseClient,
  slug: string,
): Promise<Listing | null> {
  /*
   * La fiche est volontairement chargée SANS jointures PostgREST.
   *
   * Ainsi, une relation mal configurée (districts, profiles, etc.)
   * ne peut plus faire échouer toute l'annonce, sa description
   * ou sa galerie d'images.
   */
  const { data, error } = await supabase
    .from("listings")
    .select(
      `
      id,
      user_id,
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
      commune_id,
      district_id
    `,
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("[ListingDetail] Impossible de charger l'annonce :", error);
    throw error;
  }

  if (!data) return null;

  const base = data as BaseListingRow;

  const [
    seller,
    category,
    region,
    city,
    commune,
    district,
    images,
  ] = await Promise.all([
    loadSeller(supabase, base.user_id),
    loadNamedRelation(supabase, "categories", base.category_id),
    loadNamedRelation(supabase, "regions", base.region_id),
    loadNamedRelation(supabase, "cities", base.city_id),
    loadNamedRelation(supabase, "communes", base.commune_id),
    loadNamedRelation(supabase, "districts", base.district_id),
    loadListingImages(supabase, base.id),
  ]);

  return {
    ...base,
    seller,
    category,
    region,
    city,
    commune,
    district,
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
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    let cancelled = false;

    void (async () => {
      try {
        setLoading(true);
        setLoadError("");
        setImgIdx(0);

        const result = await loadListingDetail(supabase, slug);

        if (cancelled) return;

        setListing(result);

        if (!result) {
          setLoadError("Cette annonce est introuvable ou n'est plus publiée.");
        }
      } catch (error) {
        if (cancelled) return;

        const message =
          error instanceof Error
            ? error.message
            : "Impossible de charger cette annonce.";

        setLoadError(message);
        setListing(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase, slug]);

  useEffect(() => {
    if (!listing) return;

    document.title = `${listing.title} — Kafoo`;

    let meta = document.querySelector('meta[name="description"]');

    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }

    const description =
      listing.description?.trim() ||
      `${listing.title} à vendre sur Kafoo.`;

    meta.setAttribute("content", description.slice(0, 160));
  }, [listing]);

  useEffect(() => {
    if (!user || !listing) {
      setIsFav(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("listing_id", listing.id)
        .maybeSingle();

      if (!cancelled) {
        if (error) {
          console.warn("[ListingDetail] Favori :", error);
          setIsFav(false);
        } else {
          setIsFav(Boolean(data));
        }
      }
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

  useEffect(() => {
    if (imgIdx >= images.length && images.length > 0) {
      setImgIdx(0);
    }
  }, [images.length, imgIdx]);

  const location = useMemo(() => {
    if (!listing) return "";

    return [
      listing.address_text,
      listing.district?.name,
      listing.commune?.name,
      listing.city?.name,
      listing.region?.name,
    ]
      .filter(Boolean)
      .join(", ");
  }, [listing]);

  const previousImage = () => {
    if (images.length <= 1) return;
    setImgIdx((current) => (current - 1 + images.length) % images.length);
  };

  const nextImage = () => {
    if (images.length <= 1) return;
    setImgIdx((current) => (current + 1) % images.length);
  };

  const toggleFav = async () => {
    if (!listing) return;

    if (!user) {
      navigate({ to: "/auth" });
      return;
    }

    try {
      setFavoriteLoading(true);

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
        toast.success("Annonce retirée des favoris");
      } else {
        const { error } = await supabase.from("favorites").insert({
          user_id: user.id,
          listing_id: listing.id,
        });

        if (error) {
          toast.error(error.message);
          return;
        }

        setIsFav(true);
        toast.success("Annonce ajoutée aux favoris");
      }
    } finally {
      setFavoriteLoading(false);
    }
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
      toast.error(conversationError?.message ?? "Impossible de créer la conversation.");
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
      const url = window.location.href;

      if (navigator.share) {
        await navigator.share({
          title: listing.title,
          text: listing.description ?? undefined,
          url,
        });
        return;
      }

      await navigator.clipboard.writeText(url);
      toast.success("Lien de l'annonce copié");
    } catch (error) {
      console.warn("[ListingDetail] Partage annulé ou indisponible :", error);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center px-4 py-10">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="mt-4 text-sm text-slate-500">Chargement de l'annonce…</p>
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
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
            {loadError ||
              "Cette annonce n'existe plus ou n'est pas disponible publiquement."}
          </p>

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

  const sellerName =
    listing.seller?.business_name ||
    listing.seller?.display_name ||
    "Utilisateur Kafoo";

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Link
          to="/annonces"
          className="mb-5 inline-flex items-center text-sm font-bold text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux annonces
        </Link>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.75fr)]">
          {/* ═══════════════════════════════════════════════
              GALERIE + DESCRIPTION
          ═══════════════════════════════════════════════ */}

          <div className="min-w-0 space-y-6">
            <section className="overflow-hidden rounded-3xl border bg-white shadow-sm">
              <div className="relative flex min-h-[360px] items-center justify-center bg-slate-100 sm:min-h-[520px]">
                {currentImage ? (
                  <img
                    src={currentImage.image_url}
                    alt={`${listing.title} — photo ${imgIdx + 1}`}
                    className="max-h-[720px] w-full object-contain"
                  />
                ) : (
                  <div className="flex min-h-[420px] w-full flex-col items-center justify-center text-slate-400">
                    <Box className="h-14 w-14" />
                    <p className="mt-3 text-sm font-semibold">
                      Aucune photo disponible
                    </p>
                  </div>
                )}

                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={previousImage}
                      className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-slate-900 shadow-lg transition hover:bg-white"
                      aria-label="Photo précédente"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>

                    <button
                      type="button"
                      onClick={nextImage}
                      className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-slate-900 shadow-lg transition hover:bg-white"
                      aria-label="Photo suivante"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>

                    <div className="absolute bottom-3 right-3 rounded-full bg-slate-950/75 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
                      {imgIdx + 1} / {images.length}
                    </div>
                  </>
                )}
              </div>

              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto border-t bg-white p-3">
                  {images.map((image, index) => (
                    <button
                      type="button"
                      key={image.id}
                      onClick={() => setImgIdx(index)}
                      className={`h-20 w-24 shrink-0 overflow-hidden rounded-xl border-2 bg-slate-100 transition ${
                        index === imgIdx
                          ? "border-blue-600 ring-2 ring-blue-100"
                          : "border-transparent hover:border-slate-300"
                      }`}
                      aria-label={`Afficher la photo ${index + 1}`}
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

            <section className="rounded-3xl border bg-white p-5 shadow-sm sm:p-7">
              <h2 className="text-xl font-black text-slate-950">Description</h2>

              {listing.description?.trim() ? (
                <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-slate-600 sm:text-base">
                  {listing.description}
                </p>
              ) : (
                <p className="mt-4 text-sm italic text-slate-400">
                  Le vendeur n'a pas ajouté de description.
                </p>
              )}
            </section>
          </div>

          {/* ═══════════════════════════════════════════════
              INFORMATIONS ANNONCE
          ═══════════════════════════════════════════════ */}

          <aside className="min-w-0 space-y-4">
            <section className="rounded-3xl border bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="break-words text-2xl font-black leading-tight text-slate-950 sm:text-3xl">
                    {listing.title}
                  </h1>

                  <div className="mt-3 flex flex-wrap items-baseline gap-2">
                    <p className="text-2xl font-black text-blue-600 sm:text-3xl">
                      {formatPrice(listing.price, listing.currency)}
                    </p>

                    {listing.negotiable && (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                        Négociable
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void toggleFav()}
                  disabled={favoriteLoading}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                  aria-label={
                    isFav ? "Retirer des favoris" : "Ajouter aux favoris"
                  }
                >
                  <Heart
                    className={`h-5 w-5 ${
                      isFav ? "fill-current text-red-500" : ""
                    }`}
                  />
                </button>
              </div>

              <div className="mt-6 divide-y">
                {listing.category?.name && (
                  <DetailRow
                    icon={<Tag className="h-4 w-4" />}
                    label="Catégorie"
                    value={listing.category.name}
                  />
                )}

                {listing.condition && (
                  <DetailRow
                    icon={<Tag className="h-4 w-4" />}
                    label="État"
                    value={listing.condition}
                  />
                )}

                <DetailRow
                  icon={<MapPin className="h-4 w-4" />}
                  label="Localisation"
                  value={location || "Non renseignée"}
                />

                <DetailRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Publication"
                  value={new Date(listing.created_at).toLocaleDateString(
                    "fr-FR",
                    {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    },
                  )}
                />
              </div>

              <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <Button
                  type="button"
                  onClick={() => void contactSeller()}
                  className="h-11 rounded-xl bg-blue-600 font-bold hover:bg-blue-700"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Message
                </Button>

                {listing.phone_visible && listing.seller?.phone && (
                  <Button
                    asChild
                    variant="outline"
                    className="h-11 rounded-xl"
                  >
                    <a href={`tel:${listing.seller.phone}`}>
                      <Phone className="mr-2 h-4 w-4" />
                      Appeler
                    </a>
                  </Button>
                )}

                {listing.whatsapp_enabled && listing.seller?.whatsapp && (
                  <Button
                    asChild
                    variant="outline"
                    className="h-11 rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                  >
                    <a
                      href={`https://wa.me/${listing.seller.whatsapp.replace(
                        /\D/g,
                        "",
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      WhatsApp
                    </a>
                  </Button>
                )}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void share()}
                  className="h-11 rounded-xl"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Partager
                </Button>
              </div>
            </section>

            <section className="rounded-3xl border bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <User className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Vendeur
                  </p>
                  <h2 className="truncate text-lg font-black text-slate-950">
                    {sellerName}
                  </h2>

                  {listing.seller?.account_type && (
                    <p className="mt-0.5 text-xs capitalize text-slate-500">
                      {listing.seller.account_type}
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-3xl border bg-white p-5 shadow-sm">
              <button
                type="button"
                onClick={() => void report()}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-sm font-semibold text-slate-500 transition hover:bg-red-50 hover:text-red-600"
              >
                <Flag className="h-4 w-4" />
                Signaler cette annonce
              </button>
            </section>
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
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3 text-sm">
      <div className="mt-0.5 text-slate-400">{icon}</div>

      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-400">{label}</p>
        <p className="mt-0.5 break-words font-semibold text-slate-700">
          {value}
        </p>
      </div>
    </div>
  );
}
'''

path = Path("/mnt/data/annonces_slug_corrige.tsx")
path.write_text(code, encoding="utf-8")
print(f"Fichier créé : {path}")
print(f"Lignes : {len(code.splitlines())}")

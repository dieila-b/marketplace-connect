import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowLeft,
  Box,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Flag,
  Heart,
  MapPin,
  Loader2,
  MessageCircle,
  Phone,
  Send,
  Share2,
  Tag,
  User,
} from "lucide-react";

import { useSupabase } from "@/integrations/supabase/provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/components/ListingCard";
import { toast } from "sonner";

export const Route = createFileRoute("/annonce/$slug")({
  component: ListingDetail,
  head: () => ({
    meta: [{ title: "Annonce — Kafoo" }],
  }),
});

type NamedRelation = {
  name: string;
};

type Seller = {
  display_name: string | null;
  business_name: string | null;
  phone: string | null;
  whatsapp: string | null;
  account_type: string | null;
};

type ListingImage = {
  id: string;
  image_url: string;
  is_main: boolean;
  sort_order: number;
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
  created_at: string;
  status: string;

  phone_visible: boolean;
  whatsapp_enabled: boolean;
  negotiable: boolean;
  address_text: string | null;

  category: NamedRelation | null;
  region: NamedRelation | null;
  city: NamedRelation | null;
  commune: NamedRelation | null;

  seller: Seller | null;
  images: ListingImage[];
};

function safeString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function safeBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function safeNumberOrNull(value: unknown): number | null {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
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

  return labels[normalized] ?? condition.replace(/[_-]+/g, " ").toUpperCase();
}

async function loadRelationById(
  supabase: any,
  table: "categories" | "regions" | "cities" | "communes",
  id: unknown,
): Promise<NamedRelation | null> {
  if (typeof id !== "string" || !id) return null;

  const { data, error } = await supabase
    .from(table)
    .select("name")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.warn(`[ListingDetail] ${table}:`, error);
    return null;
  }

  return data ? { name: safeString(data.name) } : null;
}

async function loadSeller(
  supabase: any,
  userId: string,
): Promise<Seller | null> {
  /*
   * select("*") évite de casser la fiche si le schéma profiles
   * n'a pas exactement les colonnes prévues par l'ancienne version.
   */
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.warn("[ListingDetail] Vendeur :", error);
    return null;
  }

  if (!data) return null;

  return {
    display_name:
      typeof data.display_name === "string" ? data.display_name : null,
    business_name:
      typeof data.business_name === "string" ? data.business_name : null,
    phone: typeof data.phone === "string" ? data.phone : null,
    whatsapp: typeof data.whatsapp === "string" ? data.whatsapp : null,
    account_type:
      typeof data.account_type === "string" ? data.account_type : null,
  };
}

async function loadImages(
  supabase: any,
  listingId: string,
): Promise<ListingImage[]> {
  /*
   * On charge toutes les colonnes existantes de listing_images.
   * Cela correspond au schéma vérifié dans Supabase :
   * id, listing_id, image_url, storage_path, is_main,
   * sort_order, created_at.
   */
  const { data, error } = await supabase
    .from("listing_images")
    .select("*")
    .eq("listing_id", listingId)
    .order("is_main", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[ListingDetail] Images :", error);
    return [];
  }

  return (data ?? [])
    .filter((row: any) => typeof row.image_url === "string" && row.image_url)
    .map((row: any) => ({
      id: String(row.id),
      image_url: String(row.image_url),
      is_main: Boolean(row.is_main),
      sort_order:
        typeof row.sort_order === "number" ? row.sort_order : 0,
    }));
}

async function loadListing(
  supabase: any,
  slug: string,
): Promise<Listing | null> {
  /*
   * CORRECTION PRINCIPALE :
   *
   * On ne nomme PLUS les colonnes optionnelles une par une.
   * Avec select("*"), une colonne absente ne peut plus provoquer
   * l'échec complet de la requête.
   */
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("[ListingDetail] Requête annonce :", error);
    throw new Error(error.message);
  }

  if (!data) return null;

  const id = safeString(data.id);
  const userId = safeString(data.user_id);

  if (!id) {
    throw new Error("L'annonce ne possède pas d'identifiant.");
  }

  const [images, seller, category, region, city, commune] = await Promise.all([
    loadImages(supabase, id),
    userId ? loadSeller(supabase, userId) : Promise.resolve(null),
    loadRelationById(supabase, "categories", data.category_id),
    loadRelationById(supabase, "regions", data.region_id),
    loadRelationById(supabase, "cities", data.city_id),
    loadRelationById(supabase, "communes", data.commune_id),
  ]);

  return {
    id,
    user_id: userId,
    slug: safeString(data.slug, slug),
    title: safeString(data.title, "Annonce"),
    description:
      typeof data.description === "string" ? data.description : null,
    price: safeNumberOrNull(data.price),
    currency: safeString(data.currency, "GNF"),
    condition:
      typeof data.condition === "string" ? data.condition : null,
    created_at: safeString(data.created_at, new Date().toISOString()),
    status: safeString(data.status, "published"),

    phone_visible: safeBoolean(data.phone_visible, false),
    whatsapp_enabled: safeBoolean(data.whatsapp_enabled, false),
    negotiable: safeBoolean(data.negotiable, false),
    address_text:
      typeof data.address_text === "string" ? data.address_text : null,

    category,
    region,
    city,
    commune,

    seller,
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

  const [messageOpen, setMessageOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [messageSending, setMessageSending] = useState(false);

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

        const message =
          error instanceof Error
            ? error.message
            : "Impossible de charger cette annonce.";

        console.error("[ListingDetail]", error);
        setListing(null);
        setLoadError(message);
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
      const { data, error } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("listing_id", listing.id)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.warn("[ListingDetail] Favori :", error);
        setIsFav(false);
        return;
      }

      setIsFav(Boolean(data));
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase, user, listing]);

  const images = listing?.images ?? [];
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
      toast.success("Retiré des favoris");
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
    toast.success("Ajouté aux favoris");
  };

  const contactSeller = () => {
    if (!listing) return;

    if (!user) {
      navigate({ to: "/auth" });
      return;
    }

    if (user.id === listing.user_id) {
      toast.info("Vous êtes le propriétaire de cette annonce.");
      return;
    }

    setMessageText(
      `Bonjour, je suis intéressé(e) par votre annonce « ${listing.title} ». Est-elle toujours disponible ?`,
    );
    setMessageOpen(true);
  };

  const sendSellerMessage = async () => {
    if (!listing || !user) return;

    const message = messageText.trim();

    if (!message) {
      toast.error("Écrivez un message avant de l'envoyer.");
      return;
    }

    if (message.length > 1000) {
      toast.error("Votre message ne peut pas dépasser 1 000 caractères.");
      return;
    }

    setMessageSending(true);

    try {
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
        toast.error(
          conversationError?.message ?? "Impossible de créer la conversation.",
        );
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

      setMessageOpen(false);
      setMessageText("");
      toast.success("Message envoyé au vendeur.");

      navigate({ to: "/messages" });
    } finally {
      setMessageSending(false);
    }
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
      // Partage annulé.
    }
  };

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="mt-4 text-sm text-slate-500">
            Chargement de l'annonce…
          </p>
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

          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
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
          className="mb-5 inline-flex items-center text-sm font-bold text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux annonces
        </Link>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(340px,.7fr)]">
          <div className="min-w-0 space-y-6">
            {/* GALERIE */}
            <section className="overflow-hidden rounded-[2rem] border bg-white shadow-sm">
              <div className="relative flex min-h-[360px] items-center justify-center bg-slate-100 sm:min-h-[560px]">
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

            {/* DESCRIPTION */}
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

          {/* INFORMATIONS */}
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
                  onClick={contactSeller}
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

      {messageOpen && listing && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-[3px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="message-seller-title"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target && !messageSending) {
              setMessageOpen(false);
            }
          }}
        >
          <div className="w-full max-w-xl overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-2xl shadow-slate-950/25">
            <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <MessageCircle className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <h2
                    id="message-seller-title"
                    className="text-lg font-black text-slate-950"
                  >
                    Contacter le vendeur
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Envoyez un message à{" "}
                    <span className="font-bold text-slate-700">
                      {sellerName}
                    </span>
                    .
                  </p>
                </div>

                <button
                  type="button"
                  aria-label="Fermer"
                  disabled={messageSending}
                  onClick={() => setMessageOpen(false)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl leading-none text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="space-y-5 px-5 py-5 sm:px-6">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                {currentImage ? (
                  <img
                    src={currentImage.image_url}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-400">
                    <Box className="h-5 w-5" />
                  </div>
                )}

                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-950">
                    {listing.title}
                  </p>
                  <p className="mt-1 text-sm font-bold text-blue-600">
                    {formatPrice(listing.price, listing.currency)}
                  </p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="seller-message"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Votre message
                </label>

                <Textarea
                  id="seller-message"
                  autoFocus
                  value={messageText}
                  maxLength={1000}
                  rows={5}
                  onChange={(event) => setMessageText(event.target.value)}
                  placeholder="Bonjour, votre annonce est-elle toujours disponible ?"
                  className="min-h-[130px] resize-none rounded-2xl border-slate-200 bg-white p-4 text-sm leading-6 focus-visible:ring-blue-500"
                />

                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-[11px] text-slate-400">
                    Évitez de partager des informations sensibles.
                  </p>
                  <span
                    className={`shrink-0 text-[11px] font-semibold ${
                      messageText.length > 900
                        ? "text-orange-600"
                        : "text-slate-400"
                    }`}
                  >
                    {messageText.length}/1000
                  </span>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                  Messages rapides
                </p>

                <div className="flex flex-wrap gap-2">
                  {[
                    "Bonjour, l'annonce est-elle toujours disponible ?",
                    "Le prix est-il négociable ?",
                    "Quand peut-on se rencontrer ?",
                  ].map((quickMessage) => (
                    <button
                      key={quickMessage}
                      type="button"
                      disabled={messageSending}
                      onClick={() => setMessageText(quickMessage)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
                    >
                      {quickMessage}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              <Button
                type="button"
                variant="outline"
                disabled={messageSending}
                onClick={() => setMessageOpen(false)}
                className="h-11 rounded-xl px-5 font-bold"
              >
                Annuler
              </Button>

              <Button
                type="button"
                disabled={messageSending || !messageText.trim()}
                onClick={() => void sendSellerMessage()}
                className="h-11 rounded-xl bg-blue-600 px-6 font-black text-white shadow-md shadow-blue-600/15 hover:bg-blue-700"
              >
                {messageSending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}

                {messageSending ? "Envoi..." : "Envoyer le message"}
              </Button>
            </div>
          </div>
        </div>
      )}
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

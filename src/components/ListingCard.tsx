import { Link } from "@tanstack/react-router";
import { ArrowRight, Heart, MapPin } from "lucide-react";

export type ListingRow = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  price: number | null;
  currency: string;
  condition?: string | null;
  is_featured?: boolean | null;
  is_sponsored?: boolean | null;
  created_at?: string;
  category?: { name: string } | null;
  region?: { name: string } | null;
  city?: { name: string } | null;
  commune?: { name: string } | null;
  images?: Array<{
    image_url: string;
    is_main?: boolean | null;
  }> | null;
};

export function formatPrice(
  price: number | null | undefined,
  currency = "GNF",
) {
  if (price == null) return "Prix sur demande";

  return `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(price)} ${currency}`;
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

function getMainImage(listing: ListingRow) {
  const images = Array.isArray(listing.images) ? listing.images : [];

  return (
    images.find((image) => image.is_main)?.image_url ??
    images[0]?.image_url ??
    null
  );
}

export function ListingCard({ listing }: { listing: ListingRow }) {
  const imageUrl = getMainImage(listing);
  const condition = conditionLabel(listing.condition);

  const location =
    listing.commune?.name ||
    listing.city?.name ||
    listing.region?.name ||
    "Guinée";

  const label = listing.is_sponsored
    ? "Sponsorisé"
    : listing.is_featured
      ? "À la une"
      : listing.category?.name || "Annonce";

  return (
    <article className="group relative min-w-0 overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <Link
        to="/annonces/$slug"
        params={{ slug: listing.slug }}
        className="block"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={listing.title}
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-400">
              Aucune photo
            </div>
          )}

          <span className="absolute left-4 top-4 max-w-[55%] truncate rounded-full bg-white/95 px-4 py-2 text-xs font-black text-slate-700 shadow-md backdrop-blur">
            {label}
          </span>

          {condition && (
            <span className="absolute right-4 top-4 max-w-[55%] truncate rounded-full bg-emerald-500 px-4 py-2 text-[11px] font-black uppercase tracking-wide text-white shadow-md">
              {condition}
            </span>
          )}
        </div>

        <div className="p-5 sm:p-6">
          <p className="text-xs font-black uppercase tracking-wide text-blue-600">
            {listing.category?.name || "Petite annonce"}
          </p>

          <h3 className="mt-2 line-clamp-2 min-h-[3.4rem] text-lg font-black leading-snug text-slate-950">
            {listing.title}
          </h3>

          <p className="mt-5 text-2xl font-black text-slate-950">
            {formatPrice(listing.price, listing.currency)}
          </p>

          <div className="mt-5 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2 text-sm text-slate-500">
                <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="truncate">{location}</span>
              </div>

              <span className="inline-flex shrink-0 items-center text-sm font-black text-blue-600">
                Voir
                <ArrowRight className="ml-1 h-4 w-4" />
              </span>
            </div>
          </div>
        </div>
      </Link>

      <button
        type="button"
        aria-label="Ajouter aux favoris"
        title="Ajouter aux favoris"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        className="absolute right-4 top-[calc(75%-2.75rem)] hidden h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-md transition hover:text-red-500 sm:flex"
      >
        <Heart className="h-4 w-4" />
      </button>
    </article>
  );
}

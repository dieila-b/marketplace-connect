import { Link } from "@tanstack/react-router";
import { MapPin, Heart, Star } from "lucide-react";

export type ListingRow = {
  id: string;
  slug: string;
  title: string;
  price: number | null;
  currency: string;
  condition: string | null;
  is_featured: boolean | null;
  is_sponsored: boolean | null;
  created_at: string;
  city?: { name: string } | null;
  commune?: { name: string } | null;
  region?: { name: string } | null;
  images?: { image_url: string; is_main: boolean }[];
};

export function formatPrice(price: number | null, currency: string) {
  if (price == null) return "Gratuit";
  return new Intl.NumberFormat("fr-FR").format(price) + " " + currency;
}

export function ListingCard({ listing }: { listing: ListingRow }) {
  const main = listing.images?.find((i) => i.is_main) ?? listing.images?.[0];
  const loc = listing.commune?.name ?? listing.city?.name ?? listing.region?.name ?? "—";
  return (
    <Link
      to="/annonces/$slug"
      params={{ slug: listing.slug }}
      className="group block overflow-hidden rounded-xl border bg-card transition hover:shadow-md"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        {main ? (
          <img
            src={main.image_url}
            alt={listing.title}
            loading="lazy"
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Pas d'image</div>
        )}
        {listing.is_sponsored && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
            <Star className="h-3 w-3" /> Sponsorisé
          </span>
        )}
        <button
          type="button"
          className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5 backdrop-blur"
          aria-label="Favori"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >
          <Heart className="h-4 w-4" />
        </button>
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-medium">{listing.title}</h3>
        </div>
        <p className="mt-1 font-semibold text-primary">{formatPrice(listing.price, listing.currency)}</p>
        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" /> {loc}
        </p>
      </div>
    </Link>
  );
}

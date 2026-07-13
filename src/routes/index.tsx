import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowRight,
  Baby,
  Bike,
  BookOpen,
  Box,
  Briefcase,
  Car,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Dog,
  Dumbbell,
  Gem,
  HomeIcon,
  Laptop,
  MapPin,
  MessageCircle,
  PlusCircle,
  Search,
  ShieldCheck,
  Shirt,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Tv,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import { useSupabase } from "@/integrations/supabase/provider";
import { ListingCard, type ListingRow } from "@/components/ListingCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kafoo — Petites annonces en Guinée" },
      {
        name: "description",
        content:
          "Kafoo Marketplace : achetez, vendez et publiez vos annonces en Guinée.",
      },
    ],
  }),
  component: HomePage,
});

type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
};

type LocationOption = {
  id: string;
  name: string;
  slug: string;
};

type DemoListing = {
  id: string;
  title: string;
  price: string;
  location: string;
  category: string;
  condition: string;
  image: string;
  badge?: string;
};

const demoListings: DemoListing[] = [
  {
    id: "demo-1",
    title: "iPhone 13 Pro 128 Go",
    price: "4 500 000 GNF",
    location: "Conakry, Ratoma",
    category: "Téléphones",
    condition: "Très bon état",
    image:
      "https://images.unsplash.com/photo-1632661674596-df8be070a5c5?auto=format&fit=crop&w=900&q=80",
    badge: "Exemple",
  },
  {
    id: "demo-2",
    title: "Toyota Corolla automatique",
    price: "85 000 000 GNF",
    location: "Conakry, Dixinn",
    category: "Véhicules",
    condition: "Occasion",
    image:
      "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=900&q=80",
    badge: "Exemple",
  },
  {
    id: "demo-3",
    title: "Canapé moderne 5 places",
    price: "3 200 000 GNF",
    location: "Conakry, Matoto",
    category: "Meubles",
    condition: "Bon état",
    image:
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80",
    badge: "Exemple",
  },
  {
    id: "demo-4",
    title: "Ordinateur HP Core i5",
    price: "2 800 000 GNF",
    location: "Conakry, Kaloum",
    category: "Ordinateurs",
    condition: "Très bon état",
    image:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80",
    badge: "Exemple",
  },
];

const iconMap: Record<string, LucideIcon> = {
  smartphone: Smartphone,
  laptop: Laptop,
  tv: Tv,
  car: Car,
  bike: Bike,
  home: HomeIcon,
  sofa: HomeIcon,
  refrigerator: HomeIcon,
  shirt: Shirt,
  footprints: Shirt,
  gem: Gem,
  baby: Baby,
  flower: HomeIcon,
  dumbbell: Dumbbell,
  briefcase: Briefcase,
  wrench: Wrench,
  "user-tie": Briefcase,
  dog: Dog,
  book: BookOpen,
  box: Box,
};

const categoryStyles = [
  "bg-blue-50 text-blue-700 border-blue-100",
  "bg-emerald-50 text-emerald-700 border-emerald-100",
  "bg-orange-50 text-orange-700 border-orange-100",
  "bg-violet-50 text-violet-700 border-violet-100",
  "bg-rose-50 text-rose-700 border-rose-100",
  "bg-cyan-50 text-cyan-700 border-cyan-100",
];

function getCategoryIcon(icon: string | null) {
  if (!icon) return Box;
  return iconMap[icon] ?? Box;
}

function HomePage() {
  const { supabase } = useSupabase();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [regions, setRegions] = useState<LocationOption[]>([]);
  const [cities, setCities] = useState<LocationOption[]>([]);
  const [communes, setCommunes] = useState<LocationOption[]>([]);
  const [recent, setRecent] = useState<ListingRow[]>([]);

  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [commune, setCommune] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    void (async () => {
      const [
        { data: cats },
        { data: regionRows },
        { data: cityRows },
        { data: communeRows },
        { data: list },
      ] = await Promise.all([
        supabase
          .from("categories")
          .select("id,name,slug,icon")
          .is("parent_id", null)
          .eq("is_active", true)
          .order("sort_order"),

        supabase.from("regions").select("id,name,slug").order("name"),

        supabase.from("cities").select("id,name,slug").order("name"),

        supabase.from("communes").select("id,name,slug").order("name"),

        supabase
          .from("listings")
          .select(`
            id,slug,title,price,currency,condition,is_featured,is_sponsored,created_at,
            region:regions(name), city:cities(name), commune:communes(name),
            images:listing_images(image_url,is_main)
          `)
          .in("status", ["active", "published"])
          .order("is_sponsored", { ascending: false })
          .order("is_featured", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(12),
      ]);

      setCategories((cats ?? []) as Category[]);
      setRegions((regionRows ?? []) as LocationOption[]);
      setCities((cityRows ?? []) as LocationOption[]);
      setCommunes((communeRows ?? []) as LocationOption[]);
      setRecent((list ?? []) as unknown as ListingRow[]);
    })();
  }, [supabase]);

  const displayedCategories = showAllCategories
    ? categories
    : categories.slice(0, 10);

  const hasMoreCategories = categories.length > 10;

  const onSearch = (e: FormEvent) => {
    e.preventDefault();

    navigate({
      to: "/annonces",
      search: {
        q: q || undefined,
        category: category || undefined,
        region: region || undefined,
        city: city || undefined,
        commune: commune || undefined,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
      } as never,
    });
  };

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-slate-50">
      <section className="relative w-full overflow-hidden bg-slate-950 px-4 py-14 text-white sm:px-6 sm:py-16 lg:px-8 lg:py-20 xl:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(37,99,235,0.48),transparent_34%),radial-gradient(circle_at_82%_10%,rgba(168,85,247,0.40),transparent_34%),radial-gradient(circle_at_50%_100%,rgba(20,184,166,0.32),transparent_38%)]" />

        <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center text-center">
          <div className="mb-5 inline-flex max-w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-white/90 backdrop-blur">
            <Sparkles className="h-4 w-4 shrink-0 text-yellow-300" />
            <span className="truncate">
              Nouvelle marketplace locale en Guinée
            </span>
          </div>

          <h1 className="mx-auto max-w-6xl break-words text-center text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl">
            Vendez et trouvez vos bonnes affaires près de chez vous
          </h1>

          <p className="mx-auto mt-6 max-w-4xl text-center text-base leading-7 text-slate-200 sm:text-lg">
            Téléphones, véhicules, immobilier, meubles, mode, électroménager et
            services. Publiez gratuitement et échangez directement avec les
            acheteurs partout en Guinée.
          </p>

          <div className="mt-8 flex w-full max-w-md flex-col items-center justify-center gap-3 sm:max-w-none sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-12 w-full rounded-full bg-white px-6 font-bold text-slate-950 hover:bg-slate-100 sm:w-auto"
            >
              <Link to="/publier">
                <PlusCircle className="mr-2 h-5 w-5" />
                Publier gratuitement
              </Link>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 w-full rounded-full border-white/30 bg-white/10 px-6 font-bold text-white hover:bg-white/20 hover:text-white sm:w-auto"
            >
              <Link to="/annonces">
                Explorer
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>

          <div className="mt-10 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
            <MiniStat value={categories.length} label="Catégories" />
            <MiniStat value={recent.length} label="Annonces" />
            <MiniStat value="GN" label="Local" />
          </div>

          <div className="mt-12 w-full max-w-5xl">
            <form
              onSubmit={onSearch}
              className="rounded-[2rem] border border-white/15 bg-white p-3 text-slate-950 shadow-2xl sm:p-4"
            >
              <div className="flex flex-col gap-3 lg:flex-row">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Que recherchez-vous ?"
                    className="h-12 w-full rounded-2xl bg-slate-50 pl-12 text-sm sm:h-14"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="h-12 w-full rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-fuchsia-600 px-6 font-black text-white sm:h-14 lg:w-auto"
                >
                  <Search className="mr-2 h-5 w-5" />
                  Rechercher
                </Button>

                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  onClick={() => setShowAdvancedSearch((current) => !current)}
                  className="h-12 w-full rounded-2xl border-slate-200 bg-slate-50 px-5 font-bold text-slate-700 hover:bg-slate-100 sm:h-14 lg:w-auto"
                >
                  <SlidersHorizontal className="mr-2 h-5 w-5" />
                  {showAdvancedSearch ? "Fermer" : "Recherche avancée"}
                </Button>
              </div>

              {showAdvancedSearch ? (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <SelectField
                      value={category}
                      onChange={setCategory}
                      label="Catégorie"
                    >
                      <option value="">Toutes</option>
                      {categories.map((item) => (
                        <option key={item.id} value={item.slug}>
                          {item.name}
                        </option>
                      ))}
                    </SelectField>

                    <SelectField
                      value={region}
                      onChange={setRegion}
                      label="Région"
                    >
                      <option value="">Toutes</option>
                      {regions.map((item) => (
                        <option key={item.id} value={item.slug}>
                          {item.name}
                        </option>
                      ))}
                    </SelectField>

                    <SelectField value={city} onChange={setCity} label="Ville">
                      <option value="">Toutes</option>
                      {cities.map((item) => (
                        <option key={item.id} value={item.slug}>
                          {item.name}
                        </option>
                      ))}
                    </SelectField>

                    <SelectField
                      value={commune}
                      onChange={setCommune}
                      label="Commune"
                    >
                      <option value="">Toutes</option>
                      {communes.map((item) => (
                        <option key={item.id} value={item.slug}>
                          {item.name}
                        </option>
                      ))}
                    </SelectField>

                    <Input
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      type="number"
                      min="0"
                      placeholder="Prix min"
                      className="h-12 rounded-xl bg-slate-50"
                    />

                    <Input
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      type="number"
                      min="0"
                      placeholder="Prix max"
                      className="h-12 rounded-xl bg-slate-50"
                    />
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAdvancedSearch(false)}
                      className="rounded-full bg-slate-100 px-5 font-bold text-slate-700 hover:bg-slate-200"
                    >
                      Fermer
                    </Button>
                  </div>
                </div>
              ) : null}
            </form>
          </div>
        </div>
      </section>

      <section className="kafoo-container py-7">
        <div className="grid gap-3 rounded-3xl bg-white p-3 shadow-sm sm:grid-cols-3">
          <TrustItem
            icon={PlusCircle}
            title="Publier rapidement"
            description="Ajoutez photos, prix et localisation en quelques minutes."
            color="bg-blue-100 text-blue-700"
          />
          <TrustItem
            icon={MapPin}
            title="Acheter localement"
            description="Recherchez par région, ville, commune ou quartier."
            color="bg-emerald-100 text-emerald-700"
          />
          <TrustItem
            icon={MessageCircle}
            title="Contacter facilement"
            description="Échangez par message, téléphone ou WhatsApp."
            color="bg-orange-100 text-orange-700"
          />
        </div>
      </section>

      <section className="kafoo-container py-10">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
              Explorer
            </p>
            <h2 className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">
              Catégories populaires
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Choisissez une rubrique pour trouver rapidement une annonce.
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto md:justify-end">
            {hasMoreCategories && (
              <Button
                type="button"
                variant="outline"
                className="rounded-full bg-white"
                onClick={() => setShowAllCategories((current) => !current)}
              >
                {showAllCategories ? "Voir moins" : "Voir plus"}
                {showAllCategories ? (
                  <ChevronUp className="ml-2 h-4 w-4" />
                ) : (
                  <ChevronDown className="ml-2 h-4 w-4" />
                )}
              </Button>
            )}

            <Button asChild variant="outline" className="rounded-full bg-white">
              <Link to="/annonces">
                Tout voir
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {categories.length === 0 ? (
          <EmptyState
            title="Aucune catégorie disponible"
            description="Les catégories seront affichées dès leur ajout dans Supabase."
          />
        ) : (
          <div className="kafoo-category-grid">
            {displayedCategories.map((item, index) => {
              const Icon = getCategoryIcon(item.icon);
              const style = categoryStyles[index % categoryStyles.length];

              return (
                <Link
                  key={item.id}
                  to="/annonces"
                  search={{ category: item.slug } as never}
                  className={`group flex min-h-[132px] min-w-0 flex-col rounded-2xl border p-4 transition hover:-translate-y-1 hover:shadow-lg ${style}`}
                >
                  <div className="mb-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>

                  <h3 className="line-clamp-2 min-h-[36px] break-words text-sm font-black leading-tight text-slate-950">
                    {item.name}
                  </h3>

                  <p className="mt-auto flex items-center pt-3 text-xs font-semibold text-slate-500">
                    Voir
                    <ArrowRight className="ml-1 h-3 w-3 transition group-hover:translate-x-1" />
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="kafoo-container py-10">
        <SectionHeader
          eyebrow={recent.length === 0 ? "Aperçu" : "Nouveautés"}
          title={recent.length === 0 ? "Exemples d’annonces" : "Annonces récentes"}
          description={
            recent.length === 0
              ? "Voici quelques exemples pour présenter le style des annonces. Elles seront remplacées par les vraies annonces publiées."
              : "Les dernières annonces publiées par les vendeurs."
          }
          action={
            <Button asChild variant="outline" className="rounded-full bg-white">
              <Link to="/annonces">
                Voir les annonces
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          }
        />

        {recent.length === 0 ? (
          <>
            <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
              Ces annonces sont des exemples d’affichage. Publiez une vraie
              annonce pour commencer à alimenter la marketplace.
            </div>

            <div className="kafoo-listing-grid mt-6">
              {demoListings.map((item) => (
                <DemoListingCard key={item.id} listing={item} />
              ))}
            </div>
          </>
        ) : (
          <div className="kafoo-listing-grid mt-6">
            {recent.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        )}
      </section>

      <section className="kafoo-container py-10">
        <div className="grid gap-6 rounded-3xl bg-slate-950 p-6 text-white sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <h2 className="text-2xl font-black sm:text-3xl">
              Vous avez quelque chose à vendre ?
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Publiez gratuitement votre annonce avec photos, prix et
              localisation. Les acheteurs pourront vous contacter directement.
            </p>
          </div>

          <Button
            asChild
            size="lg"
            className="rounded-full bg-white text-slate-950 hover:bg-slate-100"
          >
            <Link to="/publier">
              <PlusCircle className="mr-2 h-5 w-5" />
              Publier maintenant
            </Link>
          </Button>
        </div>
      </section>

      <section className="kafoo-container pb-12">
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-black text-slate-950">
                Conseils sécurité
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Vérifiez toujours le produit avant paiement et privilégiez les
                lieux publics.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <SecurityTip text="Vérifier le produit" />
              <SecurityTip text="Éviter les paiements suspects" />
              <SecurityTip text="Rencontrer dans un lieu public" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">
          {title}
        </h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-xs font-bold text-slate-600">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
      >
        {children}
      </select>
    </label>
  );
}

function MiniStat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-center backdrop-blur">
      <div className="text-xl font-black text-white">{value}</div>
      <div className="mt-1 text-xs font-semibold text-slate-300">{label}</div>
    </div>
  );
}

function TrustItem({
  icon: Icon,
  title,
  description,
  color,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-2xl bg-slate-50 p-4">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${color}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-black text-slate-950">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function DemoListingCard({ listing }: { listing: DemoListing }) {
  return (
    <article className="min-w-0 overflow-hidden rounded-3xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <img
          src={listing.image}
          alt={listing.title}
          className="h-full w-full object-cover transition duration-300 hover:scale-105"
          loading="lazy"
        />
        {listing.badge ? (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-700 shadow">
            {listing.badge}
          </span>
        ) : null}
      </div>

      <div className="p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
          {listing.category}
        </p>
        <h3 className="mt-1 line-clamp-2 text-base font-black text-slate-950">
          {listing.title}
        </h3>
        <p className="mt-2 text-lg font-black text-slate-950">
          {listing.price}
        </p>

        <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
          <MapPin className="h-4 w-4 shrink-0" />
          <span className="truncate">{listing.location}</span>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            {listing.condition}
          </span>
          <Link
            to="/annonces"
            className="text-xs font-bold text-blue-600 hover:underline"
          >
            Voir
          </Link>
        </div>
      </div>
    </article>
  );
}

function SecurityTip({ text }: { text: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
      <span>{text}</span>
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mt-6 rounded-3xl border border-dashed bg-white p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <Box className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-black text-slate-950">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

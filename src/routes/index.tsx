import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowRight,
  Baby,
  Bike,
  BookOpen,
  Box,
  Briefcase,
  Car,
  CheckCircle2,
  Dog,
  Dumbbell,
  Gem,
  Heart,
  Home,
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
  Store,
  Tv,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { useSupabase } from "@/integrations/supabase/provider";
import { ListingCard, type ListingRow } from "@/components/ListingCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kafoo — Achetez et vendez près de chez vous" },
      {
        name: "description",
        content:
          "Kafoo Marketplace : petites annonces en Guinée pour acheter, vendre et échanger entre particuliers et professionnels.",
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

const iconMap: Record<string, LucideIcon> = {
  smartphone: Smartphone,
  laptop: Laptop,
  tv: Tv,
  car: Car,
  bike: Bike,
  home: Home,
  sofa: Home,
  refrigerator: Home,
  shirt: Shirt,
  footprints: Shirt,
  gem: Gem,
  baby: Baby,
  flower: Home,
  dumbbell: Dumbbell,
  briefcase: Briefcase,
  wrench: Wrench,
  "user-tie": Briefcase,
  dog: Dog,
  book: BookOpen,
  box: Box,
};

const categoryGradients = [
  "from-blue-50 via-cyan-50 to-white border-blue-100 text-blue-700",
  "from-emerald-50 via-teal-50 to-white border-emerald-100 text-emerald-700",
  "from-orange-50 via-amber-50 to-white border-orange-100 text-orange-700",
  "from-purple-50 via-fuchsia-50 to-white border-purple-100 text-purple-700",
  "from-rose-50 via-pink-50 to-white border-rose-100 text-rose-700",
  "from-indigo-50 via-violet-50 to-white border-indigo-100 text-indigo-700",
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
  const [distance, setDistance] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  useEffect(() => {
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

        supabase
          .from("regions")
          .select("id,name,slug")
          .eq("is_active", true)
          .order("name"),

        supabase
          .from("cities")
          .select("id,name,slug")
          .eq("is_active", true)
          .order("name"),

        supabase
          .from("communes")
          .select("id,name,slug")
          .eq("is_active", true)
          .order("name"),

        supabase
          .from("listings")
          .select(`
            id,slug,title,price,currency,condition,is_featured,is_sponsored,created_at,
            region:regions(name), city:cities(name), commune:communes(name),
            images:listing_images(image_url,is_main)
          `)
          .eq("status", "published")
          .order("is_sponsored", { ascending: false })
          .order("is_featured", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(24),
      ]);

      setCategories((cats ?? []) as Category[]);
      setRegions((regionRows ?? []) as LocationOption[]);
      setCities((cityRows ?? []) as LocationOption[]);
      setCommunes((communeRows ?? []) as LocationOption[]);
      setRecent((list ?? []) as unknown as ListingRow[]);
    })();
  }, [supabase]);

  const featuredListings = useMemo(
    () => recent.filter((item) => item.is_featured || item.is_sponsored).slice(0, 8),
    [recent],
  );

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
        distance: distance || undefined,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
      } as never,
    });
  };

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#f5f7fb]">
      {/* HERO */}
      <section className="relative isolate w-full overflow-hidden bg-[#07111f] text-white">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_18%,rgba(37,99,235,0.55),transparent_30%),radial-gradient(circle_at_88%_12%,rgba(192,38,211,0.42),transparent_30%),radial-gradient(circle_at_48%_96%,rgba(20,184,166,0.35),transparent_36%)]" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(115deg,rgba(2,6,23,0.60),rgba(15,23,42,0.20),rgba(76,29,149,0.38))]" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-28 bg-gradient-to-t from-[#f5f7fb] to-transparent" />

        <div className="mx-auto grid w-full max-w-[1600px] gap-8 px-4 pb-20 pt-10 sm:px-6 md:pt-14 lg:grid-cols-[minmax(0,1fr)_minmax(420px,560px)] lg:items-center lg:px-10 lg:pb-28 lg:pt-20 2xl:px-14">
          <div className="mx-auto w-full max-w-4xl text-center lg:mx-0 lg:text-left">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-white/90 shadow-lg backdrop-blur">
              <Sparkles className="h-4 w-4 text-yellow-300" />
              Nouvelle marketplace locale en Guinée
            </div>

            <h1 className="text-balance text-[2.35rem] font-black leading-[1.04] tracking-tight sm:text-5xl md:text-6xl xl:text-7xl">
              Achetez, vendez et trouvez les meilleures annonces près de chez vous
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base md:text-lg lg:mx-0">
              Publiez gratuitement vos annonces de téléphones, véhicules, immobilier,
              mode, électroménager et services. Kafoo connecte particuliers et professionnels
              partout en Guinée.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-full bg-white px-6 font-bold text-slate-950 shadow-xl hover:bg-slate-100"
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
                className="h-12 rounded-full border-white/30 bg-white/10 px-6 font-bold text-white backdrop-blur hover:bg-white/20 hover:text-white"
              >
                <Link to="/annonces">
                  Explorer les annonces
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>

            <div className="mx-auto mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4 lg:mx-0">
              <StatCard value={categories.length} label="Catégories" />
              <StatCard value={recent.length} label="Annonces" />
              <StatCard value="100%" label="Supabase" />
              <StatCard value="GN" label="Local" />
            </div>
          </div>

          <div className="mx-auto w-full max-w-xl rounded-[2rem] border border-white/15 bg-white/10 p-3 shadow-2xl backdrop-blur-xl sm:p-5 lg:mx-0">
            <div className="rounded-[1.5rem] bg-white p-4 text-slate-950 shadow-2xl sm:p-5">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-fuchsia-600 text-white shadow-lg">
                  <Search className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black">Recherche avancée</h2>
                  <p className="text-sm text-slate-500">
                    Catégorie, localisation, distance et budget.
                  </p>
                </div>
              </div>

              <form onSubmit={onSearch} className="space-y-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Téléphone, voiture, maison, ordinateur..."
                    className="h-12 rounded-xl border-slate-200 bg-slate-50 pl-10"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <SelectField value={category} onChange={setCategory} label="Catégorie">
                    <option value="">Toutes les catégories</option>
                    {categories.map((item) => (
                      <option key={item.id} value={item.slug}>
                        {item.name}
                      </option>
                    ))}
                  </SelectField>

                  <SelectField value={region} onChange={setRegion} label="Région">
                    <option value="">Toutes les régions</option>
                    {regions.map((item) => (
                      <option key={item.id} value={item.slug}>
                        {item.name}
                      </option>
                    ))}
                  </SelectField>

                  <SelectField value={city} onChange={setCity} label="Ville">
                    <option value="">Toutes les villes</option>
                    {cities.map((item) => (
                      <option key={item.id} value={item.slug}>
                        {item.name}
                      </option>
                    ))}
                  </SelectField>

                  <SelectField value={commune} onChange={setCommune} label="Commune">
                    <option value="">Toutes les communes</option>
                    {communes.map((item) => (
                      <option key={item.id} value={item.slug}>
                        {item.name}
                      </option>
                    ))}
                  </SelectField>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <SelectField value={distance} onChange={setDistance} label="Distance">
                    <option value="">Toute distance</option>
                    <option value="1">1 km</option>
                    <option value="5">5 km</option>
                    <option value="10">10 km</option>
                    <option value="20">20 km</option>
                    <option value="50">50 km</option>
                    <option value="100">100 km</option>
                  </SelectField>

                  <Input
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    type="number"
                    min="0"
                    placeholder="Prix min"
                    className="h-12 rounded-xl border-slate-200 bg-slate-50"
                  />

                  <Input
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    type="number"
                    min="0"
                    placeholder="Prix max"
                    className="h-12 rounded-xl border-slate-200 bg-slate-50"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="h-12 w-full rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-fuchsia-600 font-black text-white shadow-lg hover:opacity-95"
                >
                  <SlidersHorizontal className="mr-2 h-5 w-5" />
                  Rechercher maintenant
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="relative z-10 -mt-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-[1320px] gap-3 rounded-[2rem] border bg-white p-4 shadow-2xl sm:grid-cols-3">
          <TrustItem
            icon={Zap}
            title="Publication rapide"
            description="Créez une annonce avec photos, prix et localisation en quelques minutes."
            color="bg-orange-100 text-orange-700"
          />
          <TrustItem
            icon={MapPin}
            title="Recherche locale"
            description="Filtrez par région, ville, commune, quartier, distance et prix."
            color="bg-emerald-100 text-emerald-700"
          />
          <TrustItem
            icon={MessageCircle}
            title="Contact direct"
            description="Échangez avec les vendeurs par message, téléphone ou WhatsApp."
            color="bg-blue-100 text-blue-700"
          />
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="mx-auto w-full max-w-[1600px] px-4 py-14 sm:px-6 lg:px-10 2xl:px-14">
        <SectionHeader
          eyebrow="Explorer"
          title="Catégories populaires"
          description="Accédez rapidement aux rubriques les plus recherchées sur Kafoo."
          action={
            <Button asChild variant="outline" className="rounded-full bg-white">
              <Link to="/annonces">
                Toutes les annonces
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          }
        />

        {categories.length === 0 ? (
          <EmptyState
            title="Aucune catégorie disponible"
            description="Les catégories seront affichées dès qu’elles seront ajoutées dans Supabase."
          />
        ) : (
          <div className="mt-7 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4">
            {categories.map((item, index) => {
              const Icon = getCategoryIcon(item.icon);
              const gradient = categoryGradients[index % categoryGradients.length];

              return (
                <Link
                  key={item.id}
                  to="/annonces"
                  search={{ category: item.slug } as never}
                  className={`group min-h-[150px] rounded-[1.6rem] border bg-gradient-to-br p-4 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl ${gradient}`}
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm transition group-hover:scale-105">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="line-clamp-2 text-sm font-black leading-snug text-slate-950">
                    {item.name}
                  </h3>
                  <p className="mt-3 flex items-center text-xs font-semibold text-slate-500">
                    Voir les annonces
                    <ArrowRight className="ml-1 h-3 w-3 transition group-hover:translate-x-1" />
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* FEATURED */}
      {featuredListings.length > 0 && (
        <section className="bg-gradient-to-br from-amber-50 via-white to-orange-50 py-14">
          <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-10 2xl:px-14">
            <SectionHeader
              eyebrow="Sélection"
              title="Annonces à la une"
              description="Découvrez les annonces mises en avant par les vendeurs."
              action={
                <Link to="/annonces" className="text-sm font-bold text-orange-700 hover:underline">
                  Tout voir
                </Link>
              }
            />

            <div className="mt-7 grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-4">
              {featuredListings.map((item) => (
                <ListingCard key={item.id} listing={item} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* RECENT */}
      <section className="mx-auto w-full max-w-[1600px] px-4 py-14 sm:px-6 lg:px-10 2xl:px-14">
        <SectionHeader
          eyebrow="Nouveautés"
          title="Annonces récentes"
          description="Les dernières annonces publiées par les vendeurs particuliers et professionnels."
          action={
            <Button asChild variant="outline" className="rounded-full bg-white">
              <Link to="/annonces">
                Tout voir
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          }
        />

        {recent.length === 0 ? (
          <div className="mt-7 rounded-[2rem] border border-dashed bg-white p-8 text-center shadow-sm sm:p-12">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-100 to-fuchsia-100 text-blue-700">
              <PlusCircle className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-black text-slate-950">
              Aucune annonce publiée pour le moment
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Soyez le premier à publier une annonce gratuitement et à donner de la visibilité à vos produits.
            </p>
            <Button asChild className="mt-5 rounded-full">
              <Link to="/publier">Publier une annonce</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-7 grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-4">
            {recent.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        )}
      </section>

      {/* STEPS */}
      <section className="bg-white py-14">
        <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-10 2xl:px-14">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-black uppercase tracking-wide text-fuchsia-600">
              Simple et rapide
            </p>
            <h2 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">
              Vendez en quelques minutes
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Kafoo facilite la mise en relation entre acheteurs et vendeurs partout en Guinée.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <StepCard
              number="01"
              title="Créez votre compte"
              description="Inscrivez-vous gratuitement comme particulier ou professionnel."
              color="from-blue-600 to-cyan-500"
            />
            <StepCard
              number="02"
              title="Publiez votre annonce"
              description="Ajoutez vos photos, votre prix, votre catégorie et votre localisation."
              color="from-emerald-600 to-teal-500"
            />
            <StepCard
              number="03"
              title="Échangez et vendez"
              description="Recevez des messages, appels ou contacts WhatsApp des acheteurs intéressés."
              color="from-fuchsia-600 to-pink-500"
            />
          </div>
        </div>
      </section>

      {/* WHY KAFOO */}
      <section className="bg-slate-950 py-14 text-white">
        <div className="mx-auto grid w-full max-w-[1600px] gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-10 2xl:px-14">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-cyan-300">
              Pourquoi Kafoo ?
            </p>
            <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
              Une marketplace locale pensée pour vendre plus simplement
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Publiez, recherchez et échangez facilement grâce à une plateforme moderne,
              connectée à Supabase, avec catégories, localisations, favoris et messagerie.
            </p>

            <Button asChild className="mt-6 rounded-full bg-white text-slate-950 hover:bg-slate-100">
              <Link to="/publier">
                Commencer maintenant
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FeatureCard
              icon={ShieldCheck}
              title="Plus rassurant"
              description="Signalements, modération et conseils sécurité pour limiter les abus."
            />
            <FeatureCard
              icon={MapPin}
              title="Recherche locale"
              description="Filtrez par région, ville, commune, quartier, prix et distance."
            />
            <FeatureCard
              icon={Store}
              title="Particuliers et pros"
              description="Chaque vendeur peut publier ses produits et gérer ses annonces."
            />
            <FeatureCard
              icon={Heart}
              title="Favoris et suivi"
              description="Sauvegardez les annonces intéressantes pour les retrouver rapidement."
            />
          </div>
        </div>
      </section>

      {/* SECURITY */}
      <section className="mx-auto w-full max-w-[1600px] px-4 py-14 sm:px-6 lg:px-10 2xl:px-14">
        <div className="overflow-hidden rounded-[2rem] border bg-gradient-to-br from-white via-blue-50 to-emerald-50 p-6 shadow-sm sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-black text-slate-950">
                Conseils pour acheter et vendre en sécurité
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Kafoo facilite les échanges, mais restez toujours prudent lors des transactions.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <SecurityTip text="Vérifiez toujours le produit avant de payer." />
              <SecurityTip text="Privilégiez les rencontres dans des lieux publics." />
              <SecurityTip text="Méfiez-vous des prix anormalement bas." />
              <SecurityTip text="Ne partagez jamais vos informations sensibles." />
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
        <p className="text-sm font-black uppercase tracking-wide text-blue-600">
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
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-slate-600">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
      >
        {children}
      </select>
    </label>
  );
}

function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-3 text-center shadow-lg backdrop-blur">
      <div className="text-xl font-black text-white">{value}</div>
      <div className="mt-1 text-[11px] font-semibold text-slate-300">{label}</div>
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
    <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h3 className="text-sm font-black text-slate-950">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
  color,
}: {
  number: string;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <div className="rounded-[2rem] border bg-slate-50 p-6 transition hover:-translate-y-1 hover:shadow-xl">
      <div
        className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${color} text-lg font-black text-white shadow-lg`}
      >
        {number}
      </div>
      <h3 className="text-lg font-black text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 backdrop-blur transition hover:bg-white/15">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-950">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="font-black text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
    </div>
  );
}

function SecurityTip({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-white/80 p-4 shadow-sm">
      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
      <p className="text-sm font-semibold leading-6 text-slate-700">{text}</p>
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
    <div className="rounded-[2rem] border border-dashed bg-white p-8 text-center shadow-sm">
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

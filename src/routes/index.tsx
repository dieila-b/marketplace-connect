import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowRight,
  Baby,
  Bike,
  BookOpen,
  Box,
  Briefcase,
  Camera,
  Car,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Dog,
  Dumbbell,
  Gem,
  HelpCircle,
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
  Tag,
  Tv,
  Users,
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
  "bg-white hover:border-blue-300 hover:bg-blue-50/50",
  "bg-white hover:border-emerald-300 hover:bg-emerald-50/50",
  "bg-white hover:border-orange-300 hover:bg-orange-50/50",
  "bg-white hover:border-violet-300 hover:bg-violet-50/50",
  "bg-white hover:border-rose-300 hover:bg-rose-50/50",
  "bg-white hover:border-cyan-300 hover:bg-cyan-50/50",
];
const categoryIconStyles = [
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-orange-100 text-orange-700",
  "bg-violet-100 text-violet-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
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
  const [showHowItWorks, setShowHowItWorks] = useState(false);
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
      {/* HERO */}
      <section className="relative w-full overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white">
        {/* subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(59,130,246,0.35),transparent_38%),radial-gradient(circle_at_85%_20%,rgba(168,85,247,0.30),transparent_38%),radial-gradient(circle_at_50%_120%,rgba(16,185,129,0.28),transparent_42%)]" />
        <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center justify-center px-4 py-6 text-center sm:px-6 sm:py-8 lg:py-10">
          <h1 className="mx-auto text-center text-base font-black leading-tight tracking-tight text-white sm:text-lg md:whitespace-nowrap md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl">
            Vendez et trouvez vos bonnes affaires près de chez vous
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-6 text-slate-300 sm:text-base">
            Publiez gratuitement et échangez directement avec les acheteurs partout en Guinée.
          </p>
          {/* Search bar */}
          <div className="mt-6 w-full max-w-4xl">
            <form
              onSubmit={onSearch}
              className="rounded-3xl border border-white/20 bg-white/95 p-2 shadow-2xl shadow-black/30 backdrop-blur sm:p-2.5"
            >
              <div className="flex flex-col gap-2 lg:flex-row">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Que recherchez-vous ? iPhone, Toyota, appartement…"
                    className="h-12 w-full rounded-2xl border-transparent bg-transparent pl-12 text-sm text-slate-900 shadow-none focus-visible:ring-0 sm:h-14 sm:text-base"
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="h-12 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 font-bold text-white shadow-lg shadow-blue-600/30 transition hover:from-blue-700 hover:to-indigo-700 sm:h-14 lg:w-auto"
                >
                  <Search className="mr-2 h-5 w-5" />
                  Rechercher
                </Button>
                <Button
                  type="button"
                  size="lg"
                  variant="ghost"
                  onClick={() => setShowAdvancedSearch((c) => !c)}
                  className="h-12 w-full rounded-2xl px-5 font-semibold text-slate-700 hover:bg-slate-100 sm:h-14 lg:w-auto"
                >
                  <SlidersHorizontal className="mr-2 h-5 w-5" />
                  {showAdvancedSearch ? "Fermer" : "Filtres"}
                </Button>
              </div>
              {showAdvancedSearch ? (
                <div className="mt-2 border-t border-slate-100 p-2 pt-4 sm:p-3">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <SelectField value={category} onChange={setCategory} label="Catégorie">
                      <option value="">Toutes</option>
                      {categories.map((item) => (
                        <option key={item.id} value={item.slug}>{item.name}</option>
                      ))}
                    </SelectField>
                    <SelectField value={region} onChange={setRegion} label="Région">
                      <option value="">Toutes</option>
                      {regions.map((item) => (
                        <option key={item.id} value={item.slug}>{item.name}</option>
                      ))}
                    </SelectField>
                    <SelectField value={city} onChange={setCity} label="Ville">
                      <option value="">Toutes</option>
                      {cities.map((item) => (
                        <option key={item.id} value={item.slug}>{item.name}</option>
                      ))}
                    </SelectField>
                    <SelectField value={commune} onChange={setCommune} label="Commune">
                      <option value="">Toutes</option>
                      {communes.map((item) => (
                        <option key={item.id} value={item.slug}>{item.name}</option>
                      ))}
                    </SelectField>
                    <Input
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      type="number"
                      min="0"
                      placeholder="Prix min (GNF)"
                      className="h-12 rounded-xl bg-slate-50"
                    />
                    <Input
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      type="number"
                      min="0"
                      placeholder="Prix max (GNF)"
                      className="h-12 rounded-xl bg-slate-50"
                    />
                  </div>
                </div>
              ) : null}
            </form>
          </div>
          {/* CTA buttons */}
          <div className="mt-6 flex w-full max-w-md flex-col items-center justify-center gap-3 sm:max-w-none sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-12 w-full rounded-full bg-white px-7 font-bold text-slate-950 shadow-xl shadow-black/20 hover:bg-slate-100 sm:w-auto"
            >
              <Link to="/publier">
                <PlusCircle className="mr-2 h-5 w-5" />
                Publier une annonce
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 w-full rounded-full border-white/30 bg-transparent px-7 font-bold text-white hover:bg-white/10 hover:text-white sm:w-auto"
            >
              <Link to="/annonces">
                Explorer les annonces
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
        {/* Stats bar */}
        <div className="relative border-t border-white/10 bg-black/20 backdrop-blur">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 px-4 py-3 sm:grid-cols-4 sm:px-6 sm:py-4">
            <Stat icon={Tag} label="Annonces publiées" value="1 200+" />
            <Stat icon={Users} label="Vendeurs actifs" value="850+" />
            <Stat icon={MapPin} label="Villes couvertes" value="12" />
            <Stat icon={Zap} label="Publication" value="Gratuite" />
          </div>
        </div>
      </section>
      {/* TRUST / VALUE PROPS */}
      <section className="kafoo-container py-5 sm:py-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <TrustItem
            icon={Camera}
            title="Publier en 2 minutes"
            description="Photos, prix, description : votre annonce est en ligne instantanément."
            gradient="from-blue-500 to-indigo-600"
          />
          <TrustItem
            icon={MapPin}
            title="100% local"
            description="Filtrez par région, ville ou commune pour trouver des vendeurs près de vous."
            gradient="from-emerald-500 to-teal-600"
          />
          <TrustItem
            icon={ShieldCheck}
            title="Échanges sécurisés"
            description="Discutez, négociez et rencontrez-vous en toute confiance."
            gradient="from-orange-500 to-rose-600"
          />
        </div>
      </section>
      {/* CATEGORIES */}
      <section className="kafoo-container py-8 sm:py-10">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
              Explorer
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Catégories populaires
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Parcourez toutes les catégories pour trouver ce que vous cherchez.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto md:justify-end">
            {hasMoreCategories && (
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-full bg-white sm:w-auto"
                onClick={() => setShowAllCategories((c) => !c)}
              >
                {showAllCategories ? "Voir moins" : "Voir plus"}
                {showAllCategories ? (
                  <ChevronUp className="ml-2 h-4 w-4" />
                ) : (
                  <ChevronDown className="ml-2 h-4 w-4" />
                )}
              </Button>
            )}
            <Button
              asChild
              variant="outline"
              className="w-full rounded-full bg-white sm:w-auto"
            >
              <Link to="/annonces">
                Tout voir
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
        {categories.length === 0 ? (
          <EmptyCategoriesState />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {displayedCategories.map((item, index) => {
              const Icon = getCategoryIcon(item.icon);
              const cardStyle = categoryStyles[index % categoryStyles.length];
              const iconStyle = categoryIconStyles[index % categoryIconStyles.length];
              return (
                <Link
                  key={item.id}
                  to="/annonces"
                  search={{ category: item.slug } as never}
                  className={`group flex min-h-[140px] min-w-0 flex-col rounded-2xl border border-slate-200 p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${cardStyle}`}
                >
                  <div className={`mb-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${iconStyle}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="line-clamp-2 min-h-[36px] break-words text-sm font-bold leading-tight text-slate-950">
                    {item.name}
                  </h3>
                  <p className="mt-auto flex items-center pt-3 text-xs font-semibold text-slate-500 group-hover:text-blue-600">
                    Explorer
                    <ArrowRight className="ml-1 h-3 w-3 transition group-hover:translate-x-1" />
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </section>
      {/* RECENT LISTINGS */}
      <section className="kafoo-container py-8 sm:py-10">
        <SectionHeader
          eyebrow={recent.length === 0 ? "Aperçu" : "Nouveautés"}
          title={recent.length === 0 ? "Exemples d'annonces" : "Annonces récentes"}
          description={
            recent.length === 0
              ? "Voici quelques exemples pour présenter le style des annonces. Elles seront remplacées par les vraies annonces publiées."
              : "Les dernières annonces publiées par les vendeurs."
          }
          action={
            <Button
              asChild
              variant="outline"
              className="w-full rounded-full bg-white sm:w-auto"
            >
              <Link to="/annonces">
                Voir toutes les annonces
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          }
        />
        {recent.length === 0 ? (
          <>
            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
              <p>
                Ces annonces sont des exemples d'affichage. Publiez une vraie annonce pour commencer à alimenter la marketplace.
              </p>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {demoListings.map((item) => (
                <DemoListingCard key={item.id} listing={item} />
              ))}
            </div>
          </>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recent.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        )}
      </section>
      {/* SELL CTA */}
      <section className="kafoo-container py-10 sm:py-12">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-6 shadow-xl sm:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_50%,rgba(59,130,246,0.3),transparent_50%),radial-gradient(circle_at_90%_50%,rgba(168,85,247,0.25),transparent_50%)]" />
          <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="min-w-0 text-white">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
                100% Gratuit
              </span>
              <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">
                Vous avez quelque chose à vendre ?
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Publiez votre annonce en quelques minutes et touchez des milliers d'acheteurs partout en Guinée. Sans commission, sans frais cachés.
              </p>
            </div>
            <Button
              asChild
              size="lg"
              className="h-14 w-full rounded-full bg-white px-8 font-bold text-slate-950 shadow-xl hover:bg-slate-100 sm:w-auto"
            >
              <Link to="/publier">
                <PlusCircle className="mr-2 h-5 w-5" />
                Publier maintenant
              </Link>
            </Button>
          </div>
        </div>
      </section>
      {/* HOW IT WORKS (collapsible) */}
      <section className="kafoo-container py-6">
        <button
          type="button"
          onClick={() => setShowHowItWorks((c) => !c)}
          className="flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md"
          aria-expanded={showHowItWorks}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-black text-slate-950">Comment ça marche ?</h3>
              <p className="text-xs text-slate-500">Vendez ou achetez en 3 étapes simples</p>
            </div>
          </div>
          {showHowItWorks ? (
            <ChevronUp className="h-5 w-5 shrink-0 text-slate-400" />
          ) : (
            <ChevronDown className="h-5 w-5 shrink-0 text-slate-400" />
          )}
        </button>
        {showHowItWorks ? (
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Step
              number="1"
              icon={Camera}
              title="Publiez votre annonce"
              description="Ajoutez photos, titre, prix et description. C'est gratuit et ça prend 2 minutes."
            />
            <Step
              number="2"
              icon={MessageCircle}
              title="Recevez des messages"
              description="Les acheteurs vous contactent directement par chat, téléphone ou WhatsApp."
            />
            <Step
              number="3"
              icon={CheckCircle2}
              title="Finalisez la vente"
              description="Convenez d'un rendez-vous dans un lieu public et concluez en toute sécurité."
            />
          </div>
        ) : null}
      </section>
      {/* SECURITY TIPS */}
      <section className="kafoo-container pb-14">
        <div className="rounded-3xl border bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
                  Achetez en toute sécurité
                </h2>
                <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">
                  Suivez ces conseils simples pour une transaction sereine.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[520px]">
              <SecurityTip text="Vérifier le produit" />
              <SecurityTip text="Éviter les paiements suspects" />
              <SecurityTip text="Rencontrer en lieu public" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-black leading-tight text-white sm:text-xl">
          {value}
        </p>
        <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
          {label}
        </p>
      </div>
    </div>
  );
}
function Step({
  number,
  icon: Icon,
  title,
  description,
}: {
  number: string;
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="group relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="absolute -top-3 left-6 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-black text-white shadow-md">
        {number}
      </div>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 transition group-hover:bg-blue-100">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-base font-black text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
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
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
          {title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>
      {action ? <div className="w-full shrink-0 sm:w-auto">{action}</div> : null}
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
function TrustItem({
  icon: Icon,
  title,
  description,
  gradient,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className={`absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br ${gradient} opacity-10 transition group-hover:opacity-20`} />
      <div className="relative flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-md`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-black text-slate-950">{title}</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
        </div>
      </div>
    </div>
  );
}
function DemoListingCard({ listing }: { listing: DemoListing }) {
  return (
    <article className="group min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <img
          src={listing.image}
          alt={listing.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
          loading="lazy"
        />
        {listing.badge ? (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-slate-700 shadow-md backdrop-blur">
            {listing.badge}
          </span>
        ) : null}
        <span className="absolute right-3 top-3 rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-md">
          {listing.condition}
        </span>
      </div>
      <div className="p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
          {listing.category}
        </p>
        <h3 className="mt-1 line-clamp-2 min-h-[48px] text-base font-black leading-tight text-slate-950">
          {listing.title}
        </h3>
        <p className="mt-2 text-xl font-black text-slate-950">
          {listing.price}
        </p>
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-sm text-slate-500">
          <div className="flex min-w-0 items-center gap-1.5">
            <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="truncate">{listing.location}</span>
          </div>
          <Link
            to="/annonces"
            className="shrink-0 text-xs font-bold text-blue-600 hover:underline"
          >
            Voir →
          </Link>
        </div>
      </div>
    </article>
  );
}
function SecurityTip({ text }: { text: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
      <span>{text}</span>
    </div>
  );
}
function EmptyCategoriesState() {
  return (
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="flex min-h-[140px] animate-pulse flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="mb-3 h-11 w-11 rounded-xl bg-slate-100" />
          <div className="h-3 w-3/4 rounded-full bg-slate-100" />
          <div className="mt-2 h-3 w-1/2 rounded-full bg-slate-100" />
          <div className="mt-auto h-3 w-16 rounded-full bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ArrowRight,
  Box,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MapPin,
  MessageCircle,
  PlusCircle,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { useSupabase } from "@/integrations/supabase/provider";
import { ListingCard, type ListingRow } from "@/components/ListingCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_HOMEPAGE_CMS,
  loadPublicHomeCms,
  type CmsBanner,
  type CmsHomepage,
  type CmsSection,
} from "@/integrations/cms/public-cms";

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

const categoryStyles = [
  "bg-blue-50 text-blue-700 border-blue-100",
  "bg-emerald-50 text-emerald-700 border-emerald-100",
  "bg-orange-50 text-orange-700 border-orange-100",
  "bg-violet-50 text-violet-700 border-violet-100",
  "bg-rose-50 text-rose-700 border-rose-100",
  "bg-cyan-50 text-cyan-700 border-cyan-100",
];

function HomePage() {
  const { supabase } = useSupabase();
  const navigate = useNavigate();

  const [cms, setCms] = useState<CmsHomepage>(DEFAULT_HOMEPAGE_CMS);
  const [banners, setBanners] = useState<CmsBanner[]>([]);
  const [cmsSections, setCmsSections] = useState<CmsSection[]>([]);
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

    let cancelled = false;

    void (async () => {
      const [cmsBundle, cats, regionRows, cityRows, communeRows, list] =
        await Promise.all([
          loadPublicHomeCms(supabase),
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
            .select(
              `
              id,slug,title,price,currency,condition,is_featured,is_sponsored,created_at,
              region:regions(name), city:cities(name), commune:communes(name),
              images:listing_images(image_url,is_main)
            `,
            )
            .in("status", ["active", "published"])
            .order("is_sponsored", { ascending: false })
            .order("is_featured", { ascending: false })
            .order("created_at", { ascending: false })
            .limit(12),
        ]);

      if (cancelled) return;

      setCms(cmsBundle.homepage);
      setBanners(cmsBundle.banners);
      setCmsSections(cmsBundle.sections);
      setCategories((cats.data ?? []) as Category[]);
      setRegions((regionRows.data ?? []) as LocationOption[]);
      setCities((cityRows.data ?? []) as LocationOption[]);
      setCommunes((communeRows.data ?? []) as LocationOption[]);
      setRecent((list.data ?? []) as unknown as ListingRow[]);
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  useEffect(() => {
    document.title = cms.seo_title || DEFAULT_HOMEPAGE_CMS.seo_title;

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute(
      "content",
      cms.seo_description || DEFAULT_HOMEPAGE_CMS.seo_description,
    );
  }, [cms.seo_title, cms.seo_description]);

  const displayedCategories = showAllCategories
    ? categories
    : categories.slice(0, 10);
  const hasMoreCategories = categories.length > 10;

  const stats = useMemo(() => {
    if (Array.isArray(cms.statistics) && cms.statistics.length) {
      return cms.statistics.slice(0, 4);
    }

    return [
      { label: "Catégories", value: String(categories.length) },
      { label: "Annonces", value: String(recent.length) },
      { label: "Local", value: "GN" },
    ];
  }, [cms.statistics, categories.length, recent.length]);

  const onSearch = (event: FormEvent) => {
    event.preventDefault();
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

  const heroStyle = cms.hero_background_url
    ? {
        backgroundImage: `linear-gradient(rgba(2,6,23,.78), rgba(2,6,23,.88)), url(${cms.hero_background_url})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : undefined;

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-slate-50">
      <section
        className="relative w-full overflow-hidden bg-slate-950 text-white"
        style={heroStyle}
      >
        {!cms.hero_background_url && (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(37,99,235,0.50),transparent_34%),radial-gradient(circle_at_82%_10%,rgba(168,85,247,0.44),transparent_34%),radial-gradient(circle_at_50%_100%,rgba(20,184,166,0.34),transparent_38%)]" />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/5 via-transparent to-slate-950/25" />
          </>
        )}

        <div className="relative mx-auto flex min-h-[620px] w-full max-w-[1800px] flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8 xl:px-10">
          {cms.hero_badge && (
            <div className="mb-6 inline-flex max-w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold text-white/90 shadow-lg shadow-black/10 backdrop-blur">
              <Sparkles className="h-4 w-4 shrink-0 text-yellow-300" />
              <span className="truncate">{cms.hero_badge}</span>
            </div>
          )}

          <h1 className="mx-auto max-w-[1720px] text-center text-[2.15rem] font-black leading-[1.04] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-[4rem] xl:whitespace-nowrap xl:text-[clamp(3.25rem,3.35vw,4.25rem)] 2xl:text-[clamp(3.5rem,3.55vw,4.65rem)]">
            {cms.hero_title}
          </h1>

          <p className="mx-auto mt-6 max-w-[1500px] text-center text-sm font-medium leading-7 text-slate-100 sm:text-base lg:text-lg xl:text-[1.05rem]">
            {[cms.hero_description, cms.hero_subtitle]
              .filter(Boolean)
              .join(" ")}
          </p>

          <div className="mt-8 flex w-full max-w-md flex-col items-center justify-center gap-3 sm:max-w-none sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-12 w-full rounded-full bg-white px-7 font-black text-slate-950 shadow-xl shadow-black/10 hover:bg-slate-100 sm:w-auto"
            >
              <a href={cms.hero_primary_url || "/publier"}>
                <PlusCircle className="mr-2 h-5 w-5" />
                {cms.hero_primary_label}
              </a>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 w-full rounded-full border-white/25 bg-white/10 px-7 font-black text-white shadow-xl shadow-black/10 backdrop-blur hover:bg-white/20 hover:text-white sm:w-auto"
            >
              <a href={cms.hero_secondary_url || "/annonces"}>
                {cms.hero_secondary_label}
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </div>

          <div className="mt-10 grid w-full max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <MiniStat
                key={`${stat.label}-${stat.value}`}
                value={stat.value}
                label={stat.label}
              />
            ))}
          </div>

          <div className="mt-12 w-full max-w-6xl">
            <form
              onSubmit={onSearch}
              className="rounded-[2rem] border border-white/20 bg-white/95 p-3 text-slate-950 shadow-2xl shadow-black/20 backdrop-blur sm:p-4"
            >
              <div className="flex flex-col gap-3 lg:flex-row">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={q}
                    onChange={(event) => setQ(event.target.value)}
                    placeholder={cms.search_placeholder}
                    className="h-12 w-full rounded-2xl border-slate-200 bg-slate-50 pl-12 text-sm shadow-inner sm:h-14"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="h-12 w-full rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-fuchsia-600 px-8 font-black text-white shadow-lg shadow-blue-600/20 sm:h-14 lg:w-auto"
                >
                  <Search className="mr-2 h-5 w-5" />
                  Rechercher
                </Button>

                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  onClick={() => setShowAdvancedSearch((current) => !current)}
                  className="h-12 w-full rounded-2xl border-slate-200 bg-slate-50 px-6 font-black text-slate-700 shadow-sm hover:bg-slate-100 sm:h-14 lg:w-auto"
                >
                  <SlidersHorizontal className="mr-2 h-5 w-5" />
                  {showAdvancedSearch ? "Fermer" : "Filtres"}
                </Button>
              </div>

              {showAdvancedSearch && (
                <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-3">
                  <SelectField
                    label="Catégorie"
                    value={category}
                    onChange={setCategory}
                    rows={categories}
                  />
                  <SelectField
                    label="Région"
                    value={region}
                    onChange={setRegion}
                    rows={regions}
                  />
                  <SelectField
                    label="Ville"
                    value={city}
                    onChange={setCity}
                    rows={cities}
                  />
                  <SelectField
                    label="Commune"
                    value={commune}
                    onChange={setCommune}
                    rows={communes}
                  />
                  <Input
                    value={minPrice}
                    onChange={(event) => setMinPrice(event.target.value)}
                    type="number"
                    placeholder="Prix minimum"
                    className="h-12 rounded-xl bg-slate-50"
                  />
                  <Input
                    value={maxPrice}
                    onChange={(event) => setMaxPrice(event.target.value)}
                    type="number"
                    placeholder="Prix maximum"
                    className="h-12 rounded-xl bg-slate-50"
                  />
                </div>
              )}
            </form>
          </div>
        </div>
      </section>

      {banners.length > 0 && (
        <section className="kafoo-container py-7">
          <div className="grid gap-4 lg:grid-cols-2">
            {banners.map((banner) => (
              <a
                key={banner.id}
                href={banner.cta_url || "#"}
                className="group relative min-h-[220px] overflow-hidden rounded-3xl bg-slate-900 text-white shadow-lg"
              >
                {banner.image_url && (
                  <img
                    src={banner.image_url}
                    alt={banner.title}
                    className="absolute inset-0 h-full w-full object-cover opacity-55 transition group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/65 to-transparent" />
                <div className="relative max-w-lg p-7">
                  <h2 className="text-2xl font-black">{banner.title}</h2>
                  {banner.subtitle && (
                    <p className="mt-2 text-sm leading-6 text-slate-200">
                      {banner.subtitle}
                    </p>
                  )}
                  {banner.cta_label && (
                    <span className="mt-5 inline-flex items-center font-bold text-white">
                      {banner.cta_label}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </span>
                  )}
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

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
        <SectionHeader
          eyebrow="Explorer"
          title={cms.featured_categories_title}
          description="Choisissez une rubrique pour trouver rapidement une annonce."
          action={
            <div className="flex gap-2">
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
              <Button
                asChild
                variant="outline"
                className="rounded-full bg-white"
              >
                <Link to="/annonces">
                  Tout voir
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          }
        />

        {categories.length === 0 ? (
          <EmptyState
            title="Aucune catégorie disponible"
            description="Les catégories seront affichées dès leur activation dans Supabase."
          />
        ) : (
          <div className="kafoo-category-grid mt-6">
            {displayedCategories.map((item, index) => (
              <Link
                key={item.id}
                to="/annonces"
                search={{ category: item.slug } as never}
                className={`group flex min-h-[132px] min-w-0 flex-col rounded-2xl border p-4 transition hover:-translate-y-1 hover:shadow-lg ${categoryStyles[index % categoryStyles.length]}`}
              >
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm">
                  <Box className="h-5 w-5" />
                </div>
                <h3 className="line-clamp-2 min-h-[36px] text-sm font-black leading-tight text-slate-950">
                  {item.name}
                </h3>
                <p className="mt-auto flex items-center pt-3 text-xs font-semibold text-slate-500">
                  Voir
                  <ArrowRight className="ml-1 h-3 w-3" />
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="kafoo-container py-10">
        <SectionHeader
          eyebrow="Nouveautés"
          title={cms.featured_listings_title}
          description="Les dernières annonces publiées par les vendeurs."
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
          <EmptyState
            title="Aucune annonce publiée"
            description="Les annonces actives apparaîtront automatiquement ici."
          />
        ) : (
          <div className="kafoo-listing-grid mt-6">
            {recent.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        )}
      </section>

      {cmsSections.map((section) => (
        <section key={section.id} className="kafoo-container py-8">
          <div className="grid gap-6 rounded-3xl border bg-white p-6 shadow-sm lg:grid-cols-2 lg:items-center">
            <div>
              {section.subtitle && (
                <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
                  {section.subtitle}
                </p>
              )}
              {section.title && (
                <h2 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">
                  {section.title}
                </h2>
              )}
              {section.body && (
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">
                  {section.body}
                </p>
              )}
              {section.cta_label && section.cta_url && (
                <Button asChild className="mt-5 rounded-full bg-blue-600">
                  <a href={section.cta_url}>
                    {section.cta_label}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
            {section.image_url && (
              <img
                src={section.image_url}
                alt={section.title || "Kafoo"}
                className="h-full max-h-[360px] w-full rounded-2xl object-cover"
              />
            )}
          </div>
        </section>
      ))}

      <section className="kafoo-container py-10">
        <div className="grid gap-6 rounded-3xl bg-slate-950 p-6 text-white sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <h2 className="text-2xl font-black sm:text-3xl">
              Vous avez quelque chose à vendre ?
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Publiez gratuitement votre annonce et contactez directement les
              acheteurs.
            </p>
          </div>
          <Button
            asChild
            size="lg"
            className="rounded-full bg-white text-slate-950 hover:bg-slate-100"
          >
            <a href={cms.hero_primary_url || "/publier"}>
              <PlusCircle className="mr-2 h-5 w-5" />
              {cms.hero_primary_label}
            </a>
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

function SelectField({
  label,
  value,
  onChange,
  rows,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows: Array<{ id: string; name: string; slug: string }>;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-xs font-bold text-slate-600">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900"
      >
        <option value="">Tous</option>
        {rows.map((row) => (
          <option key={row.id} value={row.slug}>
            {row.name}
          </option>
        ))}
      </select>
    </label>
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
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

function MiniStat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-3xl border border-white/15 bg-white/10 p-5 text-center shadow-xl shadow-black/10 backdrop-blur">
      <div className="text-2xl font-black text-white">{value}</div>
      <div className="mt-1 text-xs font-bold text-slate-300">{label}</div>
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
      <div>
        <h3 className="text-sm font-black text-slate-950">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      </div>
    </div>
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


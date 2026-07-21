import type { SupabaseClient } from "@supabase/supabase-js";

export type CmsStatistic = {
  label: string;
  value: string;
};

export type CmsHomepage = {
  id?: string;
  locale: string;
  hero_badge: string;
  hero_title: string;
  hero_subtitle: string;
  hero_description: string;
  hero_background_url: string;
  hero_primary_label: string;
  hero_primary_url: string;
  hero_secondary_label: string;
  hero_secondary_url: string;
  search_placeholder: string;
  featured_categories_title: string;
  featured_listings_title: string;
  statistics: CmsStatistic[];
  options: Record<string, unknown>;
  seo_title: string;
  seo_description: string;
  og_image_url: string;
  status: string;
};

export type CmsBanner = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  mobile_image_url: string | null;
  cta_label: string | null;
  cta_url: string | null;
  placement: string;
};

export type CmsSection = {
  id: string;
  page_key: string;
  section_key: string;
  section_type: string;
  title: string | null;
  subtitle: string | null;
  body: string | null;
  image_url: string | null;
  cta_label: string | null;
  cta_url: string | null;
  content: Record<string, unknown>;
  sort_order: number;
};

export type PublicSiteSettings = Record<string, unknown>;

export type PublicHomeCmsBundle = {
  homepage: CmsHomepage;
  banners: CmsBanner[];
  sections: CmsSection[];
  settings: PublicSiteSettings;
};

export const DEFAULT_HOMEPAGE_CMS: CmsHomepage = {
  locale: "fr",
  hero_badge: "Nouvelle marketplace locale en Guinée",
  hero_title: "Vendez et trouvez vos bonnes affaires près de chez vous",
  hero_subtitle:
    "Publiez gratuitement et échangez directement avec les acheteurs partout en Guinée.",
  hero_description:
    "Téléphones, véhicules, immobilier, meubles, mode, électroménager et services.",
  hero_background_url: "",
  hero_primary_label: "Publier gratuitement",
  hero_primary_url: "/publier",
  hero_secondary_label: "Explorer",
  hero_secondary_url: "/annonces",
  search_placeholder: "Que recherchez-vous ?",
  featured_categories_title: "Catégories populaires",
  featured_listings_title: "Annonces récentes",
  statistics: [
    { label: "Annonces publiées", value: "1 200+" },
    { label: "Vendeurs actifs", value: "850+" },
    { label: "Villes couvertes", value: "12" },
  ],
  options: {},
  seo_title: "Kafoo — Petites annonces en Guinée",
  seo_description:
    "Kafoo Marketplace : achetez, vendez et publiez vos annonces en Guinée.",
  og_image_url: "",
  status: "published",
};

function safeObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function safeStatistics(value: unknown): CmsStatistic[] {
  if (!Array.isArray(value)) return DEFAULT_HOMEPAGE_CMS.statistics;

  const rows = value
    .map((item) => {
      const obj = safeObject(item);
      return {
        label: String(obj.label ?? ""),
        value: String(obj.value ?? ""),
      };
    })
    .filter((item) => item.label && item.value);

  return rows.length ? rows : DEFAULT_HOMEPAGE_CMS.statistics;
}

export function normalizeHomepageCms(row: any): CmsHomepage {
  if (!row) return DEFAULT_HOMEPAGE_CMS;

  return {
    id: row.id,
    locale: row.locale || "fr",
    hero_badge: row.hero_badge || DEFAULT_HOMEPAGE_CMS.hero_badge,
    hero_title: row.hero_title || DEFAULT_HOMEPAGE_CMS.hero_title,
    hero_subtitle: row.hero_subtitle || DEFAULT_HOMEPAGE_CMS.hero_subtitle,
    hero_description:
      row.hero_description || DEFAULT_HOMEPAGE_CMS.hero_description,
    hero_background_url: row.hero_background_url || "",
    hero_primary_label:
      row.hero_primary_label || DEFAULT_HOMEPAGE_CMS.hero_primary_label,
    hero_primary_url:
      row.hero_primary_url || DEFAULT_HOMEPAGE_CMS.hero_primary_url,
    hero_secondary_label:
      row.hero_secondary_label || DEFAULT_HOMEPAGE_CMS.hero_secondary_label,
    hero_secondary_url:
      row.hero_secondary_url || DEFAULT_HOMEPAGE_CMS.hero_secondary_url,
    search_placeholder:
      row.search_placeholder || DEFAULT_HOMEPAGE_CMS.search_placeholder,
    featured_categories_title:
      row.featured_categories_title ||
      DEFAULT_HOMEPAGE_CMS.featured_categories_title,
    featured_listings_title:
      row.featured_listings_title ||
      DEFAULT_HOMEPAGE_CMS.featured_listings_title,
    statistics: safeStatistics(row.statistics),
    options: safeObject(row.options),
    seo_title: row.seo_title || DEFAULT_HOMEPAGE_CMS.seo_title,
    seo_description:
      row.seo_description || DEFAULT_HOMEPAGE_CMS.seo_description,
    og_image_url: row.og_image_url || "",
    status: row.status || "published",
  };
}

export async function loadPublicSiteSettings(
  supabase: SupabaseClient,
): Promise<PublicSiteSettings> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("key,value")
    .eq("is_public", true);

  if (error) {
    console.warn("[CMS] Paramètres publics indisponibles :", error);
    return {};
  }

  return Object.fromEntries(
    (data ?? []).map((row: any) => [row.key, row.value]),
  );
}

export async function loadPublicHomeCms(
  supabase: SupabaseClient,
  locale = "fr",
): Promise<PublicHomeCmsBundle> {
  const now = new Date().toISOString();

  const [homepageResult, bannersResult, sectionsResult, settings] =
    await Promise.all([
      supabase
        .from("cms_homepage")
        .select("*")
        .eq("locale", locale)
        .eq("status", "published")
        .maybeSingle(),
      supabase
        .from("banners")
        .select(
          "id,title,subtitle,image_url,mobile_image_url,cta_label,cta_url,placement,sort_order",
        )
        .eq("locale", locale)
        .eq("status", "active")
        .or(`starts_at.is.null,starts_at.lte.${now}`)
        .or(`ends_at.is.null,ends_at.gte.${now}`)
        .order("sort_order"),
      supabase
        .from("cms_sections")
        .select("*")
        .eq("locale", locale)
        .eq("page_key", "home")
        .eq("is_active", true)
        .order("sort_order"),
      loadPublicSiteSettings(supabase),
    ]);

  if (homepageResult.error) {
    console.warn("[CMS] Page d'accueil indisponible :", homepageResult.error);
  }

  if (bannersResult.error) {
    console.warn("[CMS] Bannières indisponibles :", bannersResult.error);
  }

  if (sectionsResult.error) {
    console.warn("[CMS] Sections indisponibles :", sectionsResult.error);
  }

  return {
    homepage: normalizeHomepageCms(homepageResult.data),
    banners: (bannersResult.data ?? []) as CmsBanner[],
    sections: (sectionsResult.data ?? []) as CmsSection[],
    settings,
  };
}

export async function loadPublicPage(
  supabase: SupabaseClient,
  slug: string,
  locale = "fr",
) {
  const [pageResult, sectionsResult] = await Promise.all([
    supabase
      .from("cms_pages")
      .select("*")
      .eq("locale", locale)
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle(),
    supabase
      .from("cms_sections")
      .select("*")
      .eq("locale", locale)
      .eq("page_key", slug)
      .eq("is_active", true)
      .order("sort_order"),
  ]);

  if (pageResult.error) throw pageResult.error;
  if (sectionsResult.error) throw sectionsResult.error;

  return {
    page: pageResult.data,
    sections: sectionsResult.data ?? [],
  };
}

export async function loadPublicPosts(supabase: SupabaseClient, locale = "fr") {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("locale", locale)
    .eq("status", "published")
    .order("is_featured", { ascending: false })
    .order("published_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function loadPublicPost(
  supabase: SupabaseClient,
  slug: string,
  locale = "fr",
) {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("locale", locale)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function loadPublicFaqs(supabase: SupabaseClient, locale = "fr") {
  const { data, error } = await supabase
    .from("faqs")
    .select("*")
    .eq("locale", locale)
    .eq("is_active", true)
    .order("sort_order");

  if (error) throw error;
  return data ?? [];
}

export async function loadPublicSeo(
  supabase: SupabaseClient,
  route: string,
  locale = "fr",
) {
  const { data, error } = await supabase
    .from("seo_metadata")
    .select("*")
    .eq("locale", locale)
    .eq("route", route)
    .maybeSingle();

  if (error) {
    console.warn("[CMS] SEO indisponible :", error);
    return null;
  }

  return data;
}


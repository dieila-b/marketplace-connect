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

/* ─── Pages ─────────────────────────────────────────────── */
export type CmsPage = {
  id: string;
  locale: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  cover_image_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  status: string;
  published_at: string | null;
};

export type PublicPageBundle = {
  page: CmsPage | null;
  sections: CmsSection[];
};

/* ─── Posts / Blog ──────────────────────────────────────── */
export type CmsPost = {
  id: string;
  locale: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  cover_image_url: string | null;
  category: string | null;
  tags: string[] | null;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  status: string;
  is_featured: boolean | null;
  published_at: string | null;
};

/* ─── FAQ ───────────────────────────────────────────────── */
export type CmsFaq = {
  id: string;
  locale: string;
  question: string;
  answer: string;
  category: string | null;
  sort_order: number;
  is_active: boolean;
};

/* ─── SEO metadata ──────────────────────────────────────── */
export type CmsSeoMetadata = {
  id: string;
  locale: string;
  route: string;
  title: string | null;
  description: string | null;
  og_image_url: string | null;
  canonical_url: string | null;
  meta: Record<string, unknown> | null;
};

/* ─── Navigation ────────────────────────────────────────── */
export type CmsPageReference = {
  slug: string | null;
  status?: string | null;
};

export type CmsNavigationItemRow = {
  id: string;
  label: string;
  url: string | null;
  target: "_self" | "_blank" | string | null;
  icon: string | null;
  sort_order: number;
  parent_id: string | null;
  page?: CmsPageReference | CmsPageReference[] | null;
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

import {
  cmsBannerSchema,
  cmsFaqSchema,
  cmsPostSchema,
  cmsSectionSchema,
  cmsSeoMetadataSchema,
  parseArray,
  parseHomepage,
  parsePageBundle,
  parseSingle,
} from "./schemas";

export function normalizeHomepageCms(row: unknown): CmsHomepage {
  return parseHomepage(row);
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

  const rows = Array.isArray(data) ? data : [];
  const out: Record<string, unknown> = {};
  for (const row of rows) {
    if (row && typeof row === "object" && "key" in row) {
      const key = String((row as { key: unknown }).key ?? "");
      if (key) out[key] = (row as { value: unknown }).value;
    }
  }
  return out;
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
    homepage: parseHomepage(homepageResult.data),
    banners: parseArray(cmsBannerSchema, bannersResult.data, "banners"),
    sections: parseArray(cmsSectionSchema, sectionsResult.data, "cms_sections"),
    settings,
  };
}

export async function loadPublicPage(
  supabase: SupabaseClient,
  slug: string,
  locale = "fr",
): Promise<PublicPageBundle> {
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

  return parsePageBundle(pageResult.data, sectionsResult.data);
}

export async function loadPublicPosts(
  supabase: SupabaseClient,
  locale = "fr",
): Promise<CmsPost[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("locale", locale)
    .eq("status", "published")
    .order("is_featured", { ascending: false })
    .order("published_at", { ascending: false });

  if (error) throw error;
  return parseArray(cmsPostSchema, data, "posts");
}

export async function loadPublicPost(
  supabase: SupabaseClient,
  slug: string,
  locale = "fr",
): Promise<CmsPost | null> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("locale", locale)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) throw error;
  return parseSingle(cmsPostSchema, data, "posts");
}

export async function loadPublicFaqs(
  supabase: SupabaseClient,
  locale = "fr",
): Promise<CmsFaq[]> {
  const { data, error } = await supabase
    .from("faqs")
    .select("*")
    .eq("locale", locale)
    .eq("is_active", true)
    .order("sort_order");

  if (error) throw error;
  return parseArray(cmsFaqSchema, data, "faqs");
}

export async function loadPublicSeo(
  supabase: SupabaseClient,
  route: string,
  locale = "fr",
): Promise<CmsSeoMetadata | null> {
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

  return parseSingle(cmsSeoMetadataSchema, data, "seo_metadata");
}



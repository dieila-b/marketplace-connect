import { z } from "zod";
import {
  DEFAULT_HOMEPAGE_CMS,
  type CmsBanner,
  type CmsFaq,
  type CmsHomepage,
  type CmsNavigationItemRow,
  type CmsPage,
  type CmsPost,
  type CmsSection,
  type CmsSeoMetadata,
  type CmsStatistic,
  type PublicPageBundle,
} from "./public-cms";
import { reportCmsValidationIssue } from "./validation-reporter";


/* Helpers --------------------------------------------------------------- */

const nullableString = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((v) => (v == null ? null : String(v)));

const optionalString = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((v) => (v == null ? "" : String(v)));

const jsonObject = z
  .unknown()
  .transform((v): Record<string, unknown> =>
    v && typeof v === "object" && !Array.isArray(v)
      ? (v as Record<string, unknown>)
      : {},
  );

const nullableJsonObject = z
  .unknown()
  .transform((v): Record<string, unknown> | null =>
    v && typeof v === "object" && !Array.isArray(v)
      ? (v as Record<string, unknown>)
      : null,
  );

const numberField = z
  .union([z.number(), z.string(), z.null(), z.undefined()])
  .transform((v) => {
    if (v == null) return 0;
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : 0;
  });

const booleanField = z
  .union([z.boolean(), z.null(), z.undefined()])
  .transform((v) => Boolean(v));

const nullableBoolean = z
  .union([z.boolean(), z.null(), z.undefined()])
  .transform((v) => (v == null ? null : Boolean(v)));

const stringArray = z
  .unknown()
  .transform((v): string[] | null => {
    if (v == null) return null;
    if (!Array.isArray(v)) return null;
    return v.map((x) => String(x)).filter(Boolean);
  });

/* Schemas --------------------------------------------------------------- */

export const cmsStatisticSchema: z.ZodType<CmsStatistic> = z
  .object({ label: optionalString, value: optionalString })
  .passthrough()
  .transform((r) => ({ label: r.label, value: r.value }));

export const cmsHomepageSchema: z.ZodType<CmsHomepage> = z
  .unknown()
  .transform((row): CmsHomepage => {
    if (!row || typeof row !== "object") return DEFAULT_HOMEPAGE_CMS;
    const r = row as Record<string, unknown>;
    const stats = Array.isArray(r.statistics)
      ? (r.statistics as unknown[])
          .map((s) => cmsStatisticSchema.safeParse(s))
          .filter((res) => res.success)
          .map((res) => (res as { data: CmsStatistic }).data)
          .filter((s) => s.label && s.value)
      : [];
    return {
      id: typeof r.id === "string" ? r.id : undefined,
      locale: String(r.locale ?? "fr"),
      hero_badge: String(r.hero_badge ?? DEFAULT_HOMEPAGE_CMS.hero_badge),
      hero_title: String(r.hero_title ?? DEFAULT_HOMEPAGE_CMS.hero_title),
      hero_subtitle: String(r.hero_subtitle ?? DEFAULT_HOMEPAGE_CMS.hero_subtitle),
      hero_description: String(
        r.hero_description ?? DEFAULT_HOMEPAGE_CMS.hero_description,
      ),
      hero_background_url: String(r.hero_background_url ?? ""),
      hero_primary_label: String(
        r.hero_primary_label ?? DEFAULT_HOMEPAGE_CMS.hero_primary_label,
      ),
      hero_primary_url: String(
        r.hero_primary_url ?? DEFAULT_HOMEPAGE_CMS.hero_primary_url,
      ),
      hero_secondary_label: String(
        r.hero_secondary_label ?? DEFAULT_HOMEPAGE_CMS.hero_secondary_label,
      ),
      hero_secondary_url: String(
        r.hero_secondary_url ?? DEFAULT_HOMEPAGE_CMS.hero_secondary_url,
      ),
      search_placeholder: String(
        r.search_placeholder ?? DEFAULT_HOMEPAGE_CMS.search_placeholder,
      ),
      featured_categories_title: String(
        r.featured_categories_title ??
          DEFAULT_HOMEPAGE_CMS.featured_categories_title,
      ),
      featured_listings_title: String(
        r.featured_listings_title ??
          DEFAULT_HOMEPAGE_CMS.featured_listings_title,
      ),
      statistics: stats.length ? stats : DEFAULT_HOMEPAGE_CMS.statistics,
      options:
        r.options && typeof r.options === "object" && !Array.isArray(r.options)
          ? (r.options as Record<string, unknown>)
          : {},
      seo_title: String(r.seo_title ?? DEFAULT_HOMEPAGE_CMS.seo_title),
      seo_description: String(
        r.seo_description ?? DEFAULT_HOMEPAGE_CMS.seo_description,
      ),
      og_image_url: String(r.og_image_url ?? ""),
      status: String(r.status ?? "published"),
    };
  });

export const cmsBannerSchema: z.ZodType<CmsBanner> = z
  .object({
    id: z.string(),
    title: optionalString,
    subtitle: nullableString,
    image_url: nullableString,
    mobile_image_url: nullableString,
    cta_label: nullableString,
    cta_url: nullableString,
    placement: optionalString,
  })
  .passthrough()
  .transform((r) => ({
    id: r.id,
    title: r.title,
    subtitle: r.subtitle,
    image_url: r.image_url,
    mobile_image_url: r.mobile_image_url,
    cta_label: r.cta_label,
    cta_url: r.cta_url,
    placement: r.placement,
  }));

export const cmsSectionSchema: z.ZodType<CmsSection> = z
  .object({
    id: z.string(),
    page_key: optionalString,
    section_key: optionalString,
    section_type: optionalString,
    title: nullableString,
    subtitle: nullableString,
    body: nullableString,
    image_url: nullableString,
    cta_label: nullableString,
    cta_url: nullableString,
    content: jsonObject,
    sort_order: numberField,
  })
  .passthrough()
  .transform((r) => ({
    id: r.id,
    page_key: r.page_key,
    section_key: r.section_key,
    section_type: r.section_type,
    title: r.title,
    subtitle: r.subtitle,
    body: r.body,
    image_url: r.image_url,
    cta_label: r.cta_label,
    cta_url: r.cta_url,
    content: r.content,
    sort_order: r.sort_order,
  }));

export const cmsPageSchema: z.ZodType<CmsPage> = z
  .object({
    id: z.string(),
    locale: optionalString,
    slug: optionalString,
    title: optionalString,
    excerpt: nullableString,
    content: nullableString,
    cover_image_url: nullableString,
    seo_title: nullableString,
    seo_description: nullableString,
    og_image_url: nullableString,
    status: optionalString,
    published_at: nullableString,
  })
  .passthrough()
  .transform((r) => ({
    id: r.id,
    locale: r.locale,
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt,
    content: r.content,
    cover_image_url: r.cover_image_url,
    seo_title: r.seo_title,
    seo_description: r.seo_description,
    og_image_url: r.og_image_url,
    status: r.status,
    published_at: r.published_at,
  }));

export const cmsPostSchema: z.ZodType<CmsPost> = z
  .object({
    id: z.string(),
    locale: optionalString,
    slug: optionalString,
    title: optionalString,
    excerpt: nullableString,
    content: nullableString,
    cover_image_url: nullableString,
    category: nullableString,
    tags: stringArray,
    seo_title: nullableString,
    seo_description: nullableString,
    og_image_url: nullableString,
    status: optionalString,
    is_featured: nullableBoolean,
    published_at: nullableString,
  })
  .passthrough()
  .transform((r) => ({
    id: r.id,
    locale: r.locale,
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt,
    content: r.content,
    cover_image_url: r.cover_image_url,
    category: r.category,
    tags: r.tags,
    seo_title: r.seo_title,
    seo_description: r.seo_description,
    og_image_url: r.og_image_url,
    status: r.status,
    is_featured: r.is_featured,
    published_at: r.published_at,
  }));

export const cmsFaqSchema: z.ZodType<CmsFaq> = z
  .object({
    id: z.string(),
    locale: optionalString,
    question: optionalString,
    answer: optionalString,
    category: nullableString,
    sort_order: numberField,
    is_active: booleanField,
  })
  .passthrough()
  .transform((r) => ({
    id: r.id,
    locale: r.locale,
    question: r.question,
    answer: r.answer,
    category: r.category,
    sort_order: r.sort_order,
    is_active: r.is_active,
  }));

export const cmsSeoMetadataSchema: z.ZodType<CmsSeoMetadata> = z
  .object({
    id: z.string(),
    locale: optionalString,
    route: optionalString,
    title: nullableString,
    description: nullableString,
    og_image_url: nullableString,
    canonical_url: nullableString,
    meta: nullableJsonObject,
  })
  .passthrough()
  .transform((r) => ({
    id: r.id,
    locale: r.locale,
    route: r.route,
    title: r.title,
    description: r.description,
    og_image_url: r.og_image_url,
    canonical_url: r.canonical_url,
    meta: r.meta,
  }));

const cmsPageReferenceSchema = z
  .object({
    slug: nullableString,
    status: nullableString.optional(),
  })
  .passthrough();

export const cmsNavigationItemSchema: z.ZodType<CmsNavigationItemRow> = z
  .object({
    id: z.string(),
    label: optionalString,
    url: nullableString,
    target: nullableString,
    icon: nullableString,
    sort_order: numberField,
    parent_id: nullableString,
    page: z
      .union([
        cmsPageReferenceSchema,
        z.array(cmsPageReferenceSchema),
        z.null(),
        z.undefined(),
      ])
      .transform((v) => (v === undefined ? null : v)),
  })
  .passthrough()
  .transform((r) => ({
    id: r.id,
    label: r.label,
    url: r.url,
    target: r.target,
    icon: r.icon,
    sort_order: r.sort_order,
    parent_id: r.parent_id,
    page: r.page,
  }));

/* Parsers with graceful fallback --------------------------------------- */

export function parseArray<T>(
  schema: z.ZodType<T>,
  data: unknown,
  context: string,
): T[] {
  if (!Array.isArray(data)) return [];
  const out: T[] = [];
  for (const row of data) {
    const res = schema.safeParse(row);
    if (res.success) out.push(res.data);
    else
      console.warn(
        `[CMS] Ligne ignorée (${context}) — validation Zod échouée:`,
        res.error.issues,
      );
  }
  return out;
}

export function parseSingle<T>(
  schema: z.ZodType<T>,
  data: unknown,
  context: string,
): T | null {
  if (data == null) return null;
  const res = schema.safeParse(data);
  if (res.success) return res.data;
  console.warn(
    `[CMS] Enregistrement invalide (${context}) — validation Zod échouée:`,
    res.error.issues,
  );
  return null;
}

export function parseHomepage(data: unknown): CmsHomepage {
  const res = cmsHomepageSchema.safeParse(data);
  if (res.success) return res.data;
  console.warn("[CMS] Page d'accueil invalide, fallback appliqué:", res.error.issues);
  return DEFAULT_HOMEPAGE_CMS;
}

export function parsePageBundle(
  pageData: unknown,
  sectionsData: unknown,
): PublicPageBundle {
  return {
    page: parseSingle(cmsPageSchema, pageData, "cms_pages"),
    sections: parseArray(cmsSectionSchema, sectionsData, "cms_sections"),
  };
}

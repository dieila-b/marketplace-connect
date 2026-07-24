import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";

import { useSupabase } from "@/integrations/supabase/provider";
import { loadPublicPage } from "@/integrations/cms/public-cms";

export const Route = createFileRoute("/page/$slug")({
  component: CmsPage,
});

function CmsPage() {
  const { slug } = Route.useParams();
  const { supabase } = useSupabase();
  const [page, setPage] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) return;

    let cancelled = false;
    void loadPublicPage(supabase, slug)
      .then((result) => {
        if (cancelled) return;
        setPage(result.page);
        setSections(result.sections);
      })
      .catch((error) => console.error("[CMS Page]", error))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [supabase, slug]);

  useEffect(() => {
    if (page?.seo_title || page?.title) {
      document.title = page.seo_title || `${page.title} — Kafoo`;
    }
  }, [page]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        Chargement...
      </div>
    );
  }

  if (!page) {
    return (
      <div className="kafoo-container py-20 text-center">
        <h1 className="text-3xl font-black">Page introuvable</h1>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <article className="kafoo-container">
        <a
          href="/"
          className="inline-flex items-center text-sm font-bold text-blue-600"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </a>

        <div className="mx-auto mt-8 max-w-4xl overflow-hidden rounded-3xl border bg-white shadow-sm">
          {page.cover_image_url && (
            <img
              src={page.cover_image_url}
              alt={page.title}
              className="max-h-[440px] w-full object-cover"
            />
          )}
          <div className="p-6 sm:p-10">
            <h1 className="text-3xl font-black text-slate-950 sm:text-5xl">
              {page.title}
            </h1>
            {page.excerpt && (
              <p className="mt-4 text-lg leading-8 text-slate-500">
                {page.excerpt}
              </p>
            )}
            {page.content && (
              <div className="mt-8 whitespace-pre-line text-base leading-8 text-slate-700">
                {page.content}
              </div>
            )}
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-4xl space-y-6">
          {sections.map((section) => (
            <section
              key={section.id}
              className="grid gap-6 rounded-3xl border bg-white p-6 shadow-sm md:grid-cols-2 md:items-center"
            >
              <div>
                {section.subtitle && (
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
                    {section.subtitle}
                  </p>
                )}
                {section.title && (
                  <h2 className="mt-2 text-2xl font-black text-slate-950">
                    {section.title}
                  </h2>
                )}
                {section.body && (
                  <p className="mt-3 whitespace-pre-line leading-7 text-slate-600">
                    {section.body}
                  </p>
                )}
                {section.cta_label && section.cta_url && (
                  <a
                    href={section.cta_url}
                    className="mt-5 inline-flex rounded-full bg-blue-600 px-5 py-3 font-bold text-white"
                  >
                    {section.cta_label}
                  </a>
                )}
              </div>
              {section.image_url && (
                <img
                  src={section.image_url}
                  alt={section.title || page.title}
                  className="w-full rounded-2xl object-cover"
                />
              )}
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}


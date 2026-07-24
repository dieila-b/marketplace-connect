import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Newspaper } from "lucide-react";

import { useSupabase } from "@/integrations/supabase/provider";
import { loadPublicPosts } from "@/integrations/cms/public-cms";

export const Route = createFileRoute("/blog")({
  component: BlogPage,
});

function BlogPage() {
  const { supabase } = useSupabase();
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    if (!supabase) return;
    void loadPublicPosts(supabase)
      .then(setPosts)
      .catch((error) => console.error("[Blog]", error));
  }, [supabase]);

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="kafoo-container">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
            <Newspaper className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-950">
              Blog & actualités
            </h1>
            <p className="text-sm text-slate-500">
              Conseils, nouveautés et informations Kafoo.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {posts.map((post) => (
            <article
              key={post.id}
              className="overflow-hidden rounded-3xl border bg-white shadow-sm"
            >
              {post.cover_image_url && (
                <img
                  src={post.cover_image_url}
                  alt={post.title}
                  className="aspect-video w-full object-cover"
                />
              )}
              <div className="p-5">
                {post.category && (
                  <p className="text-xs font-black uppercase tracking-wider text-blue-600">
                    {post.category}
                  </p>
                )}
                <h2 className="mt-2 text-xl font-black text-slate-950">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
                    {post.excerpt}
                  </p>
                )}
                <Link
                  to="/blog/$slug"
                  params={{ slug: post.slug }}
                  className="mt-5 inline-flex items-center font-bold text-blue-600"
                >
                  Lire l'article
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}


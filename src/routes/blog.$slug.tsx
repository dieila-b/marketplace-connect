import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";

import { useSupabase } from "@/integrations/supabase/provider";
import { loadPublicPost } from "@/integrations/cms/public-cms";

export const Route = createFileRoute("/blog/$slug")({
  component: BlogPostPage,
});

function BlogPostPage() {
  const { slug } = Route.useParams();
  const { supabase } = useSupabase();
  const [post, setPost] = useState<any>(null);

  useEffect(() => {
    if (!supabase) return;
    void loadPublicPost(supabase, slug)
      .then(setPost)
      .catch((error) => console.error("[Blog Post]", error));
  }, [supabase, slug]);

  useEffect(() => {
    if (post?.seo_title || post?.title)
      document.title = post.seo_title || `${post.title} — Kafoo`;
  }, [post]);

  if (!post)
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        Chargement...
      </div>
    );

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <article className="kafoo-container max-w-5xl">
        <Link
          to="/blog"
          className="inline-flex items-center font-bold text-blue-600"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour au blog
        </Link>
        <div className="mt-8 overflow-hidden rounded-3xl border bg-white shadow-sm">
          {post.cover_image_url && (
            <img
              src={post.cover_image_url}
              alt={post.title}
              className="max-h-[520px] w-full object-cover"
            />
          )}
          <div className="p-6 sm:p-10">
            {post.category && (
              <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
                {post.category}
              </p>
            )}
            <h1 className="mt-3 text-3xl font-black text-slate-950 sm:text-5xl">
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="mt-4 text-lg leading-8 text-slate-500">
                {post.excerpt}
              </p>
            )}
            <div className="mt-8 whitespace-pre-line text-base leading-8 text-slate-700">
              {post.content}
            </div>
          </div>
        </div>
      </article>
    </main>
  );
}


import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { HelpCircle } from "lucide-react";

import { useSupabase } from "@/integrations/supabase/provider";
import { loadPublicFaqs } from "@/integrations/cms/public-cms";

export const Route = createFileRoute("/faq")({
  component: FaqPage,
});

function FaqPage() {
  const { supabase } = useSupabase();
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    if (!supabase) return;
    void loadPublicFaqs(supabase)
      .then(setRows)
      .catch((error) => console.error("[FAQ]", error));
  }, [supabase]);

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="kafoo-container max-w-4xl">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
            <HelpCircle className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-3xl font-black text-slate-950 sm:text-5xl">
            Questions fréquentes
          </h1>
          <p className="mt-3 text-slate-500">
            Retrouvez les réponses aux principales questions sur Kafoo.
          </p>
        </div>

        <div className="mt-10 space-y-3">
          {rows.map((row) => (
            <details
              key={row.id}
              className="group rounded-2xl border bg-white p-5 shadow-sm"
            >
              <summary className="cursor-pointer list-none font-black text-slate-950">
                {row.question}
              </summary>
              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600">
                {row.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </main>
  );
}


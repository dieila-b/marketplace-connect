import { useEffect, useState } from "react";

import { useSupabase } from "@/integrations/supabase/provider";

export function PublicCmsMenu({
  menuSlug,
  className = "",
  linkClassName = "",
}: {
  menuSlug: string;
  className?: string;
  linkClassName?: string;
}) {
  const { supabase } = useSupabase();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (!supabase) return;

    let cancelled = false;

    void (async () => {
      const { data: menu, error: menuError } = await supabase
        .from("navigation_menus")
        .select("id")
        .eq("slug", menuSlug)
        .eq("is_active", true)
        .maybeSingle();

      if (menuError || !menu) {
        if (menuError) console.warn("[CMS Menu]", menuError);
        return;
      }

      const { data, error } = await supabase
        .from("navigation_items")
        .select("id,label,url,target,icon,sort_order,parent_id")
        .eq("menu_id", menu.id)
        .eq("is_active", true)
        .is("parent_id", null)
        .order("sort_order");

      if (error) {
        console.warn("[CMS Menu]", error);
        return;
      }

      if (!cancelled) setItems(data ?? []);
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase, menuSlug]);

  return (
    <nav className={className} aria-label={menuSlug}>
      {items.map((item) => (
        <a
          key={item.id}
          href={item.url || "#"}
          target={item.target || "_self"}
          rel={item.target === "_blank" ? "noreferrer" : undefined}
          className={linkClassName}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}


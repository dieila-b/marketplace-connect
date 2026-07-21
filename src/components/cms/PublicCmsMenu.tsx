import { useEffect, useState } from "react";

import { useSupabase } from "@/integrations/supabase/provider";

/* ════════════════════════════════════════════════════════════
   TYPES
════════════════════════════════════════════════════════════ */

type CmsPageReference = {
  slug: string | null;
  status?: string | null;
};

type NavigationItemRow = {
  id: string;
  label: string;
  url: string | null;
  target: "_self" | "_blank" | string | null;
  icon: string | null;
  sort_order: number;
  parent_id: string | null;

  /*
   * Relation optionnelle vers cms_pages.
   * Selon PostgREST, la relation peut être retournée
   * comme objet ou comme tableau.
   */
  page?:
    | CmsPageReference
    | CmsPageReference[]
    | null;
};

type NavigationItem = NavigationItemRow & {
  children: NavigationItem[];
};

type PublicCmsMenuProps = {
  menuSlug: string;
  className?: string;
  linkClassName?: string;
  submenuClassName?: string;
  submenuLinkClassName?: string;
  loadingFallback?: React.ReactNode;
  emptyFallback?: React.ReactNode;
};

/* ════════════════════════════════════════════════════════════
   UTILITAIRES
════════════════════════════════════════════════════════════ */

/**
 * Récupère le slug d'une page CMS associée.
 */
function getPageSlug(
  page: NavigationItemRow["page"],
): string | null {
  if (!page) {
    return null;
  }

  if (Array.isArray(page)) {
    return page[0]?.slug ?? null;
  }

  return page.slug ?? null;
}

/**
 * Sécurise et normalise l'URL du menu.
 */
function resolveItemUrl(
  item: NavigationItemRow,
): string {
  const explicitUrl =
    typeof item.url === "string"
      ? item.url.trim()
      : "";

  if (explicitUrl) {
    /*
     * Protocoles explicitement autorisés.
     */
    if (
      explicitUrl.startsWith("/") ||
      explicitUrl.startsWith("#") ||
      explicitUrl.startsWith("https://") ||
      explicitUrl.startsWith("http://") ||
      explicitUrl.startsWith("mailto:") ||
      explicitUrl.startsWith("tel:")
    ) {
      return explicitUrl;
    }

    /*
     * Empêche notamment javascript: et data:.
     */
    if (
      /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(
        explicitUrl,
      )
    ) {
      console.warn(
        `[CMS Menu] URL refusée pour "${item.label}" :`,
        explicitUrl,
      );

      return "#";
    }

    /*
     * Une URL relative sans slash devient une URL interne.
     */
    return `/${explicitUrl.replace(/^\/+/, "")}`;
  }

  /*
   * Si aucune URL n'est définie, utilise la page CMS liée.
   */
  const pageSlug = getPageSlug(item.page);

  if (pageSlug) {
    return `/page/${pageSlug}`;
  }

  return "#";
}

/**
 * Normalise la cible du lien.
 */
function resolveTarget(
  target: string | null,
): "_self" | "_blank" {
  return target === "_blank"
    ? "_blank"
    : "_self";
}

/**
 * Transforme la liste plate Supabase en arbre de navigation.
 */
function buildMenuTree(
  rows: NavigationItemRow[],
): NavigationItem[] {
  const itemMap = new Map<
    string,
    NavigationItem
  >();

  const roots: NavigationItem[] = [];

  /*
   * Création de tous les éléments.
   */
  for (const row of rows) {
    itemMap.set(row.id, {
      ...row,
      children: [],
    });
  }

  /*
   * Association des enfants aux parents.
   */
  for (const row of rows) {
    const currentItem =
      itemMap.get(row.id);

    if (!currentItem) {
      continue;
    }

    if (row.parent_id) {
      const parent =
        itemMap.get(row.parent_id);

      if (parent) {
        parent.children.push(currentItem);
        continue;
      }
    }

    roots.push(currentItem);
  }

  /*
   * Tri récursif selon sort_order.
   */
  const sortItems = (
    items: NavigationItem[],
  ): NavigationItem[] => {
    return items
      .sort(
        (first, second) =>
          (first.sort_order ?? 0) -
          (second.sort_order ?? 0),
      )
      .map((item) => ({
        ...item,
        children: sortItems(item.children),
      }));
  };

  return sortItems(roots);
}

/* ════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
════════════════════════════════════════════════════════════ */

export function PublicCmsMenu({
  menuSlug,
  className = "",
  linkClassName = "",
  submenuClassName = "",
  submenuLinkClassName = "",
  loadingFallback = null,
  emptyFallback = null,
}: PublicCmsMenuProps) {
  const { supabase } = useSupabase();

  const [items, setItems] = useState<
    NavigationItem[]
  >([]);

  const [menuName, setMenuName] =
    useState(menuSlug);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    if (!supabase || !menuSlug) {
      setItems([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadMenu() {
      try {
        setLoading(true);
        setError(null);
        setItems([]);

        /*
         * Recherche du menu principal.
         */
        const {
          data: menu,
          error: menuError,
        } = await supabase
          .from("navigation_menus")
          .select("id,name,slug")
          .eq("slug", menuSlug)
          .eq("is_active", true)
          .maybeSingle();

        if (cancelled) {
          return;
        }

        if (menuError) {
          console.warn(
            `[CMS Menu] Impossible de charger le menu "${menuSlug}" :`,
            menuError,
          );

          setError(menuError.message);
          return;
        }

        if (!menu) {
          console.warn(
            `[CMS Menu] Aucun menu actif trouvé avec le slug "${menuSlug}".`,
          );

          setItems([]);
          return;
        }

        setMenuName(
          menu.name || menuSlug,
        );

        /*
         * Première tentative avec la relation cms_pages.
         */
        let {
          data,
          error: itemsError,
        } = await supabase
          .from("navigation_items")
          .select(
            `
              id,
              label,
              url,
              target,
              icon,
              sort_order,
              parent_id,
              page:cms_pages (
                slug,
                status
              )
            `,
          )
          .eq("menu_id", menu.id)
          .eq("is_active", true)
          .order("sort_order", {
            ascending: true,
          });

        /*
         * Fallback si la relation page_id → cms_pages
         * n'est pas encore reconnue par PostgREST.
         */
        if (itemsError) {
          console.warn(
            "[CMS Menu] Relation cms_pages indisponible, chargement sans relation :",
            itemsError,
          );

          const fallback =
            await supabase
              .from("navigation_items")
              .select(
                `
                  id,
                  label,
                  url,
                  target,
                  icon,
                  sort_order,
                  parent_id
                `,
              )
              .eq("menu_id", menu.id)
              .eq("is_active", true)
              .order("sort_order", {
                ascending: true,
              });

          data = fallback.data;
          itemsError = fallback.error;
        }

        if (cancelled) {
          return;
        }

        if (itemsError) {
          console.warn(
            `[CMS Menu] Impossible de charger les éléments du menu "${menuSlug}" :`,
            itemsError,
          );

          setError(itemsError.message);
          return;
        }

        const normalizedRows =
          (data ??
            []) as NavigationItemRow[];

        setItems(
          buildMenuTree(normalizedRows),
        );
      } catch (caughtError) {
        if (cancelled) {
          return;
        }

        const message =
          caughtError instanceof Error
            ? caughtError.message
            : "Erreur inconnue.";

        console.error(
          `[CMS Menu] Erreur inattendue pour "${menuSlug}" :`,
          caughtError,
        );

        setError(message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadMenu();

    return () => {
      cancelled = true;
    };
  }, [supabase, menuSlug]);

  if (loading) {
    return <>{loadingFallback}</>;
  }

  if (error) {
    /*
     * Le menu public ne doit pas bloquer l'affichage
     * du site en cas d'erreur CMS.
     */
    return null;
  }

  if (items.length === 0) {
    return <>{emptyFallback}</>;
  }

  return (
    <nav
      className={className}
      aria-label={menuName}
    >
      {items.map((item) => (
        <MenuItem
          key={item.id}
          item={item}
          depth={0}
          linkClassName={linkClassName}
          submenuClassName={
            submenuClassName
          }
          submenuLinkClassName={
            submenuLinkClassName ||
            linkClassName
          }
        />
      ))}
    </nav>
  );
}

/* ════════════════════════════════════════════════════════════
   ÉLÉMENT DE MENU RÉCURSIF
════════════════════════════════════════════════════════════ */

function MenuItem({
  item,
  depth,
  linkClassName,
  submenuClassName,
  submenuLinkClassName,
}: {
  item: NavigationItem;
  depth: number;
  linkClassName: string;
  submenuClassName: string;
  submenuLinkClassName: string;
}) {
  const href = resolveItemUrl(item);
  const target = resolveTarget(
    item.target,
  );

  const hasChildren =
    item.children.length > 0;

  /*
   * Sans sous-menu, le lien reste directement
   * enfant du composant <nav>.
   */
  if (!hasChildren) {
    return (
      <a
        href={href}
        target={target}
        rel={
          target === "_blank"
            ? "noopener noreferrer"
            : undefined
        }
        className={
          depth === 0
            ? linkClassName
            : submenuLinkClassName
        }
      >
        {item.label}
      </a>
    );
  }

  const defaultSubmenuClasses =
    depth === 0
      ? "invisible absolute left-0 top-full z-50 mt-2 min-w-56 translate-y-1 rounded-xl border border-slate-200 bg-white p-2 opacity-0 shadow-xl transition duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100"
      : "invisible absolute left-full top-0 z-50 ml-2 min-w-56 translate-x-1 rounded-xl border border-slate-200 bg-white p-2 opacity-0 shadow-xl transition duration-150 group-hover:visible group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-x-0 group-focus-within:opacity-100";

  return (
    <div className="group relative">
      <a
        href={href}
        target={target}
        rel={
          target === "_blank"
            ? "noopener noreferrer"
            : undefined
        }
        className={
          depth === 0
            ? linkClassName
            : submenuLinkClassName
        }
        aria-haspopup="menu"
      >
        {item.label}
      </a>

      <div
        role="menu"
        aria-label={item.label}
        className={
          submenuClassName ||
          defaultSubmenuClasses
        }
      >
        {item.children.map(
          (child) => (
            <MenuItem
              key={child.id}
              item={child}
              depth={depth + 1}
              linkClassName={
                linkClassName
              }
              submenuClassName={
                submenuClassName
              }
              submenuLinkClassName={
                submenuLinkClassName
              }
            />
          ),
        )}
      </div>
    </div>
  );
}

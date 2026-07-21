from pathlib import Path

code = r'''import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  CheckCircle,
  CircleDollarSign,
  Eye,
  FileText,
  Globe,
  HelpCircle,
  Home,
  Image as ImageIcon,
  LayoutDashboard,
  Lock,
  LogOut,
  MapPin,
  Megaphone,
  Newspaper,
  Package,
  Search,
  Settings,
  Shield,
  Tags,
  Trash2,
  TrendingUp,
  UserCheck,
  UserCog,
  Users,
  XCircle,
} from "lucide-react";

import { useSupabase } from "@/integrations/supabase/provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

/* ════════════════════════════════════════════════════════════
   ROUTE /admin
════════════════════════════════════════════════════════════ */

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({
    meta: [
      { title: "Administration — Kafoo" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

/* ════════════════════════════════════════════════════════════
   TYPES
════════════════════════════════════════════════════════════ */

type AdminListing = {
  id: string;
  title: string;
  slug: string;
  status: string;
  created_at: string;
  price: number;
  currency: string;
  user_id: string;
  region?: { name: string } | null;
  city?: { name: string } | null;
};

type AdminUser = {
  id: string;
  user_id: string;
  display_name: string | null;
  phone: string | null;
  created_at: string;
  is_admin: boolean;
  email?: string;
};

type AdminReport = {
  id: string;
  reason: string;
  status: string;
  created_at: string;
  listing?: { title: string; slug: string } | null;
};

type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  is_active: boolean;
  sort_order: number;
};

type LocationRow = {
  id: string;
  name: string;
  slug?: string | null;
};

type Tab =
  | "dashboard"
  | "listings"
  | "users"
  | "shops"
  | "reports"
  | "categories"
  | "locations"
  | "media"
  | "homepage"
  | "pages"
  | "banners"
  | "faq"
  | "blog"
  | "sponsored"
  | "ads"
  | "notifications"
  | "seo"
  | "settings"
  | "admins"
  | "roles"
  | "audit";

type NavItem = {
  id: Tab;
  label: string;
  icon: ReactNode;
  color: string;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

/* ════════════════════════════════════════════════════════════
   STATUTS
════════════════════════════════════════════════════════════ */

const STATUS_CFG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  active: {
    label: "Publié",
    color: "text-emerald-700",
    bg: "bg-emerald-100",
  },
  published: {
    label: "Publié",
    color: "text-emerald-700",
    bg: "bg-emerald-100",
  },
  pending: {
    label: "En attente",
    color: "text-yellow-700",
    bg: "bg-yellow-100",
  },
  rejected: {
    label: "Rejeté",
    color: "text-red-700",
    bg: "bg-red-100",
  },
  suspended: {
    label: "Suspendu",
    color: "text-orange-700",
    bg: "bg-orange-100",
  },
  sold: {
    label: "Vendu",
    color: "text-slate-600",
    bg: "bg-slate-100",
  },
  open: {
    label: "Ouvert",
    color: "text-red-700",
    bg: "bg-red-100",
  },
  resolved: {
    label: "Résolu",
    color: "text-emerald-700",
    bg: "bg-emerald-100",
  },
};

function Badge({ status }: { status: string }) {
  const cfg =
    STATUS_CFG[status] ?? {
      label: status,
      color: "text-slate-600",
      bg: "bg-slate-100",
    };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${cfg.bg} ${cfg.color}`}
    >
      {cfg.label}
    </span>
  );
}

/* ════════════════════════════════════════════════════════════
   NAVIGATION ADMIN
════════════════════════════════════════════════════════════ */

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Vue d'ensemble",
    items: [
      {
        id: "dashboard",
        label: "Tableau de bord",
        icon: <LayoutDashboard className="h-4 w-4" />,
        color: "text-blue-400",
      },
    ],
  },
  {
    label: "Gestion",
    items: [
      {
        id: "listings",
        label: "Annonces",
        icon: <Package className="h-4 w-4" />,
        color: "text-violet-400",
      },
      {
        id: "users",
        label: "Utilisateurs",
        icon: <Users className="h-4 w-4" />,
        color: "text-emerald-400",
      },
      {
        id: "shops",
        label: "Boutiques",
        icon: <Building2 className="h-4 w-4" />,
        color: "text-cyan-400",
      },
      {
        id: "reports",
        label: "Signalements",
        icon: <AlertTriangle className="h-4 w-4" />,
        color: "text-red-400",
      },
    ],
  },
  {
    label: "Catalogue",
    items: [
      {
        id: "categories",
        label: "Catégories",
        icon: <Tags className="h-4 w-4" />,
        color: "text-orange-400",
      },
      {
        id: "locations",
        label: "Localisation",
        icon: <MapPin className="h-4 w-4" />,
        color: "text-sky-400",
      },
      {
        id: "media",
        label: "Médiathèque",
        icon: <ImageIcon className="h-4 w-4" />,
        color: "text-pink-400",
      },
    ],
  },
  {
    label: "CMS",
    items: [
      {
        id: "homepage",
        label: "Page d'accueil",
        icon: <Home className="h-4 w-4" />,
        color: "text-blue-400",
      },
      {
        id: "pages",
        label: "Pages",
        icon: <FileText className="h-4 w-4" />,
        color: "text-indigo-400",
      },
      {
        id: "banners",
        label: "Bannières",
        icon: <Megaphone className="h-4 w-4" />,
        color: "text-fuchsia-400",
      },
      {
        id: "faq",
        label: "FAQ",
        icon: <HelpCircle className="h-4 w-4" />,
        color: "text-amber-400",
      },
      {
        id: "blog",
        label: "Blog / Actualités",
        icon: <Newspaper className="h-4 w-4" />,
        color: "text-lime-400",
      },
    ],
  },
  {
    label: "Marketing",
    items: [
      {
        id: "sponsored",
        label: "Annonces sponsorisées",
        icon: <TrendingUp className="h-4 w-4" />,
        color: "text-yellow-400",
      },
      {
        id: "ads",
        label: "Publicités",
        icon: <CircleDollarSign className="h-4 w-4" />,
        color: "text-emerald-400",
      },
      {
        id: "notifications",
        label: "Notifications",
        icon: <Bell className="h-4 w-4" />,
        color: "text-rose-400",
      },
    ],
  },
  {
    label: "Configuration",
    items: [
      {
        id: "seo",
        label: "SEO",
        icon: <Globe className="h-4 w-4" />,
        color: "text-cyan-400",
      },
      {
        id: "settings",
        label: "Paramètres",
        icon: <Settings className="h-4 w-4" />,
        color: "text-slate-400",
      },
    ],
  },
  {
    label: "Système",
    items: [
      {
        id: "admins",
        label: "Administrateurs",
        icon: <UserCog className="h-4 w-4" />,
        color: "text-blue-400",
      },
      {
        id: "roles",
        label: "Rôles & permissions",
        icon: <Lock className="h-4 w-4" />,
        color: "text-purple-400",
      },
      {
        id: "audit",
        label: "Journal d'activité",
        icon: <Activity className="h-4 w-4" />,
        color: "text-teal-400",
      },
    ],
  },
];

const ALL_NAV_ITEMS = NAV_SECTIONS.flatMap((section) => section.items);

/* ════════════════════════════════════════════════════════════
   PAGE PRINCIPALE ADMIN
════════════════════════════════════════════════════════════ */

function AdminPage() {
  const { supabase, user, isAdmin, loading } = useSupabase();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>("dashboard");
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [accessError, setAccessError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function verifyAdminAccess() {
      if (loading) return;

      if (!user) {
        if (!cancelled) {
          setAuthorized(false);
          setCheckingAccess(false);
          setAccessError("");
        }
        return;
      }

      if (isAdmin === true) {
        if (!cancelled) {
          setAuthorized(true);
          setCheckingAccess(false);
          setAccessError("");
        }
        return;
      }

      try {
        let profile: { is_admin?: boolean } | null = null;
        let profileError: any = null;

        const firstCheck = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("user_id", user.id)
          .maybeSingle();

        profile = firstCheck.data;
        profileError = firstCheck.error;

        if (profileError) {
          const fallbackCheck = await supabase
            .from("profiles")
            .select("is_admin")
            .eq("id", user.id)
            .maybeSingle();

          profile = fallbackCheck.data;
          profileError = fallbackCheck.error;
        }

        if (cancelled) return;

        if (profileError) {
          console.error("[Admin] Vérification du rôle impossible :", profileError);
          setAuthorized(false);
          setAccessError(
            `Impossible de vérifier vos droits administrateur : ${profileError.message}`,
          );
          return;
        }

        if (!profile?.is_admin) {
          setAuthorized(false);
          setAccessError("Votre compte ne possède pas les droits administrateur.");
          return;
        }

        setAuthorized(true);
        setAccessError("");
      } catch (error) {
        if (cancelled) return;

        console.error("[Admin] Erreur de vérification :", error);
        setAuthorized(false);
        setAccessError(
          "Une erreur est survenue pendant la vérification de vos droits.",
        );
      } finally {
        if (!cancelled) setCheckingAccess(false);
      }
    }

    void verifyAdminAccess();

    return () => {
      cancelled = true;
    };
  }, [loading, user, isAdmin, supabase]);

  if (loading || checkingAccess) {
    return (
      <AdminFullscreen>
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="mt-4 text-sm font-semibold text-slate-400">
            Vérification de vos droits administrateur...
          </p>
        </div>
      </AdminFullscreen>
    );
  }

  if (!user) {
    return (
      <AdminFullscreen>
        <AdminLogin supabase={supabase} />
      </AdminFullscreen>
    );
  }

  if (!authorized) {
    return (
      <AdminFullscreen>
        <AdminAccessDenied
          title="Accès refusé"
          message={
            accessError ||
            "Vous ne disposez pas des droits nécessaires pour accéder à l'administration."
          }
          onBack={() => navigate({ to: "/", replace: true })}
          onLogout={async () => {
            await supabase.auth.signOut();
            window.location.href = "/admin";
          }}
        />
      </AdminFullscreen>
    );
  }

  const activeItem =
    ALL_NAV_ITEMS.find((item) => item.id === tab) ?? ALL_NAV_ITEMS[0];

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        toast.error(error.message);
        return;
      }

      window.location.href = "/admin";
    } catch (error) {
      console.error("[Admin] Erreur déconnexion :", error);
      toast.error("Impossible de vous déconnecter.");
    }
  };

  return (
    <AdminFullscreen>
      <div className="flex min-h-screen bg-slate-950 text-white">
        <aside className="hidden h-screen w-72 shrink-0 flex-col border-r border-white/10 bg-slate-900 lg:flex">
          <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-fuchsia-500">
              <Shield className="h-5 w-5 text-white" />
            </div>

            <div>
              <p className="font-black text-white">Kafoo</p>
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
                Administration
              </p>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {NAV_SECTIONS.map((section) => (
              <div key={section.label} className="mb-5">
                <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">
                  {section.label}
                </p>

                <div className="space-y-1">
                  {section.items.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setTab(item.id)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                        tab === item.id
                          ? "bg-white/10 text-white"
                          : "text-slate-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span className={tab === item.id ? "text-white" : item.color}>
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="border-t border-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-fuchsia-500 text-xs font-black">
                {user.email?.[0]?.toUpperCase() ?? "A"}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-white">{user.email}</p>
                <p className="text-[10px] font-semibold text-emerald-400">
                  Administrateur
                </p>
              </div>

              <button
                type="button"
                onClick={() => void handleLogout()}
                title="Se déconnecter"
                className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-white/10 bg-slate-900 lg:hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-400" />
                <div>
                  <p className="text-sm font-black text-white">Admin Kafoo</p>
                  <p className="text-[10px] text-slate-500">{activeItem.label}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void handleLogout()}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
                title="Se déconnecter"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>

            <div className="flex overflow-x-auto border-t border-white/5 px-2 py-2">
              {ALL_NAV_ITEMS.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  title={item.label}
                  className={`mx-0.5 shrink-0 rounded-lg p-2.5 transition ${
                    tab === item.id
                      ? "bg-white/10 text-white"
                      : "text-slate-400 hover:bg-white/5"
                  }`}
                >
                  {item.icon}
                </button>
              ))}
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            {tab === "dashboard" && (
              <TabDashboard supabase={supabase} setTab={setTab} />
            )}
            {tab === "listings" && <TabListings supabase={supabase} />}
            {tab === "users" && (
              <TabUsers supabase={supabase} currentUserId={user.id} />
            )}
            {tab === "shops" && (
              <ModulePlaceholder
                title="Boutiques & professionnels"
                description="Gérez les boutiques, vendeurs professionnels, statuts de validation, abonnements et mises en avant."
                icon={<Building2 className="h-6 w-6" />}
                features={[
                  "Valider ou suspendre une boutique",
                  "Voir le propriétaire et ses annonces",
                  "Gérer les offres professionnelles",
                  "Suivre les performances des boutiques",
                ]}
                tables={["shops"]}
              />
            )}
            {tab === "reports" && <TabReports supabase={supabase} />}
            {tab === "categories" && <TabCategories supabase={supabase} />}
            {tab === "locations" && <TabLocations supabase={supabase} />}
            {tab === "media" && (
              <ModulePlaceholder
                title="Médiathèque"
                description="Centralisez les images du CMS, bannières, logos et visuels éditoriaux."
                icon={<ImageIcon className="h-6 w-6" />}
                features={[
                  "Téléversement d'images",
                  "Classement par dossiers",
                  "Recherche et réutilisation",
                  "Suppression et archivage",
                ]}
                tables={["media"]}
              />
            )}
            {tab === "homepage" && (
              <TabHomepageCms />
            )}
            {tab === "pages" && (
              <ModulePlaceholder
                title="Pages CMS"
                description="Créez et modifiez les pages éditoriales de Kafoo sans toucher au code."
                icon={<FileText className="h-6 w-6" />}
                features={[
                  "À propos",
                  "Conditions générales",
                  "Politique de confidentialité",
                  "Pages personnalisées",
                ]}
                tables={["cms_pages"]}
              />
            )}
            {tab === "banners" && (
              <ModulePlaceholder
                title="Bannières"
                description="Gérez les visuels promotionnels et les campagnes affichées sur le site."
                icon={<Megaphone className="h-6 w-6" />}
                features={[
                  "Bannière d'accueil",
                  "Bannières par catégorie",
                  "Périodes d'affichage",
                  "Lien d'action et ciblage",
                ]}
                tables={["banners"]}
              />
            )}
            {tab === "faq" && (
              <ModulePlaceholder
                title="FAQ"
                description="Administrez les questions fréquentes et leur ordre d'affichage."
                icon={<HelpCircle className="h-6 w-6" />}
                features={[
                  "Créer une question",
                  "Modifier les réponses",
                  "Activer ou désactiver",
                  "Réordonner les éléments",
                ]}
                tables={["faqs"]}
              />
            )}
            {tab === "blog" && (
              <ModulePlaceholder
                title="Blog & actualités"
                description="Publiez des articles, annonces officielles et contenus éditoriaux."
                icon={<Newspaper className="h-6 w-6" />}
                features={[
                  "Brouillon et publication",
                  "Image de couverture",
                  "SEO par article",
                  "Catégories éditoriales",
                ]}
                tables={["posts"]}
              />
            )}
            {tab === "sponsored" && (
              <ModulePlaceholder
                title="Annonces sponsorisées"
                description="Pilotez les annonces mises en avant et leur durée de visibilité."
                icon={<TrendingUp className="h-6 w-6" />}
                features={[
                  "Mise en avant manuelle",
                  "Date de début et de fin",
                  "Priorité d'affichage",
                  "Historique des campagnes",
                ]}
                tables={["listings"]}
              />
            )}
            {tab === "ads" && (
              <ModulePlaceholder
                title="Publicités"
                description="Gérez les emplacements publicitaires et les campagnes partenaires."
                icon={<CircleDollarSign className="h-6 w-6" />}
                features={[
                  "Campagnes publicitaires",
                  "Emplacements",
                  "Périodes de diffusion",
                  "Statistiques de clics",
                ]}
                tables={["ads", "banners"]}
              />
            )}
            {tab === "notifications" && (
              <ModulePlaceholder
                title="Notifications"
                description="Préparez et diffusez des communications aux utilisateurs de la plateforme."
                icon={<Bell className="h-6 w-6" />}
                features={[
                  "Notification individuelle",
                  "Diffusion globale",
                  "Ciblage par type d'utilisateur",
                  "Historique d'envoi",
                ]}
                tables={["notifications"]}
              />
            )}
            {tab === "seo" && <TabSeo />}
            {tab === "settings" && <TabSettings user={user} />}
            {tab === "admins" && (
              <ModulePlaceholder
                title="Administrateurs"
                description="Gérez les comptes ayant accès au back-office."
                icon={<UserCog className="h-6 w-6" />}
                features={[
                  "Ajouter un administrateur",
                  "Retirer les droits administrateur",
                  "Voir les dernières connexions",
                  "Bloquer un accès",
                ]}
                tables={["profiles"]}
              />
            )}
            {tab === "roles" && (
              <ModulePlaceholder
                title="Rôles & permissions"
                description="Définissez précisément les droits des administrateurs et modérateurs."
                icon={<Lock className="h-6 w-6" />}
                features={[
                  "Super administrateur",
                  "Administrateur",
                  "Modérateur",
                  "Gestionnaire de contenu",
                  "Support client",
                ]}
                tables={["roles", "permissions", "user_roles"]}
              />
            )}
            {tab === "audit" && (
              <ModulePlaceholder
                title="Journal d'activité"
                description="Suivez les actions sensibles effectuées dans l'administration."
                icon={<Activity className="h-6 w-6" />}
                features={[
                  "Action effectuée",
                  "Administrateur concerné",
                  "Élément modifié",
                  "Date et détails",
                ]}
                tables={["admin_logs"]}
              />
            )}
          </main>
        </div>
      </div>
    </AdminFullscreen>
  );
}

/* ════════════════════════════════════════════════════════════
   ÉCRAN PLEIN ADMIN
════════════════════════════════════════════════════════════ */

function AdminFullscreen({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] overflow-auto bg-slate-950">
      {children}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   CONNEXION ADMINISTRATEUR
════════════════════════════════════════════════════════════ */

function AdminLogin({ supabase }: { supabase: any }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      setErrorMessage(
        "Veuillez renseigner votre adresse e-mail et votre mot de passe.",
      );
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage("");

      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        setErrorMessage(
          error.message === "Invalid login credentials"
            ? "Adresse e-mail ou mot de passe incorrect."
            : error.message,
        );
        return;
      }

      if (!data?.user) {
        setErrorMessage("Impossible de récupérer le compte utilisateur.");
        return;
      }

      let profile: { is_admin?: boolean } | null = null;
      let profileError: any = null;

      const firstCheck = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("user_id", data.user.id)
        .maybeSingle();

      profile = firstCheck.data;
      profileError = firstCheck.error;

      if (profileError) {
        const fallbackCheck = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", data.user.id)
          .maybeSingle();

        profile = fallbackCheck.data;
        profileError = fallbackCheck.error;
      }

      if (profileError) {
        await supabase.auth.signOut();
        setErrorMessage("Impossible de vérifier vos droits administrateur.");
        return;
      }

      if (!profile?.is_admin) {
        await supabase.auth.signOut();
        setErrorMessage("Ce compte ne possède pas les droits administrateur.");
        return;
      }

      toast.success("Connexion administrateur réussie.");
      window.location.href = "/admin";
    } catch (error) {
      console.error("[Admin Login] Erreur :", error);
      setErrorMessage("Une erreur est survenue pendant la connexion.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 shadow-xl shadow-blue-900/20">
            <Shield className="h-8 w-8 text-white" />
          </div>

          <h1 className="mt-5 text-3xl font-black text-white">
            Administration Kafoo
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Connectez-vous pour accéder au back-office.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl sm:p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                htmlFor="admin-email"
                className="mb-2 block text-sm font-bold text-slate-300"
              >
                Adresse e-mail
              </label>

              <Input
                id="admin-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@kafoo.com"
                disabled={submitting}
                className="h-12 rounded-xl border-white/10 bg-slate-800 px-4 text-white placeholder:text-slate-500"
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="mb-2 block text-sm font-bold text-slate-300"
              >
                Mot de passe
              </label>

              <div className="relative">
                <Input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Votre mot de passe"
                  disabled={submitting}
                  className="h-12 rounded-xl border-white/10 bg-slate-800 px-4 pr-12 text-white placeholder:text-slate-500"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-white"
                  title={
                    showPassword
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                >
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                <p className="text-sm font-medium text-red-300">
                  {errorMessage}
                </p>
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="h-12 w-full rounded-xl bg-blue-600 text-sm font-black text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Connexion en cours..." : "Se connecter"}
            </Button>
          </form>

          <div className="mt-6 border-t border-white/10 pt-5">
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <Shield className="h-3.5 w-3.5" />
              <span>Accès réservé aux administrateurs autorisés</span>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-sm font-semibold text-slate-400 transition hover:text-white"
          >
            ← Retour au site Kafoo
          </a>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   ACCÈS REFUSÉ
════════════════════════════════════════════════════════════ */

function AdminAccessDenied({
  title,
  message,
  onBack,
  onLogout,
}: {
  title: string;
  message: string;
  onBack: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-5">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-7 text-center shadow-2xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10">
          <Shield className="h-7 w-7 text-red-400" />
        </div>

        <h1 className="mt-5 text-2xl font-black text-white">{title}</h1>

        <p className="mt-3 text-sm leading-6 text-slate-400">{message}</p>

        <div className="mt-6 grid gap-2">
          <Button
            type="button"
            onClick={onLogout}
            className="w-full rounded-xl bg-blue-600 font-bold text-white hover:bg-blue-700"
          >
            Se connecter avec un autre compte
          </Button>

          <Button
            type="button"
            onClick={onBack}
            className="w-full rounded-xl bg-slate-800 font-bold text-slate-200 hover:bg-slate-700"
          >
            Retour au site
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   TAB — DASHBOARD
════════════════════════════════════════════════════════════ */

function TabDashboard({
  supabase,
  setTab,
}: {
  supabase: any;
  setTab: (tab: Tab) => void;
}) {
  const [stats, setStats] = useState({
    users: 0,
    listings: 0,
    pending: 0,
    reports: 0,
    published: 0,
    sold: 0,
    categories: 0,
  });

  const [recent, setRecent] = useState<AdminListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        setLoading(true);

        const [
          usersResult,
          listingsResult,
          pendingResult,
          reportsResult,
          publishedResult,
          soldResult,
          categoriesResult,
        ] = await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("listings").select("*", { count: "exact", head: true }),
          supabase
            .from("listings")
            .select("*", { count: "exact", head: true })
            .eq("status", "pending"),
          supabase
            .from("reports")
            .select("*", { count: "exact", head: true })
            .eq("status", "open"),
          supabase
            .from("listings")
            .select("*", { count: "exact", head: true })
            .in("status", ["active", "published"]),
          supabase
            .from("listings")
            .select("*", { count: "exact", head: true })
            .eq("status", "sold"),
          supabase
            .from("categories")
            .select("*", { count: "exact", head: true }),
        ]);

        if (cancelled) return;

        setStats({
          users: usersResult.count ?? 0,
          listings: listingsResult.count ?? 0,
          pending: pendingResult.count ?? 0,
          reports: reportsResult.count ?? 0,
          published: publishedResult.count ?? 0,
          sold: soldResult.count ?? 0,
          categories: categoriesResult.count ?? 0,
        });

        const { data, error } = await supabase
          .from("listings")
          .select("id,title,slug,status,price,currency,created_at,user_id")
          .order("created_at", { ascending: false })
          .limit(8);

        if (error) {
          console.error("[Admin Dashboard] Erreur annonces récentes :", error);
        }

        if (!cancelled) {
          setRecent((data ?? []) as AdminListing[]);
        }
      } catch (error) {
        console.error("[Admin Dashboard] Erreur :", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const statCards = [
    {
      label: "Utilisateurs",
      value: stats.users,
      icon: <Users className="h-5 w-5" />,
      from: "from-blue-600",
      to: "to-blue-400",
      tab: "users" as Tab,
    },
    {
      label: "Total annonces",
      value: stats.listings,
      icon: <Package className="h-5 w-5" />,
      from: "from-violet-600",
      to: "to-violet-400",
      tab: "listings" as Tab,
    },
    {
      label: "En attente",
      value: stats.pending,
      icon: <TrendingUp className="h-5 w-5" />,
      from: "from-yellow-600",
      to: "to-yellow-400",
      tab: "listings" as Tab,
    },
    {
      label: "Signalements",
      value: stats.reports,
      icon: <AlertTriangle className="h-5 w-5" />,
      from: "from-red-600",
      to: "to-red-400",
      tab: "reports" as Tab,
    },
    {
      label: "Publiées",
      value: stats.published,
      icon: <CheckCircle className="h-5 w-5" />,
      from: "from-emerald-600",
      to: "to-emerald-400",
      tab: "listings" as Tab,
    },
    {
      label: "Vendues",
      value: stats.sold,
      icon: <BarChart3 className="h-5 w-5" />,
      from: "from-orange-600",
      to: "to-orange-400",
      tab: "listings" as Tab,
    },
    {
      label: "Catégories",
      value: stats.categories,
      icon: <Tags className="h-5 w-5" />,
      from: "from-cyan-600",
      to: "to-cyan-400",
      tab: "categories" as Tab,
    },
  ];

  const quickAccess: Array<{
    tab: Tab;
    label: string;
    description: string;
    icon: ReactNode;
  }> = [
    {
      tab: "homepage",
      label: "Modifier l'accueil",
      description: "Titres, textes, CTA et sections.",
      icon: <Home className="h-5 w-5" />,
    },
    {
      tab: "banners",
      label: "Gérer les bannières",
      description: "Campagnes et visuels promotionnels.",
      icon: <Megaphone className="h-5 w-5" />,
    },
    {
      tab: "notifications",
      label: "Envoyer une notification",
      description: "Communications ciblées ou globales.",
      icon: <Bell className="h-5 w-5" />,
    },
    {
      tab: "seo",
      label: "Configurer le SEO",
      description: "Titres, métadonnées et indexation.",
      icon: <Globe className="h-5 w-5" />,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Tableau de bord</h1>
        <p className="mt-1 text-sm text-slate-400">
          Vue globale de la plateforme et accès rapide au CMS Kafoo.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-7">
        {statCards.map((stat) => (
          <button
            type="button"
            key={stat.label}
            onClick={() => setTab(stat.tab)}
            className="group rounded-2xl border border-white/10 bg-slate-800 p-4 text-left transition hover:border-white/20 hover:bg-slate-700"
          >
            <div
              className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.from} ${stat.to} text-white shadow-lg`}
            >
              {stat.icon}
            </div>

            <div className="text-2xl font-black text-white">{stat.value}</div>
            <div className="mt-0.5 text-xs font-semibold text-slate-400">
              {stat.label}
            </div>
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {quickAccess.map((item) => (
          <button
            type="button"
            key={item.tab}
            onClick={() => setTab(item.tab)}
            className="rounded-2xl border border-white/10 bg-slate-900 p-4 text-left transition hover:border-blue-500/30 hover:bg-slate-800"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              {item.icon}
            </div>
            <p className="font-bold text-white">{item.label}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {item.description}
            </p>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-800">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="font-black text-white">Annonces récentes</h2>
          <button
            type="button"
            onClick={() => setTab("listings")}
            className="text-xs font-bold text-blue-400 hover:underline"
          >
            Voir tout
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">Titre</th>
                <th className="px-5 py-3">Statut</th>
                <th className="px-5 py-3">Date</th>
              </tr>
            </thead>

            <tbody>
              {recent.map((listing) => (
                <tr
                  key={listing.id}
                  className="border-b border-white/5 transition hover:bg-white/5"
                >
                  <td className="px-5 py-3">
                    <a
                      href={`/annonces/${listing.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="line-clamp-1 font-semibold text-white hover:text-blue-400 hover:underline"
                    >
                      {listing.title}
                    </a>
                  </td>
                  <td className="px-5 py-3">
                    <Badge status={listing.status} />
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-400">
                    {new Date(listing.created_at).toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && recent.length === 0 && (
            <p className="py-10 text-center text-sm text-slate-500">
              Aucune annonce récente.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   TAB — ANNONCES
════════════════════════════════════════════════════════════ */

function TabListings({ supabase }: { supabase: any }) {
  const [items, setItems] = useState<AdminListing[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadListings() {
      try {
        setLoading(true);

        let query = supabase
          .from("listings")
          .select(
            "id,title,slug,status,price,currency,created_at,user_id,region:regions(name),city:cities(name)",
          )
          .order("created_at", { ascending: false })
          .limit(100);

        if (filter !== "all") {
          query = query.eq("status", filter);
        }

        let { data, error } = await query;

        if (error) {
          console.warn(
            "[Admin Listings] Relations indisponibles, fallback sans jointure :",
            error,
          );

          let fallbackQuery = supabase
            .from("listings")
            .select("id,title,slug,status,price,currency,created_at,user_id")
            .order("created_at", { ascending: false })
            .limit(100);

          if (filter !== "all") {
            fallbackQuery = fallbackQuery.eq("status", filter);
          }

          const fallback = await fallbackQuery;
          data = fallback.data;
          error = fallback.error;
        }

        if (error) {
          toast.error(`Impossible de charger les annonces : ${error.message}`);
          return;
        }

        if (!cancelled) {
          setItems((data ?? []) as AdminListing[]);
        }
      } catch (error) {
        console.error("[Admin Listings] Erreur :", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadListings();

    return () => {
      cancelled = true;
    };
  }, [supabase, filter]);

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("listings")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Statut mis à jour");
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, status } : item)),
    );
  };

  const del = async (id: string) => {
    if (!window.confirm("Supprimer définitivement cette annonce ?")) return;

    const { error } = await supabase.from("listings").delete().eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Annonce supprimée");
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const filtered = items.filter((listing) =>
    listing.title.toLowerCase().includes(search.toLowerCase()),
  );

  const filters = [
    "all",
    "pending",
    "active",
    "published",
    "rejected",
    "suspended",
    "sold",
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-white">Gestion des annonces</h1>
        <p className="mt-1 text-sm text-slate-400">
          {items.length} annonces chargées
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            type="button"
            key={item}
            onClick={() => setFilter(item)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
              filter === item
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
            }`}
          >
            {item === "all" ? "Tout" : STATUS_CFG[item]?.label ?? item}
          </button>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Rechercher une annonce…"
          className="rounded-xl border-white/10 bg-slate-800 pl-9 text-white placeholder:text-slate-500"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3">Titre</th>
              <th className="px-5 py-3">Lieu</th>
              <th className="px-5 py-3">Statut</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((listing) => (
              <tr
                key={listing.id}
                className="border-b border-white/5 transition hover:bg-white/5"
              >
                <td className="max-w-[200px] px-5 py-3">
                  <a
                    href={`/annonces/${listing.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="block line-clamp-1 font-semibold text-white hover:text-blue-400"
                  >
                    {listing.title}
                  </a>
                </td>

                <td className="px-5 py-3 text-xs text-slate-400">
                  {[listing.city?.name, listing.region?.name]
                    .filter(Boolean)
                    .join(", ") || "—"}
                </td>

                <td className="px-5 py-3">
                  <Badge status={listing.status} />
                </td>

                <td className="px-5 py-3 text-xs text-slate-400">
                  {new Date(listing.created_at).toLocaleDateString("fr-FR")}
                </td>

                <td className="px-5 py-3">
                  <div className="flex items-center gap-1">
                    <ActionBtn
                      color="emerald"
                      title="Publier"
                      onClick={() => void setStatus(listing.id, "published")}
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                    </ActionBtn>

                    <ActionBtn
                      color="red"
                      title="Rejeter"
                      onClick={() => void setStatus(listing.id, "rejected")}
                    >
                      <XCircle className="h-3.5 w-3.5" />
                    </ActionBtn>

                    <ActionBtn
                      color="orange"
                      title="Suspendre"
                      onClick={() => void setStatus(listing.id, "suspended")}
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                    </ActionBtn>

                    <ActionBtn
                      color="slate"
                      title="Supprimer"
                      onClick={() => void del(listing.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </ActionBtn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {loading && (
          <p className="py-10 text-center text-sm text-slate-500">
            Chargement des annonces...
          </p>
        )}

        {!loading && filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-500">
            Aucune annonce trouvée.
          </p>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   TAB — UTILISATEURS
════════════════════════════════════════════════════════════ */

function TabUsers({
  supabase,
  currentUserId,
}: {
  supabase: any;
  currentUserId: string;
}) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,user_id,display_name,phone,created_at,is_admin")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        toast.error(`Impossible de charger les utilisateurs : ${error.message}`);
        return;
      }

      if (!cancelled) {
        setUsers((data ?? []) as AdminUser[]);
      }
    }

    void loadUsers();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const toggleAdmin = async (uid: string, current: boolean) => {
    if (uid === currentUserId && current) {
      toast.error(
        "Vous ne pouvez pas retirer vos propres droits administrateur.",
      );
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ is_admin: !current })
      .eq("user_id", uid);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(current ? "Droits admin retirés" : "Droits admin accordés");

    setUsers((currentUsers) =>
      currentUsers.map((item) =>
        item.user_id === uid ? { ...item, is_admin: !current } : item,
      ),
    );
  };

  const del = async (uid: string) => {
    if (uid === currentUserId) {
      toast.error(
        "Vous ne pouvez pas supprimer votre propre compte administrateur.",
      );
      return;
    }

    if (!window.confirm("Supprimer le profil de cet utilisateur ?")) return;

    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("user_id", uid);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Profil utilisateur supprimé");
    setUsers((current) => current.filter((item) => item.user_id !== uid));
  };

  const filtered = users.filter(
    (item) =>
      (item.display_name ?? "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      (item.phone ?? "").includes(search),
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-white">Utilisateurs</h1>
        <p className="mt-1 text-sm text-slate-400">
          {users.length} profils chargés
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Nom ou téléphone…"
          className="rounded-xl border-white/10 bg-slate-800 pl-9 text-white placeholder:text-slate-500"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3">Utilisateur</th>
              <th className="px-5 py-3">Téléphone</th>
              <th className="px-5 py-3">Rôle</th>
              <th className="px-5 py-3">Inscrit le</th>
              <th className="px-5 py-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((item) => (
              <tr
                key={item.id}
                className="border-b border-white/5 transition hover:bg-white/5"
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-fuchsia-500 text-xs font-black text-white">
                      {(item.display_name ?? "?")[0]?.toUpperCase()}
                    </div>

                    <span className="font-semibold text-white">
                      {item.display_name ?? (
                        <span className="italic text-slate-500">Sans nom</span>
                      )}
                    </span>
                  </div>
                </td>

                <td className="px-5 py-3 text-slate-400">
                  {item.phone ?? "—"}
                </td>

                <td className="px-5 py-3">
                  {item.is_admin ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-900/60 px-2.5 py-0.5 text-xs font-bold text-blue-300">
                      <Shield className="h-3 w-3" />
                      Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-700 px-2.5 py-0.5 text-xs font-bold text-slate-300">
                      <UserCheck className="h-3 w-3" />
                      Membre
                    </span>
                  )}
                </td>

                <td className="px-5 py-3 text-xs text-slate-400">
                  {new Date(item.created_at).toLocaleDateString("fr-FR")}
                </td>

                <td className="px-5 py-3">
                  <div className="flex gap-1">
                    <ActionBtn
                      color="blue"
                      title={item.is_admin ? "Retirer admin" : "Passer admin"}
                      onClick={() =>
                        void toggleAdmin(item.user_id, item.is_admin)
                      }
                    >
                      <Shield className="h-3.5 w-3.5" />
                    </ActionBtn>

                    <ActionBtn
                      color="slate"
                      title="Supprimer"
                      onClick={() => void del(item.user_id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </ActionBtn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-500">
            Aucun utilisateur trouvé.
          </p>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   TAB — SIGNALEMENTS
════════════════════════════════════════════════════════════ */

function TabReports({ supabase }: { supabase: any }) {
  const [reports, setReports] = useState<AdminReport[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadReports() {
      let { data, error } = await supabase
        .from("reports")
        .select("id,reason,status,created_at,listing:listings(title,slug)")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        const fallback = await supabase
          .from("reports")
          .select("id,reason,status,created_at")
          .order("created_at", { ascending: false })
          .limit(100);

        data = fallback.data;
        error = fallback.error;
      }

      if (error) {
        toast.error(`Impossible de charger les signalements : ${error.message}`);
        return;
      }

      if (!cancelled) {
        setReports((data ?? []) as AdminReport[]);
      }
    }

    void loadReports();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const resolve = async (id: string) => {
    const { error } = await supabase
      .from("reports")
      .update({ status: "resolved" })
      .eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Signalement résolu");
    setReports((current) =>
      current.map((item) =>
        item.id === id ? { ...item, status: "resolved" } : item,
      ),
    );
  };

  const del = async (id: string) => {
    const { error } = await supabase.from("reports").delete().eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Signalement supprimé");
    setReports((current) => current.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-white">Signalements</h1>
        <p className="mt-1 text-sm text-slate-400">
          {reports.filter((item) => item.status === "open").length} ouverts
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3">Annonce</th>
              <th className="px-5 py-3">Raison</th>
              <th className="px-5 py-3">Statut</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {reports.map((report) => (
              <tr
                key={report.id}
                className="border-b border-white/5 transition hover:bg-white/5"
              >
                <td className="max-w-[180px] px-5 py-3">
                  {report.listing ? (
                    <a
                      href={`/annonces/${report.listing.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="block line-clamp-1 font-semibold text-white hover:text-blue-400"
                    >
                      {report.listing.title}
                    </a>
                  ) : (
                    <span className="italic text-slate-500">
                      Annonce indisponible
                    </span>
                  )}
                </td>

                <td className="max-w-[160px] px-5 py-3 text-slate-300">
                  <span className="line-clamp-2">{report.reason}</span>
                </td>

                <td className="px-5 py-3">
                  <Badge status={report.status} />
                </td>

                <td className="px-5 py-3 text-xs text-slate-400">
                  {new Date(report.created_at).toLocaleDateString("fr-FR")}
                </td>

                <td className="px-5 py-3">
                  <div className="flex gap-1">
                    {report.status === "open" && (
                      <ActionBtn
                        color="emerald"
                        title="Résoudre"
                        onClick={() => void resolve(report.id)}
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                      </ActionBtn>
                    )}

                    <ActionBtn
                      color="slate"
                      title="Supprimer"
                      onClick={() => void del(report.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </ActionBtn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {reports.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-500">
            Aucun signalement.
          </p>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   TAB — CATÉGORIES
════════════════════════════════════════════════════════════ */

function TabCategories({ supabase }: { supabase: any }) {
  const [cats, setCats] = useState<AdminCategory[]>([]);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newIcon, setNewIcon] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      const { data, error } = await supabase
        .from("categories")
        .select("id,name,slug,icon,is_active,sort_order")
        .is("parent_id", null)
        .order("sort_order");

      if (error) {
        toast.error(`Impossible de charger les catégories : ${error.message}`);
        return;
      }

      if (!cancelled) {
        setCats((data ?? []) as AdminCategory[]);
      }
    }

    void loadCategories();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const add = async () => {
    const name = newName.trim();
    const slug = newSlug.trim().toLowerCase();

    if (!name || !slug) {
      toast.error("Nom et slug requis");
      return;
    }

    const { data, error } = await supabase
      .from("categories")
      .insert({
        name,
        slug,
        icon: newIcon.trim() || null,
        is_active: true,
        sort_order: cats.length + 1,
      })
      .select()
      .single();

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Catégorie ajoutée");
    setCats((current) => [...current, data as AdminCategory]);
    setNewName("");
    setNewSlug("");
    setNewIcon("");
  };

  const toggle = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from("categories")
      .update({ is_active: !current })
      .eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Catégorie mise à jour");
    setCats((currentCategories) =>
      currentCategories.map((item) =>
        item.id === id ? { ...item, is_active: !current } : item,
      ),
    );
  };

  const del = async (id: string) => {
    if (!window.confirm("Supprimer cette catégorie ?")) return;

    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Catégorie supprimée");
    setCats((current) => current.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-white">Catégories</h1>
        <p className="mt-1 text-sm text-slate-400">
          {cats.length} catégories principales
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-800 p-5">
        <h2 className="mb-4 font-black text-white">Ajouter une catégorie</h2>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-400">
              Nom
            </label>
            <Input
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="ex : Électronique"
              className="rounded-xl border-white/10 bg-slate-700 text-white placeholder:text-slate-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-slate-400">
              Slug
            </label>
            <Input
              value={newSlug}
              onChange={(event) => setNewSlug(event.target.value)}
              placeholder="ex : electronique"
              className="rounded-xl border-white/10 bg-slate-700 text-white placeholder:text-slate-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-slate-400">
              Icône
            </label>
            <Input
              value={newIcon}
              onChange={(event) => setNewIcon(event.target.value)}
              placeholder="ex : smartphone"
              className="rounded-xl border-white/10 bg-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
        </div>

        <Button
          type="button"
          onClick={() => void add()}
          className="mt-4 rounded-full bg-blue-600 px-6 font-bold text-white hover:bg-blue-700"
        >
          Ajouter
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3">Nom</th>
              <th className="px-5 py-3">Slug</th>
              <th className="px-5 py-3">Icône</th>
              <th className="px-5 py-3">Statut</th>
              <th className="px-5 py-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {cats.map((category) => (
              <tr
                key={category.id}
                className="border-b border-white/5 transition hover:bg-white/5"
              >
                <td className="px-5 py-3 font-semibold text-white">
                  {category.name}
                </td>
                <td className="px-5 py-3 font-mono text-xs text-slate-400">
                  {category.slug}
                </td>
                <td className="px-5 py-3 text-slate-400">
                  {category.icon ?? "—"}
                </td>
                <td className="px-5 py-3">
                  <Badge
                    status={category.is_active ? "published" : "suspended"}
                  />
                </td>
                <td className="px-5 py-3">
                  <div className="flex gap-1">
                    <ActionBtn
                      color={category.is_active ? "orange" : "emerald"}
                      title={category.is_active ? "Désactiver" : "Activer"}
                      onClick={() =>
                        void toggle(category.id, category.is_active)
                      }
                    >
                      {category.is_active ? (
                        <XCircle className="h-3.5 w-3.5" />
                      ) : (
                        <CheckCircle className="h-3.5 w-3.5" />
                      )}
                    </ActionBtn>

                    <ActionBtn
                      color="slate"
                      title="Supprimer"
                      onClick={() => void del(category.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </ActionBtn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   TAB — LOCALISATION
════════════════════════════════════════════════════════════ */

function TabLocations({ supabase }: { supabase: any }) {
  const [regions, setRegions] = useState<LocationRow[]>([]);
  const [cities, setCities] = useState<LocationRow[]>([]);
  const [communes, setCommunes] = useState<LocationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadLocations() {
      try {
        setLoading(true);

        const [regionsResult, citiesResult, communesResult] = await Promise.all([
          supabase.from("regions").select("id,name,slug").order("name"),
          supabase.from("cities").select("id,name,slug").order("name"),
          supabase.from("communes").select("id,name,slug").order("name"),
        ]);

        if (cancelled) return;

        setRegions((regionsResult.data ?? []) as LocationRow[]);
        setCities((citiesResult.data ?? []) as LocationRow[]);
        setCommunes((communesResult.data ?? []) as LocationRow[]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadLocations();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const groups = [
    { label: "Régions", rows: regions },
    { label: "Villes", rows: cities },
    { label: "Communes", rows: communes },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-white">Localisation</h1>
        <p className="mt-1 text-sm text-slate-400">
          Gérez les zones utilisées dans la publication et la recherche
          d'annonces.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {groups.map((group) => (
          <div
            key={group.label}
            className="rounded-2xl border border-white/10 bg-slate-800"
          >
            <div className="border-b border-white/10 px-5 py-4">
              <p className="font-black text-white">{group.label}</p>
              <p className="mt-1 text-xs text-slate-500">
                {group.rows.length} éléments
              </p>
            </div>

            <div className="max-h-[420px] overflow-y-auto p-2">
              {group.rows.slice(0, 100).map((row) => (
                <div
                  key={row.id}
                  className="rounded-xl px-3 py-2.5 transition hover:bg-white/5"
                >
                  <p className="text-sm font-semibold text-white">{row.name}</p>
                  {row.slug && (
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {row.slug}
                    </p>
                  )}
                </div>
              ))}

              {!loading && group.rows.length === 0 && (
                <p className="py-8 text-center text-xs text-slate-500">
                  Aucun élément.
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   CMS — PAGE D'ACCUEIL
════════════════════════════════════════════════════════════ */

function TabHomepageCms() {
  const [heroTitle, setHeroTitle] = useState(
    "Vendez et trouvez vos bonnes affaires près de chez vous",
  );
  const [heroSubtitle, setHeroSubtitle] = useState(
    "Publiez gratuitement et échangez directement avec les acheteurs partout en Guinée.",
  );
  const [primaryCta, setPrimaryCta] = useState("Publier une annonce");
  const [secondaryCta, setSecondaryCta] = useState("Explorer les annonces");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await new Promise((resolve) => window.setTimeout(resolve, 500));
    setSaving(false);
    toast.success(
      "Interface CMS prête. Connectez ensuite ces champs à une table cms_homepage ou settings pour rendre les modifications persistantes.",
    );
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Page d'accueil</h1>
        <p className="mt-1 text-sm text-slate-400">
          Préparez les contenus éditoriaux du hero et des principales sections
          du site.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-800 p-5">
        <div className="mb-5">
          <h2 className="font-black text-white">Hero principal</h2>
          <p className="mt-1 text-xs text-slate-500">
            Zone principale visible en haut de la page d'accueil.
          </p>
        </div>

        <div className="grid gap-4">
          <CmsField
            label="Titre principal"
            value={heroTitle}
            onChange={setHeroTitle}
          />
          <CmsTextarea
            label="Sous-titre"
            value={heroSubtitle}
            onChange={setHeroSubtitle}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <CmsField
              label="Bouton principal"
              value={primaryCta}
              onChange={setPrimaryCta}
            />
            <CmsField
              label="Bouton secondaire"
              value={secondaryCta}
              onChange={setSecondaryCta}
            />
          </div>
        </div>

        <Button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="mt-5 rounded-xl bg-blue-600 px-6 font-bold text-white hover:bg-blue-700"
        >
          {saving ? "Enregistrement…" : "Enregistrer le contenu"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <CmsSectionCard
          title="Catégories populaires"
          description="Choisir les catégories mises en avant et leur ordre."
        />
        <CmsSectionCard
          title="Annonces à la une"
          description="Sélectionner les annonces prioritaires de la page d'accueil."
        />
        <CmsSectionCard
          title="Statistiques"
          description="Configurer les chiffres clés affichés aux visiteurs."
        />
        <CmsSectionCard
          title="Bloc promotionnel"
          description="Créer une section éditoriale ou commerciale personnalisée."
        />
      </div>
    </div>
  );
}

function CmsField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold text-slate-400">
        {label}
      </label>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl border-white/10 bg-slate-700 text-white"
      />
    </div>
  );
}

function CmsTextarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold text-slate-400">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className="w-full resize-none rounded-xl border border-white/10 bg-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
      />
    </div>
  );
}

function CmsSectionCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-800 p-5">
      <p className="font-black text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      <Button
        type="button"
        className="mt-4 rounded-xl bg-slate-700 text-slate-200 hover:bg-slate-600"
      >
        Configurer
      </Button>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   TAB — SEO
════════════════════════════════════════════════════════════ */

function TabSeo() {
  const [siteTitle, setSiteTitle] = useState("Kafoo — Petites annonces");
  const [metaDescription, setMetaDescription] = useState(
    "Achetez et vendez facilement près de chez vous en Guinée.",
  );
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await new Promise((resolve) => window.setTimeout(resolve, 500));
    setSaving(false);
    toast.success(
      "Configuration SEO prête. Connectez ces valeurs à la table settings pour les rendre persistantes.",
    );
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">SEO</h1>
        <p className="mt-1 text-sm text-slate-400">
          Préparez les métadonnées principales de la plateforme.
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border border-white/10 bg-slate-800 p-5">
        <CmsField
          label="Titre du site"
          value={siteTitle}
          onChange={setSiteTitle}
        />
        <CmsTextarea
          label="Meta description"
          value={metaDescription}
          onChange={setMetaDescription}
        />

        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
          <p className="text-xs font-black uppercase tracking-wider text-blue-300">
            Aperçu
          </p>
          <p className="mt-2 text-lg font-semibold text-blue-400">{siteTitle}</p>
          <p className="mt-1 text-sm leading-6 text-slate-400">
            {metaDescription}
          </p>
        </div>

        <Button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="rounded-xl bg-blue-600 px-6 font-bold text-white hover:bg-blue-700"
        >
          {saving ? "Enregistrement…" : "Enregistrer le SEO"}
        </Button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   TAB — PARAMÈTRES
════════════════════════════════════════════════════════════ */

function TabSettings({ user }: { user: any }) {
  const [siteName, setSiteName] = useState("Kafoo");
  const [siteDesc, setSiteDesc] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [currency, setCurrency] = useState("GNF");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    try {
      setSaving(true);
      await new Promise((resolve) => window.setTimeout(resolve, 600));
      toast.success(
        "Interface de paramètres prête. Connectez ensuite ces champs à la table settings pour rendre les changements persistants.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Paramètres</h1>
        <p className="mt-1 text-sm text-slate-400">
          Configuration générale de la plateforme.
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border border-white/10 bg-slate-800 p-5">
        <h2 className="font-black text-white">Général</h2>

        <CmsField label="Nom du site" value={siteName} onChange={setSiteName} />
        <CmsTextarea
          label="Description"
          value={siteDesc}
          onChange={setSiteDesc}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <CmsField
            label="E-mail support"
            value={supportEmail}
            onChange={setSupportEmail}
          />
          <CmsField
            label="Devise par défaut"
            value={currency}
            onChange={setCurrency}
          />
        </div>

        <Button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="rounded-full bg-blue-600 px-6 font-bold text-white hover:bg-blue-700"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>

      <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-800 p-5">
        <h2 className="font-black text-white">Compte admin</h2>

        <p className="text-sm text-slate-400">
          Connecté en tant que{" "}
          <span className="font-bold text-white">{user?.email}</span>
        </p>

        <div className="flex items-center gap-2 rounded-xl border border-emerald-700/30 bg-emerald-900/30 px-4 py-3">
          <Shield className="h-4 w-4 shrink-0 text-emerald-400" />
          <span className="text-sm font-bold text-emerald-300">
            Accès administrateur actif
          </span>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MODULES CMS / BACK-OFFICE À CONNECTER
════════════════════════════════════════════════════════════ */

function ModulePlaceholder({
  title,
  description,
  icon,
  features,
  tables,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  features: string[];
  tables: string[];
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">{title}</h1>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">
          {description}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-white/10 bg-slate-800 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
            {icon}
          </div>

          <h2 className="mt-5 font-black text-white">Fonctionnalités prévues</h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature}
                className="flex items-start gap-3 rounded-xl bg-slate-900/70 p-3"
              >
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <span className="text-sm text-slate-300">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
          <p className="text-xs font-black uppercase tracking-wider text-slate-500">
            Connexion Supabase
          </p>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            Ce module est intégré à l'administration. Pour activer la gestion
            complète, créez ou confirmez les tables ci-dessous et leurs règles
            RLS.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {tables.map((table) => (
              <span
                key={table}
                className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-300"
              >
                {table}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   BOUTONS D'ACTION
════════════════════════════════════════════════════════════ */

const COLOR_MAP: Record<string, string> = {
  emerald:
    "bg-emerald-900/40 text-emerald-400 hover:bg-emerald-800/60 border-emerald-700/30",
  red: "bg-red-900/40 text-red-400 hover:bg-red-800/60 border-red-700/30",
  orange:
    "bg-orange-900/40 text-orange-400 hover:bg-orange-800/60 border-orange-700/30",
  blue: "bg-blue-900/40 text-blue-400 hover:bg-blue-800/60 border-blue-700/30",
  slate:
    "bg-slate-700/60 text-slate-400 hover:bg-slate-600/60 border-slate-600/30",
  violet:
    "bg-violet-900/40 text-violet-400 hover:bg-violet-800/60 border-violet-700/30",
};

function ActionBtn({
  color,
  title,
  onClick,
  children,
}: {
  color: string;
  title: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border text-xs transition ${
        COLOR_MAP[color] ?? COLOR_MAP.slate
      }`}
    >
      {children}
    </button>
  );
}
'''

out = Path("/mnt/data/admin_enrichi.tsx")
out.write_text(code, encoding="utf-8")
print(f"Fichier créé : {out}")
print(f"Lignes : {len(code.splitlines())}")

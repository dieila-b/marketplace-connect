import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Eye,
  EyeOff,
  FileText,
  LayoutDashboard,
  LogOut,
  Package,
  Search,
  Settings,
  Shield,
  Trash2,
  TrendingUp,
  UserCheck,
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
      {
        title: "Administration — Kafoo",
      },
      {
        name: "robots",
        content: "noindex,nofollow",
      },
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

  region?: {
    name: string;
  } | null;

  city?: {
    name: string;
  } | null;
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

  listing?: {
    title: string;
    slug: string;
  } | null;
};

type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  is_active: boolean;
  sort_order: number;
};

type Tab =
  | "dashboard"
  | "listings"
  | "users"
  | "reports"
  | "categories"
  | "settings";

/* ════════════════════════════════════════════════════════════
   STATUTS
════════════════════════════════════════════════════════════ */

const STATUS_CFG: Record<
  string,
  {
    label: string;
    color: string;
    bg: string;
  }
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

function Badge({
  status,
}: {
  status: string;
}) {
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
   PAGE PRINCIPALE ADMIN
════════════════════════════════════════════════════════════ */

async function getAdminAccess(
  supabase: any,
  userId: string,
): Promise<{
  isAdmin: boolean;
  error: string | null;
}> {
  /*
   * Schéma principal attendu :
   *
   * public.profiles
   * - user_id
   * - is_admin
   *
   * Un fallback sur profiles.id est conservé pour les projets
   * où l'identifiant du profil correspond directement à auth.users.id.
   */

  const byUserId = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("user_id", userId)
    .maybeSingle();

  if (!byUserId.error && byUserId.data) {
    return {
      isAdmin: byUserId.data.is_admin === true,
      error: null,
    };
  }

  /*
   * Si aucun profil n'est trouvé via user_id, on tente id.
   * Cela rend la page compatible avec les deux structures courantes.
   */
  const byId = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();

  if (!byId.error && byId.data) {
    return {
      isAdmin: byId.data.is_admin === true,
      error: null,
    };
  }

  const technicalError =
    byUserId.error?.message ||
    byId.error?.message ||
    null;

  if (technicalError) {
    return {
      isAdmin: false,
      error: `Impossible de vérifier le rôle administrateur : ${technicalError}`,
    };
  }

  return {
    isAdmin: false,
    error:
      "Aucun profil correspondant à ce compte n'a été trouvé dans public.profiles.",
  };
}

function AdminPage() {
  const {
    supabase,
    user,
    loading,
  } = useSupabase();

  const navigate = useNavigate();

  const [tab, setTab] =
    useState<Tab>("dashboard");

  const [checkingAccess, setCheckingAccess] =
    useState(true);

  const [authorized, setAuthorized] =
    useState(false);

  const [accessError, setAccessError] =
    useState("");

  /*
   * Vérification réelle du rôle administrateur.
   *
   * On ne dépend pas uniquement de la valeur isAdmin du provider :
   * la colonne profiles.is_admin est vérifiée directement dans Supabase.
   */
  useEffect(() => {
    let cancelled = false;

    async function verifyAdminAccess() {
      if (loading) {
        return;
      }

      if (!user) {
        if (!cancelled) {
          setAuthorized(false);
          setCheckingAccess(false);
          setAccessError("");
        }

        return;
      }

      if (!cancelled) {
        setCheckingAccess(true);
        setAccessError("");
      }

      try {
        const access = await getAdminAccess(
          supabase,
          user.id,
        );

        if (cancelled) {
          return;
        }

        setAuthorized(access.isAdmin);

        if (!access.isAdmin) {
          setAccessError(
            access.error ||
              "Votre compte ne possède pas les droits administrateur.",
          );
        } else {
          setAccessError("");
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        const err =
          error instanceof Error
            ? error
            : new Error(
                "Erreur inconnue.",
              );

        console.error(
          "[Admin] Erreur de vérification :",
          err,
        );

        setAuthorized(false);

        setAccessError(
          "Une erreur est survenue pendant la vérification de vos droits administrateur.",
        );
      } finally {
        if (!cancelled) {
          setCheckingAccess(false);
        }
      }
    }

    void verifyAdminAccess();

    return () => {
      cancelled = true;
    };
  }, [
    loading,
    user,
    supabase,
  ]);

  /*
   * Chargement initial de la session Supabase.
   */
  if (loading) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />

        <p className="mt-4 text-sm font-semibold text-slate-400">
          Chargement de la session...
        </p>
      </div>
    );
  }

  /*
   * Aucun utilisateur connecté :
   * /admin affiche directement le formulaire de connexion administrateur.
   */
  if (!user) {
    return (
      <AdminLogin
        supabase={supabase}
      />
    );
  }

  /*
   * Utilisateur connecté :
   * pendant la vérification du rôle, on affiche un écran de chargement.
   */
  if (checkingAccess) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />

        <p className="mt-4 text-sm font-semibold text-slate-400">
          Vérification de vos droits administrateur...
        </p>
      </div>
    );
  }

  /*
   * Utilisateur connecté mais non administrateur.
   */
  if (!authorized) {
    return (
      <AdminAccessDenied
        title="Accès refusé"
        message={
          accessError ||
          "Vous ne disposez pas des droits nécessaires pour accéder à l'administration."
        }
        onBack={() =>
          navigate({
            to: "/",
            replace: true,
          })
        }
        onLogout={async () => {
          await supabase.auth.signOut();
          window.location.replace("/admin");
        }}
      />
    );
  }

  const NAV: {
    id: Tab;
    label: string;
    icon: ReactNode;
    color: string;
  }[] = [
    {
      id: "dashboard",
      label: "Tableau de bord",
      icon: (
        <LayoutDashboard className="h-4 w-4" />
      ),
      color: "text-blue-400",
    },
    {
      id: "listings",
      label: "Annonces",
      icon: (
        <Package className="h-4 w-4" />
      ),
      color: "text-violet-400",
    },
    {
      id: "users",
      label: "Utilisateurs",
      icon: (
        <Users className="h-4 w-4" />
      ),
      color: "text-emerald-400",
    },
    {
      id: "reports",
      label: "Signalements",
      icon: (
        <AlertTriangle className="h-4 w-4" />
      ),
      color: "text-red-400",
    },
    {
      id: "categories",
      label: "Catégories",
      icon: (
        <FileText className="h-4 w-4" />
      ),
      color: "text-orange-400",
    },
    {
      id: "settings",
      label: "Paramètres",
      icon: (
        <Settings className="h-4 w-4" />
      ),
      color: "text-slate-400",
    },
  ];

  const handleLogout =
    async () => {
      try {
        const {
          error,
        } =
          await supabase.auth.signOut();

        if (error) {
          toast.error(
            error.message,
          );

          return;
        }

        /*
         * Après déconnexion, on revient sur /admin afin
         * d'afficher directement le formulaire de connexion admin.
         */
        window.location.replace(
          "/admin",
        );
      } catch (error) {
        console.error(
          "[Admin] Erreur déconnexion :",
          error,
        );

        toast.error(
          "Impossible de vous déconnecter.",
        );
      }
    };

  return (
    <div className="fixed inset-0 z-[9999] flex overflow-hidden bg-slate-950 text-white">
      {/* SIDEBAR */}

      <aside className="hidden w-60 shrink-0 flex-col border-r border-white/10 bg-slate-900 lg:flex">
        {/* Logo */}

        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-fuchsia-500">
            <Shield className="h-5 w-5 text-white" />
          </div>

          <div>
            <p className="font-black text-white">
              Kafoo
            </p>

            <p className="text-[10px] uppercase tracking-widest text-slate-400">
              Administration
            </p>
          </div>
        </div>

        {/* Navigation */}

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV.map(
            (item) => (
              <button
                type="button"
                key={item.id}
                onClick={() =>
                  setTab(
                    item.id,
                  )
                }
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  tab ===
                  item.id
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span
                  className={
                    tab ===
                    item.id
                      ? "text-white"
                      : item.color
                  }
                >
                  {
                    item.icon
                  }
                </span>

                {
                  item.label
                }
              </button>
            ),
          )}
        </nav>

        {/* Compte connecté */}

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-fuchsia-500 text-xs font-black">
              {user.email?.[0]?.toUpperCase() ??
                "A"}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-white">
                {
                  user.email
                }
              </p>

              <p className="text-[10px] font-semibold text-emerald-400">
                Administrateur
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void handleLogout()
              }
              title="Se déconnecter"
              className="text-slate-400 transition hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* CONTENU PRINCIPAL */}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Topbar mobile */}

        <header className="shrink-0 border-b border-white/10 bg-slate-900 lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-400" />

              <span className="font-black text-white">
                Admin Kafoo
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                void handleLogout()
              }
              className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
              title="Se déconnecter"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          <div className="flex overflow-x-auto border-t border-white/5 px-2 py-2">
            {NAV.map(
              (item) => (
                <button
                  type="button"
                  key={
                    item.id
                  }
                  onClick={() =>
                    setTab(
                      item.id,
                    )
                  }
                  title={
                    item.label
                  }
                  className={`mx-0.5 shrink-0 rounded-lg p-2.5 transition ${
                    tab ===
                    item.id
                      ? "bg-white/10 text-white"
                      : "text-slate-400 hover:bg-white/5"
                  }`}
                >
                  {
                    item.icon
                  }
                </button>
              ),
            )}
          </div>
        </header>

        {/* Contenu */}

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {tab ===
            "dashboard" && (
            <TabDashboard
              supabase={
                supabase
              }
              setTab={
                setTab
              }
            />
          )}

          {tab ===
            "listings" && (
            <TabListings
              supabase={
                supabase
              }
            />
          )}

          {tab ===
            "users" && (
            <TabUsers
              supabase={
                supabase
              }
              currentUserId={
                user.id
              }
            />
          )}

          {tab ===
            "reports" && (
            <TabReports
              supabase={
                supabase
              }
            />
          )}

          {tab ===
            "categories" && (
            <TabCategories
              supabase={
                supabase
              }
            />
          )}

          {tab ===
            "settings" && (
            <TabSettings
              user={
                user
              }
            />
          )}
        </main>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   CONNEXION ADMINISTRATEUR
════════════════════════════════════════════════════════════ */

function AdminLogin({
  supabase,
}: {
  supabase: any;
}) {
  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const handleLogin =
    async (
      event: FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();

      const cleanEmail =
        email
          .trim()
          .toLowerCase();

      if (
        !cleanEmail ||
        !password
      ) {
        setErrorMessage(
          "Veuillez renseigner votre adresse e-mail et votre mot de passe.",
        );

        return;
      }

      try {
        setSubmitting(
          true,
        );

        setErrorMessage(
          "",
        );

        /*
         * 1. Authentification Supabase.
         */
        const {
          data,
          error,
        } =
          await supabase.auth.signInWithPassword({
            email:
              cleanEmail,
            password,
          });

        if (
          error
        ) {
          console.error(
            "[Admin Login] Erreur de connexion :",
            error,
          );

          const message =
            error.message ===
              "Invalid login credentials"
              ? "Adresse e-mail ou mot de passe incorrect."
              : error.message;

          setErrorMessage(
            message,
          );

          return;
        }

        if (
          !data?.user
        ) {
          setErrorMessage(
            "Impossible de récupérer le compte utilisateur après la connexion.",
          );

          return;
        }

        /*
         * 2. Vérification du rôle administrateur.
         */
        const access =
          await getAdminAccess(
            supabase,
            data.user.id,
          );

        if (
          !access.isAdmin
        ) {
          /*
           * Le compte est valide mais n'est pas admin :
           * on ferme immédiatement sa session.
           */
          await supabase.auth.signOut();

          setErrorMessage(
            access.error ||
              "Ce compte ne possède pas les droits administrateur.",
          );

          return;
        }

        /*
         * 3. Connexion admin validée.
         */
        toast.success(
          "Connexion administrateur réussie.",
        );

        /*
         * Recharge complète afin que le SupabaseProvider
         * récupère immédiatement la nouvelle session.
         */
        window.location.replace(
          "/admin",
        );
      } catch (error) {
        console.error(
          "[Admin Login] Erreur inattendue :",
          error,
        );

        setErrorMessage(
          "Une erreur est survenue pendant la connexion. Veuillez réessayer.",
        );
      } finally {
        setSubmitting(
          false,
        );
      }
    };

  return (
    /*
     * fixed + z-[9999] permet à /admin de recouvrir complètement
     * le header/navigation du site public même si celui-ci est rendu
     * par un layout parent.
     */
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-950">
      <div className="flex min-h-full items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {/* Logo */}

          <div className="mb-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 shadow-xl shadow-blue-950/40">
              <Shield className="h-8 w-8 text-white" />
            </div>

            <h1 className="mt-5 text-3xl font-black text-white">
              Administration Kafoo
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Connectez-vous avec votre compte administrateur pour accéder au tableau de bord.
            </p>
          </div>

          {/* Formulaire */}

          <div className="rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl sm:p-8">
            <form
              onSubmit={
                handleLogin
              }
              className="space-y-5"
            >
              {/* Email */}

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
                  inputMode="email"
                  value={
                    email
                  }
                  onChange={(
                    event,
                  ) =>
                    setEmail(
                      event
                        .target
                        .value,
                    )
                  }
                  placeholder="admin@kafoo.com"
                  disabled={
                    submitting
                  }
                  required
                  className="h-12 rounded-xl border-white/10 bg-slate-800 px-4 text-white placeholder:text-slate-500 focus:border-blue-500"
                />
              </div>

              {/* Mot de passe */}

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
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    autoComplete="current-password"
                    value={
                      password
                    }
                    onChange={(
                      event,
                    ) =>
                      setPassword(
                        event
                          .target
                          .value,
                      )
                    }
                    placeholder="Votre mot de passe"
                    disabled={
                      submitting
                    }
                    required
                    className="h-12 rounded-xl border-white/10 bg-slate-800 px-4 pr-12 text-white placeholder:text-slate-500 focus:border-blue-500"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (
                          current,
                        ) =>
                          !current,
                      )
                    }
                    title={
                      showPassword
                        ? "Masquer le mot de passe"
                        : "Afficher le mot de passe"
                    }
                    aria-label={
                      showPassword
                        ? "Masquer le mot de passe"
                        : "Afficher le mot de passe"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-white"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Message d'erreur */}

              {errorMessage && (
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />

                  <p className="text-sm font-medium leading-5 text-red-300">
                    {
                      errorMessage
                    }
                  </p>
                </div>
              )}

              {/* Bouton connexion */}

              <Button
                type="submit"
                disabled={
                  submitting
                }
                className="h-12 w-full rounded-xl bg-blue-600 text-sm font-black text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? "Connexion en cours..."
                  : "Se connecter"}
              </Button>
            </form>

            <div className="mt-6 border-t border-white/10 pt-5">
              <div className="flex items-center justify-center gap-2 text-center text-xs text-slate-500">
                <Shield className="h-3.5 w-3.5 shrink-0" />

                <span>
                  Accès strictement réservé aux administrateurs autorisés
                </span>
              </div>
            </div>
          </div>

          {/* Retour au site */}

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() =>
                window.location.replace(
                  "/",
                )
              }
              className="text-sm font-semibold text-slate-400 transition hover:text-white"
            >
              ← Retour au site Kafoo
            </button>
          </div>
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
  onLogout?: () => void | Promise<void>;
}) {
  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-950">
      <div className="flex min-h-full items-center justify-center p-5">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-7 text-center shadow-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10">
            <Shield className="h-7 w-7 text-red-400" />
          </div>

          <h1 className="mt-5 text-2xl font-black text-white">
            {title}
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            {message}
          </p>

          {onLogout && (
            <Button
              type="button"
              onClick={() =>
                void onLogout()
              }
              className="mt-6 w-full rounded-xl bg-blue-600 font-bold text-white hover:bg-blue-700"
            >
              Se déconnecter et changer de compte
            </Button>
          )}

          <button
            type="button"
            onClick={
              onBack
            }
            className={`${onLogout ? "mt-3" : "mt-6"} w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm font-bold text-slate-300 transition hover:bg-slate-700 hover:text-white`}
          >
            Retour au site
          </button>
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
  setTab: (
    tab: Tab,
  ) => void;
}) {
  const [
    stats,
    setStats,
  ] = useState({
    users: 0,
    listings: 0,
    pending: 0,
    reports: 0,
    published: 0,
    sold: 0,
  });

  const [
    recent,
    setRecent,
  ] = useState<
    AdminListing[]
  >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  useEffect(() => {
    let cancelled =
      false;

    async function loadDashboard() {
      try {
        setLoading(
          true,
        );

        const [
          usersResult,
          listingsResult,
          pendingResult,
          reportsResult,
          publishedResult,
          soldResult,
        ] =
          await Promise.all([
            supabase
              .from(
                "profiles",
              )
              .select(
                "*",
                {
                  count:
                    "exact",
                  head: true,
                },
              ),

            supabase
              .from(
                "listings",
              )
              .select(
                "*",
                {
                  count:
                    "exact",
                  head: true,
                },
              ),

            supabase
              .from(
                "listings",
              )
              .select(
                "*",
                {
                  count:
                    "exact",
                  head: true,
                },
              )
              .eq(
                "status",
                "pending",
              ),

            supabase
              .from(
                "reports",
              )
              .select(
                "*",
                {
                  count:
                    "exact",
                  head: true,
                },
              )
              .eq(
                "status",
                "open",
              ),

            supabase
              .from(
                "listings",
              )
              .select(
                "*",
                {
                  count:
                    "exact",
                  head: true,
                },
              )
              .in(
                "status",
                [
                  "active",
                  "published",
                ],
              ),

            supabase
              .from(
                "listings",
              )
              .select(
                "*",
                {
                  count:
                    "exact",
                  head: true,
                },
              )
              .eq(
                "status",
                "sold",
              ),
          ]);

        if (
          cancelled
        ) {
          return;
        }

        setStats({
          users:
            usersResult.count ??
            0,

          listings:
            listingsResult.count ??
            0,

          pending:
            pendingResult.count ??
            0,

          reports:
            reportsResult.count ??
            0,

          published:
            publishedResult.count ??
            0,

          sold:
            soldResult.count ??
            0,
        });

        const {
          data,
          error,
        } =
          await supabase
            .from(
              "listings",
            )
            .select(
              "id,title,slug,status,price,currency,created_at,user_id",
            )
            .order(
              "created_at",
              {
                ascending:
                  false,
              },
            )
            .limit(8);

        if (
          error
        ) {
          console.error(
            "[Admin Dashboard] Erreur annonces récentes :",
            error,
          );
        }

        if (
          !cancelled
        ) {
          setRecent(
            (data ??
              []) as AdminListing[],
          );
        }
      } catch (error) {
        console.error(
          "[Admin Dashboard] Erreur :",
          error,
        );
      } finally {
        if (
          !cancelled
        ) {
          setLoading(
            false,
          );
        }
      }
    }

    void loadDashboard();

    return () => {
      cancelled =
        true;
    };
  }, [
    supabase,
  ]);

  const STAT_CARDS = [
    {
      label:
        "Utilisateurs",
      value:
        stats.users,
      icon: (
        <Users className="h-5 w-5" />
      ),
      from:
        "from-blue-600",
      to:
        "to-blue-400",
      tab:
        "users" as Tab,
    },

    {
      label:
        "Total annonces",
      value:
        stats.listings,
      icon: (
        <Package className="h-5 w-5" />
      ),
      from:
        "from-violet-600",
      to:
        "to-violet-400",
      tab:
        "listings" as Tab,
    },

    {
      label:
        "En attente",
      value:
        stats.pending,
      icon: (
        <TrendingUp className="h-5 w-5" />
      ),
      from:
        "from-yellow-600",
      to:
        "to-yellow-400",
      tab:
        "listings" as Tab,
    },

    {
      label:
        "Signalements",
      value:
        stats.reports,
      icon: (
        <AlertTriangle className="h-5 w-5" />
      ),
      from:
        "from-red-600",
      to:
        "to-red-400",
      tab:
        "reports" as Tab,
    },

    {
      label:
        "Publiées",
      value:
        stats.published,
      icon: (
        <CheckCircle className="h-5 w-5" />
      ),
      from:
        "from-emerald-600",
      to:
        "to-emerald-400",
      tab:
        "listings" as Tab,
    },

    {
      label:
        "Vendues",
      value:
        stats.sold,
      icon: (
        <BarChart3 className="h-5 w-5" />
      ),
      from:
        "from-orange-600",
      to:
        "to-orange-400",
      tab:
        "listings" as Tab,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">
          Tableau de bord
        </h1>

        <p className="mt-1 text-sm text-slate-400">
          Vue d'ensemble de la plateforme
          Kafoo
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {STAT_CARDS.map(
          (stat) => (
            <button
              type="button"
              key={
                stat.label
              }
              onClick={() =>
                setTab(
                  stat.tab,
                )
              }
              className="group rounded-2xl border border-white/10 bg-slate-800 p-4 text-left transition hover:border-white/20 hover:bg-slate-700"
            >
              <div
                className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.from} ${stat.to} text-white shadow-lg`}
              >
                {
                  stat.icon
                }
              </div>

              <div className="text-2xl font-black text-white">
                {
                  stat.value
                }
              </div>

              <div className="mt-0.5 text-xs font-semibold text-slate-400">
                {
                  stat.label
                }
              </div>
            </button>
          ),
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-800">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="font-black text-white">
            Annonces récentes
          </h2>

          <button
            type="button"
            onClick={() =>
              setTab(
                "listings",
              )
            }
            className="text-xs font-bold text-blue-400 hover:underline"
          >
            Voir tout
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">
                  Titre
                </th>

                <th className="px-5 py-3">
                  Statut
                </th>

                <th className="px-5 py-3">
                  Date
                </th>
              </tr>
            </thead>

            <tbody>
              {recent.map(
                (
                  listing,
                ) => (
                  <tr
                    key={
                      listing.id
                    }
                    className="border-b border-white/5 transition hover:bg-white/5"
                  >
                    <td className="px-5 py-3">
                      <a
                        href={`/annonces/${listing.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="line-clamp-1 font-semibold text-white hover:text-blue-400 hover:underline"
                      >
                        {
                          listing.title
                        }
                      </a>
                    </td>

                    <td className="px-5 py-3">
                      <Badge
                        status={
                          listing.status
                        }
                      />
                    </td>

                    <td className="px-5 py-3 text-xs text-slate-400">
                      {new Date(
                        listing.created_at,
                      ).toLocaleDateString(
                        "fr-FR",
                      )}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>

          {!loading &&
            recent.length ===
              0 && (
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

function TabListings({
  supabase,
}: {
  supabase: any;
}) {
  const [
    items,
    setItems,
  ] = useState<
    AdminListing[]
  >([]);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    filter,
    setFilter,
  ] =
    useState("all");

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  useEffect(() => {
    let cancelled =
      false;

    async function loadListings() {
      try {
        setLoading(
          true,
        );

        /*
         * Première tentative avec les relations.
         */
        let query =
          supabase
            .from(
              "listings",
            )
            .select(
              "id,title,slug,status,price,currency,created_at,user_id,region:regions(name),city:cities(name)",
            )
            .order(
              "created_at",
              {
                ascending:
                  false,
              },
            )
            .limit(100);

        if (
          filter !==
          "all"
        ) {
          query =
            query.eq(
              "status",
              filter,
            );
        }

        let {
          data,
          error,
        } =
          await query;

        /*
         * Si les foreign keys regions/cities ne sont
         * pas encore disponibles dans le nouveau Supabase,
         * on recharge les annonces sans jointure.
         */
        if (
          error
        ) {
          console.warn(
            "[Admin Listings] Relations indisponibles, fallback sans jointure :",
            error,
          );

          let fallbackQuery =
            supabase
              .from(
                "listings",
              )
              .select(
                "id,title,slug,status,price,currency,created_at,user_id",
              )
              .order(
                "created_at",
                {
                  ascending:
                    false,
                },
              )
              .limit(
                100,
              );

          if (
            filter !==
            "all"
          ) {
            fallbackQuery =
              fallbackQuery.eq(
                "status",
                filter,
              );
          }

          const fallback =
            await fallbackQuery;

          data =
            fallback.data;

          error =
            fallback.error;
        }

        if (
          error
        ) {
          console.error(
            "[Admin Listings] Erreur :",
            error,
          );

          toast.error(
            `Impossible de charger les annonces : ${error.message}`,
          );

          return;
        }

        if (
          !cancelled
        ) {
          setItems(
            (data ??
              []) as AdminListing[],
          );
        }
      } catch (error) {
        console.error(
          "[Admin Listings] Erreur :",
          error,
        );
      } finally {
        if (
          !cancelled
        ) {
          setLoading(
            false,
          );
        }
      }
    }

    void loadListings();

    return () => {
      cancelled =
        true;
    };
  }, [
    supabase,
    filter,
  ]);

  const setStatus =
    async (
      id: string,
      status: string,
    ) => {
      const {
        error,
      } =
        await supabase
          .from(
            "listings",
          )
          .update({
            status,
          })
          .eq(
            "id",
            id,
          );

      if (
        error
      ) {
        toast.error(
          error.message,
        );

        return;
      }

      toast.success(
        "Statut mis à jour",
      );

      setItems(
        (
          current,
        ) =>
          current.map(
            (
              item,
            ) =>
              item.id ===
              id
                ? {
                    ...item,
                    status,
                  }
                : item,
          ),
      );
    };

  const del =
    async (
      id: string,
    ) => {
      if (
        !window.confirm(
          "Supprimer définitivement cette annonce ?",
        )
      ) {
        return;
      }

      const {
        error,
      } =
        await supabase
          .from(
            "listings",
          )
          .delete()
          .eq(
            "id",
            id,
          );

      if (
        error
      ) {
        toast.error(
          error.message,
        );

        return;
      }

      toast.success(
        "Annonce supprimée",
      );

      setItems(
        (
          current,
        ) =>
          current.filter(
            (
              item,
            ) =>
              item.id !==
              id,
          ),
      );
    };

  const filtered =
    items.filter(
      (
        listing,
      ) =>
        listing.title
          .toLowerCase()
          .includes(
            search
              .toLowerCase(),
          ),
    );

  const FILTERS = [
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
        <h1 className="text-2xl font-black text-white">
          Gestion des annonces
        </h1>

        <p className="mt-1 text-sm text-slate-400">
          {items.length} annonces
          chargées
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map(
          (item) => (
            <button
              type="button"
              key={
                item
              }
              onClick={() =>
                setFilter(
                  item,
                )
              }
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                filter ===
                item
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
              }`}
            >
              {item ===
              "all"
                ? "Tout"
                : STATUS_CFG[
                    item
                  ]
                    ?.label ??
                  item}
            </button>
          ),
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

        <Input
          value={
            search
          }
          onChange={(
            event,
          ) =>
            setSearch(
              event
                .target
                .value,
            )
          }
          placeholder="Rechercher une annonce…"
          className="rounded-xl border-white/10 bg-slate-800 pl-9 text-white placeholder:text-slate-500"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3">
                Titre
              </th>

              <th className="px-5 py-3">
                Lieu
              </th>

              <th className="px-5 py-3">
                Statut
              </th>

              <th className="px-5 py-3">
                Date
              </th>

              <th className="px-5 py-3">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {filtered.map(
              (
                listing,
              ) => (
                <tr
                  key={
                    listing.id
                  }
                  className="border-b border-white/5 transition hover:bg-white/5"
                >
                  <td className="max-w-[200px] px-5 py-3">
                    <a
                      href={`/annonces/${listing.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="block line-clamp-1 font-semibold text-white hover:text-blue-400"
                    >
                      {
                        listing.title
                      }
                    </a>
                  </td>

                  <td className="px-5 py-3 text-xs text-slate-400">
                    {[
                      listing
                        .city
                        ?.name,
                      listing
                        .region
                        ?.name,
                    ]
                      .filter(
                        Boolean,
                      )
                      .join(
                        ", ",
                      ) ||
                      "—"}
                  </td>

                  <td className="px-5 py-3">
                    <Badge
                      status={
                        listing.status
                      }
                    />
                  </td>

                  <td className="px-5 py-3 text-xs text-slate-400">
                    {new Date(
                      listing.created_at,
                    ).toLocaleDateString(
                      "fr-FR",
                    )}
                  </td>

                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <ActionBtn
                        color="emerald"
                        title="Publier"
                        onClick={() =>
                          void setStatus(
                            listing.id,
                            "published",
                          )
                        }
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                      </ActionBtn>

                      <ActionBtn
                        color="red"
                        title="Rejeter"
                        onClick={() =>
                          void setStatus(
                            listing.id,
                            "rejected",
                          )
                        }
                      >
                        <XCircle className="h-3.5 w-3.5" />
                      </ActionBtn>

                      <ActionBtn
                        color="orange"
                        title="Suspendre"
                        onClick={() =>
                          void setStatus(
                            listing.id,
                            "suspended",
                          )
                        }
                      >
                        <AlertTriangle className="h-3.5 w-3.5" />
                      </ActionBtn>

                      <ActionBtn
                        color="slate"
                        title="Supprimer"
                        onClick={() =>
                          void del(
                            listing.id,
                          )
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </ActionBtn>
                    </div>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>

        {loading && (
          <p className="py-10 text-center text-sm text-slate-500">
            Chargement des annonces...
          </p>
        )}

        {!loading &&
          filtered.length ===
            0 && (
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
  const [
    users,
    setUsers,
  ] = useState<
    AdminUser[]
  >([]);

  const [
    search,
    setSearch,
  ] = useState("");

  useEffect(() => {
    let cancelled =
      false;

    async function loadUsers() {
      const {
        data,
        error,
      } =
        await supabase
          .from(
            "profiles",
          )
          .select(
            "id,user_id,display_name,phone,created_at,is_admin",
          )
          .order(
            "created_at",
            {
              ascending:
                false,
            },
          )
          .limit(100);

      if (
        error
      ) {
        console.error(
          "[Admin Users] Erreur :",
          error,
        );

        toast.error(
          `Impossible de charger les utilisateurs : ${error.message}`,
        );

        return;
      }

      if (
        !cancelled
      ) {
        setUsers(
          (data ??
            []) as AdminUser[],
        );
      }
    }

    void loadUsers();

    return () => {
      cancelled =
        true;
    };
  }, [
    supabase,
  ]);

  const toggleAdmin =
    async (
      uid: string,
      current: boolean,
    ) => {
      /*
       * Empêche l'admin connecté de retirer
       * accidentellement ses propres droits.
       */
      if (
        uid ===
          currentUserId &&
        current
      ) {
        toast.error(
          "Vous ne pouvez pas retirer vos propres droits administrateur.",
        );

        return;
      }

      const {
        error,
      } =
        await supabase
          .from(
            "profiles",
          )
          .update({
            is_admin:
              !current,
          })
          .eq(
            "user_id",
            uid,
          );

      if (
        error
      ) {
        toast.error(
          error.message,
        );

        return;
      }

      toast.success(
        current
          ? "Droits admin retirés"
          : "Droits admin accordés",
      );

      setUsers(
        (
          currentUsers,
        ) =>
          currentUsers.map(
            (
              item,
            ) =>
              item.user_id ===
              uid
                ? {
                    ...item,
                    is_admin:
                      !current,
                  }
                : item,
          ),
      );
    };

  const del =
    async (
      uid: string,
    ) => {
      if (
        uid ===
        currentUserId
      ) {
        toast.error(
          "Vous ne pouvez pas supprimer votre propre compte administrateur.",
        );

        return;
      }

      if (
        !window.confirm(
          "Supprimer le profil de cet utilisateur ?",
        )
      ) {
        return;
      }

      const {
        error,
      } =
        await supabase
          .from(
            "profiles",
          )
          .delete()
          .eq(
            "user_id",
            uid,
          );

      if (
        error
      ) {
        toast.error(
          error.message,
        );

        return;
      }

      toast.success(
        "Profil utilisateur supprimé",
      );

      setUsers(
        (
          current,
        ) =>
          current.filter(
            (
              item,
            ) =>
              item.user_id !==
              uid,
          ),
      );
    };

  const filtered =
    users.filter(
      (
        item,
      ) =>
        (
          item.display_name ??
          ""
        )
          .toLowerCase()
          .includes(
            search
              .toLowerCase(),
          ) ||
        (
          item.phone ??
          ""
        ).includes(
          search,
        ),
    );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-white">
          Utilisateurs
        </h1>

        <p className="mt-1 text-sm text-slate-400">
          {users.length} profils chargés
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

        <Input
          value={
            search
          }
          onChange={(
            event,
          ) =>
            setSearch(
              event
                .target
                .value,
            )
          }
          placeholder="Nom ou téléphone…"
          className="rounded-xl border-white/10 bg-slate-800 pl-9 text-white placeholder:text-slate-500"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3">
                Utilisateur
              </th>

              <th className="px-5 py-3">
                Téléphone
              </th>

              <th className="px-5 py-3">
                Rôle
              </th>

              <th className="px-5 py-3">
                Inscrit le
              </th>

              <th className="px-5 py-3">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {filtered.map(
              (
                item,
              ) => (
                <tr
                  key={
                    item.id
                  }
                  className="border-b border-white/5 transition hover:bg-white/5"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-fuchsia-500 text-xs font-black text-white">
                        {(
                          item.display_name ??
                          "?"
                        )[0]?.toUpperCase()}
                      </div>

                      <span className="font-semibold text-white">
                        {item.display_name ??
                          (
                            <span className="italic text-slate-500">
                              Sans nom
                            </span>
                          )}
                      </span>
                    </div>
                  </td>

                  <td className="px-5 py-3 text-slate-400">
                    {item.phone ??
                      "—"}
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
                    {new Date(
                      item.created_at,
                    ).toLocaleDateString(
                      "fr-FR",
                    )}
                  </td>

                  <td className="px-5 py-3">
                    <div className="flex gap-1">
                      <ActionBtn
                        color="blue"
                        title={
                          item.is_admin
                            ? "Retirer admin"
                            : "Passer admin"
                        }
                        onClick={() =>
                          void toggleAdmin(
                            item.user_id,
                            item.is_admin,
                          )
                        }
                      >
                        <Shield className="h-3.5 w-3.5" />
                      </ActionBtn>

                      <ActionBtn
                        color="slate"
                        title="Supprimer"
                        onClick={() =>
                          void del(
                            item.user_id,
                          )
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </ActionBtn>
                    </div>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>

        {filtered.length ===
          0 && (
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

function TabReports({
  supabase,
}: {
  supabase: any;
}) {
  const [
    reports,
    setReports,
  ] = useState<
    AdminReport[]
  >([]);

  useEffect(() => {
    let cancelled =
      false;

    async function loadReports() {
      let {
        data,
        error,
      } =
        await supabase
          .from(
            "reports",
          )
          .select(
            "id,reason,status,created_at,listing:listings(title,slug)",
          )
          .order(
            "created_at",
            {
              ascending:
                false,
            },
          )
          .limit(100);

      /*
       * Fallback si la relation reports -> listings
       * n'est pas encore créée dans le nouveau projet.
       */
      if (
        error
      ) {
        console.warn(
          "[Admin Reports] Relation listings indisponible :",
          error,
        );

        const fallback =
          await supabase
            .from(
              "reports",
            )
            .select(
              "id,reason,status,created_at",
            )
            .order(
              "created_at",
              {
                ascending:
                  false,
              },
            )
            .limit(
              100,
            );

        data =
          fallback.data;

        error =
          fallback.error;
      }

      if (
        error
      ) {
        toast.error(
          `Impossible de charger les signalements : ${error.message}`,
        );

        return;
      }

      if (
        !cancelled
      ) {
        setReports(
          (data ??
            []) as AdminReport[],
        );
      }
    }

    void loadReports();

    return () => {
      cancelled =
        true;
    };
  }, [
    supabase,
  ]);

  const resolve =
    async (
      id: string,
    ) => {
      const {
        error,
      } =
        await supabase
          .from(
            "reports",
          )
          .update({
            status:
              "resolved",
          })
          .eq(
            "id",
            id,
          );

      if (
        error
      ) {
        toast.error(
          error.message,
        );

        return;
      }

      toast.success(
        "Signalement résolu",
      );

      setReports(
        (
          current,
        ) =>
          current.map(
            (
              item,
            ) =>
              item.id ===
              id
                ? {
                    ...item,
                    status:
                      "resolved",
                  }
                : item,
          ),
      );
    };

  const del =
    async (
      id: string,
    ) => {
      const {
        error,
      } =
        await supabase
          .from(
            "reports",
          )
          .delete()
          .eq(
            "id",
            id,
          );

      if (
        error
      ) {
        toast.error(
          error.message,
        );

        return;
      }

      toast.success(
        "Signalement supprimé",
      );

      setReports(
        (
          current,
        ) =>
          current.filter(
            (
              item,
            ) =>
              item.id !==
              id,
          ),
      );
    };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-white">
          Signalements
        </h1>

        <p className="mt-1 text-sm text-slate-400">
          {
            reports.filter(
              (
                item,
              ) =>
                item.status ===
                "open",
            ).length
          }{" "}
          ouverts
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3">
                Annonce
              </th>

              <th className="px-5 py-3">
                Raison
              </th>

              <th className="px-5 py-3">
                Statut
              </th>

              <th className="px-5 py-3">
                Date
              </th>

              <th className="px-5 py-3">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {reports.map(
              (
                report,
              ) => (
                <tr
                  key={
                    report.id
                  }
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
                        {
                          report
                            .listing
                            .title
                        }
                      </a>
                    ) : (
                      <span className="italic text-slate-500">
                        Annonce indisponible
                      </span>
                    )}
                  </td>

                  <td className="max-w-[160px] px-5 py-3 text-slate-300">
                    <span className="line-clamp-2">
                      {
                        report.reason
                      }
                    </span>
                  </td>

                  <td className="px-5 py-3">
                    <Badge
                      status={
                        report.status
                      }
                    />
                  </td>

                  <td className="px-5 py-3 text-xs text-slate-400">
                    {new Date(
                      report.created_at,
                    ).toLocaleDateString(
                      "fr-FR",
                    )}
                  </td>

                  <td className="px-5 py-3">
                    <div className="flex gap-1">
                      {report.status ===
                        "open" && (
                        <ActionBtn
                          color="emerald"
                          title="Résoudre"
                          onClick={() =>
                            void resolve(
                              report.id,
                            )
                          }
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                        </ActionBtn>
                      )}

                      <ActionBtn
                        color="slate"
                        title="Supprimer"
                        onClick={() =>
                          void del(
                            report.id,
                          )
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </ActionBtn>
                    </div>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>

        {reports.length ===
          0 && (
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

function TabCategories({
  supabase,
}: {
  supabase: any;
}) {
  const [
    cats,
    setCats,
  ] = useState<
    AdminCategory[]
  >([]);

  const [
    newName,
    setNewName,
  ] = useState("");

  const [
    newSlug,
    setNewSlug,
  ] = useState("");

  const [
    newIcon,
    setNewIcon,
  ] = useState("");

  useEffect(() => {
    let cancelled =
      false;

    async function loadCategories() {
      const {
        data,
        error,
      } =
        await supabase
          .from(
            "categories",
          )
          .select(
            "id,name,slug,icon,is_active,sort_order",
          )
          .is(
            "parent_id",
            null,
          )
          .order(
            "sort_order",
          );

      if (
        error
      ) {
        console.error(
          "[Admin Categories] Erreur :",
          error,
        );

        toast.error(
          `Impossible de charger les catégories : ${error.message}`,
        );

        return;
      }

      if (
        !cancelled
      ) {
        setCats(
          (data ??
            []) as AdminCategory[],
        );
      }
    }

    void loadCategories();

    return () => {
      cancelled =
        true;
    };
  }, [
    supabase,
  ]);

  const add =
    async () => {
      const name =
        newName.trim();

      const slug =
        newSlug
          .trim()
          .toLowerCase();

      if (
        !name ||
        !slug
      ) {
        toast.error(
          "Nom et slug requis",
        );

        return;
      }

      const {
        data,
        error,
      } =
        await supabase
          .from(
            "categories",
          )
          .insert({
            name,
            slug,
            icon:
              newIcon.trim() ||
              null,
            is_active:
              true,
            sort_order:
              cats.length +
              1,
          })
          .select()
          .single();

      if (
        error
      ) {
        toast.error(
          error.message,
        );

        return;
      }

      toast.success(
        "Catégorie ajoutée",
      );

      setCats(
        (
          current,
        ) => [
          ...current,
          data as AdminCategory,
        ],
      );

      setNewName(
        "",
      );

      setNewSlug(
        "",
      );

      setNewIcon(
        "",
      );
    };

  const toggle =
    async (
      id: string,
      current: boolean,
    ) => {
      const {
        error,
      } =
        await supabase
          .from(
            "categories",
          )
          .update({
            is_active:
              !current,
          })
          .eq(
            "id",
            id,
          );

      if (
        error
      ) {
        toast.error(
          error.message,
        );

        return;
      }

      toast.success(
        "Catégorie mise à jour",
      );

      setCats(
        (
          currentCategories,
        ) =>
          currentCategories.map(
            (
              item,
            ) =>
              item.id ===
              id
                ? {
                    ...item,
                    is_active:
                      !current,
                  }
                : item,
          ),
      );
    };

  const del =
    async (
      id: string,
    ) => {
      if (
        !window.confirm(
          "Supprimer cette catégorie ?",
        )
      ) {
        return;
      }

      const {
        error,
      } =
        await supabase
          .from(
            "categories",
          )
          .delete()
          .eq(
            "id",
            id,
          );

      if (
        error
      ) {
        toast.error(
          error.message,
        );

        return;
      }

      toast.success(
        "Catégorie supprimée",
      );

      setCats(
        (
          current,
        ) =>
          current.filter(
            (
              item,
            ) =>
              item.id !==
              id,
          ),
      );
    };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-white">
          Catégories
        </h1>

        <p className="mt-1 text-sm text-slate-400">
          {cats.length} catégories
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-800 p-5">
        <h2 className="mb-4 font-black text-white">
          Ajouter une catégorie
        </h2>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-400">
              Nom
            </label>

            <Input
              value={
                newName
              }
              onChange={(
                event,
              ) =>
                setNewName(
                  event
                    .target
                    .value,
                )
              }
              placeholder="ex : Électronique"
              className="rounded-xl border-white/10 bg-slate-700 text-white placeholder:text-slate-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-slate-400">
              Slug
            </label>

            <Input
              value={
                newSlug
              }
              onChange={(
                event,
              ) =>
                setNewSlug(
                  event
                    .target
                    .value,
                )
              }
              placeholder="ex : electronique"
              className="rounded-xl border-white/10 bg-slate-700 text-white placeholder:text-slate-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-slate-400">
              Icône
            </label>

            <Input
              value={
                newIcon
              }
              onChange={(
                event,
              ) =>
                setNewIcon(
                  event
                    .target
                    .value,
                )
              }
              placeholder="ex : smartphone"
              className="rounded-xl border-white/10 bg-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
        </div>

        <Button
          type="button"
          onClick={() =>
            void add()
          }
          className="mt-4 rounded-full bg-blue-600 px-6 font-bold text-white hover:bg-blue-700"
        >
          Ajouter
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3">
                Nom
              </th>

              <th className="px-5 py-3">
                Slug
              </th>

              <th className="px-5 py-3">
                Icône
              </th>

              <th className="px-5 py-3">
                Statut
              </th>

              <th className="px-5 py-3">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {cats.map(
              (
                category,
              ) => (
                <tr
                  key={
                    category.id
                  }
                  className="border-b border-white/5 transition hover:bg-white/5"
                >
                  <td className="px-5 py-3 font-semibold text-white">
                    {
                      category.name
                    }
                  </td>

                  <td className="px-5 py-3 font-mono text-xs text-slate-400">
                    {
                      category.slug
                    }
                  </td>

                  <td className="px-5 py-3 text-slate-400">
                    {category.icon ??
                      "—"}
                  </td>

                  <td className="px-5 py-3">
                    <Badge
                      status={
                        category.is_active
                          ? "published"
                          : "suspended"
                      }
                    />
                  </td>

                  <td className="px-5 py-3">
                    <div className="flex gap-1">
                      <ActionBtn
                        color={
                          category.is_active
                            ? "orange"
                            : "emerald"
                        }
                        title={
                          category.is_active
                            ? "Désactiver"
                            : "Activer"
                        }
                        onClick={() =>
                          void toggle(
                            category.id,
                            category.is_active,
                          )
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
                        onClick={() =>
                          void del(
                            category.id,
                          )
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </ActionBtn>
                    </div>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   TAB — PARAMÈTRES
════════════════════════════════════════════════════════════ */

function TabSettings({
  user,
}: {
  user: any;
}) {
  const [
    siteName,
    setSiteName,
  ] =
    useState("Kafoo");

  const [
    siteDesc,
    setSiteDesc,
  ] =
    useState("");

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const save =
    async () => {
      try {
        setSaving(
          true,
        );

        /*
         * Pour le moment, cette section reste locale.
         * À connecter ensuite à la table settings
         * lorsque son schéma sera confirmé.
         */
        await new Promise(
          (
            resolve,
          ) =>
            window.setTimeout(
              resolve,
              600,
            ),
        );

        toast.success(
          "Paramètres enregistrés",
        );
      } finally {
        setSaving(
          false,
        );
      }
    };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">
          Paramètres
        </h1>

        <p className="mt-1 text-sm text-slate-400">
          Configuration générale de la
          plateforme
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border border-white/10 bg-slate-800 p-5">
        <h2 className="font-black text-white">
          Site
        </h2>

        <div>
          <label className="mb-1 block text-xs font-bold text-slate-400">
            Nom du site
          </label>

          <Input
            value={
              siteName
            }
            onChange={(
              event,
            ) =>
              setSiteName(
                event
                  .target
                  .value,
              )
            }
            className="rounded-xl border-white/10 bg-slate-700 text-white"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold text-slate-400">
            Description
          </label>

          <textarea
            value={
              siteDesc
            }
            onChange={(
              event,
            ) =>
              setSiteDesc(
                event
                  .target
                  .value,
              )
            }
            rows={3}
            className="w-full resize-none rounded-xl border border-white/10 bg-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
          />
        </div>

        <Button
          type="button"
          onClick={() =>
            void save()
          }
          disabled={
            saving
          }
          className="rounded-full bg-blue-600 px-6 font-bold text-white hover:bg-blue-700"
        >
          {saving
            ? "Enregistrement…"
            : "Enregistrer"}
        </Button>
      </div>

      <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-800 p-5">
        <h2 className="font-black text-white">
          Compte admin
        </h2>

        <p className="text-sm text-slate-400">
          Connecté en tant que{" "}
          <span className="font-bold text-white">
            {
              user?.email
            }
          </span>
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
   BOUTONS D'ACTION
════════════════════════════════════════════════════════════ */

const COLOR_MAP: Record<
  string,
  string
> = {
  emerald:
    "bg-emerald-900/40 text-emerald-400 hover:bg-emerald-800/60 border-emerald-700/30",

  red:
    "bg-red-900/40 text-red-400 hover:bg-red-800/60 border-red-700/30",

  orange:
    "bg-orange-900/40 text-orange-400 hover:bg-orange-800/60 border-orange-700/30",

  blue:
    "bg-blue-900/40 text-blue-400 hover:bg-blue-800/60 border-blue-700/30",

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
      title={
        title
      }
      onClick={
        onClick
      }
      className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border text-xs transition ${
        COLOR_MAP[
          color
        ] ??
        COLOR_MAP.slate
      }`}
    >
      {
        children
      }
    </button>
  );
}

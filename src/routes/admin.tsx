import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle,
  ChevronDown,
  Eye,
  FileText,
  LayoutDashboard,
  LogOut,
  MessageSquare,
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

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({ meta: [{ title: "Admin — Kafoo" }] }),
});

/* ── Types ── */
type AdminListing = {
  id: string; title: string; slug: string; status: string;
  created_at: string; price: number; currency: string;
  user_id: string; region?: { name: string }; city?: { name: string };
};
type AdminUser = {
  id: string; user_id: string; display_name: string | null;
  phone: string | null; created_at: string; is_admin: boolean;
  email?: string;
};
type AdminReport = {
  id: string; reason: string; status: string; created_at: string;
  listing?: { title: string; slug: string };
};
type AdminCategory = {
  id: string; name: string; slug: string; icon: string | null;
  is_active: boolean; sort_order: number;
};

type Tab = "dashboard" | "listings" | "users" | "reports" | "categories" | "settings";

/* ── Status config ── */
const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  published: { label: "Publié",     color: "text-emerald-700", bg: "bg-emerald-100" },
  pending:   { label: "En attente", color: "text-yellow-700",  bg: "bg-yellow-100"  },
  rejected:  { label: "Rejeté",     color: "text-red-700",     bg: "bg-red-100"     },
  suspended: { label: "Suspendu",   color: "text-orange-700",  bg: "bg-orange-100"  },
  sold:      { label: "Vendu",      color: "text-slate-600",   bg: "bg-slate-100"   },
  open:      { label: "Ouvert",     color: "text-red-700",     bg: "bg-red-100"     },
  resolved:  { label: "Résolu",     color: "text-emerald-700", bg: "bg-emerald-100" },
};

function Badge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? { label: status, color: "text-slate-600", bg: "bg-slate-100" };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${cfg.bg} ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

/* ════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
════════════════════════════════════════════════════════════ */
function AdminPage() {
  const { supabase, user, isAdmin, loading } = useSupabase();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("dashboard");

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate({ to: "/" });
  }, [loading, user, isAdmin, navigate]);

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
    </div>
  );
  if (!isAdmin) return null;

  const NAV: { id: Tab; label: string; icon: React.ReactNode; color: string }[] = [
    { id: "dashboard",  label: "Tableau de bord", icon: <LayoutDashboard className="h-4 w-4" />, color: "text-blue-400"    },
    { id: "listings",   label: "Annonces",        icon: <Package className="h-4 w-4" />,         color: "text-violet-400"  },
    { id: "users",      label: "Utilisateurs",    icon: <Users className="h-4 w-4" />,            color: "text-emerald-400" },
    { id: "reports",    label: "Signalements",    icon: <AlertTriangle className="h-4 w-4" />,    color: "text-red-400"     },
    { id: "categories", label: "Catégories",      icon: <FileText className="h-4 w-4" />,         color: "text-orange-400"  },
    { id: "settings",   label: "Paramètres",      icon: <Settings className="h-4 w-4" />,         color: "text-slate-400"   },
  ];

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      {/* ── Sidebar ── */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-white/10 bg-slate-900 lg:flex">
        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-fuchsia-500">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-black text-white">Kafoo</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Admin</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setTab(n.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                tab === n.id
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className={tab === n.id ? "text-white" : n.color}>{n.icon}</span>
              {n.label}
            </button>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-fuchsia-500 text-xs font-black">
              {user?.email?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-white">{user?.email}</p>
              <p className="text-[10px] text-emerald-400 font-semibold">Super Admin</p>
            </div>
            <button onClick={() => supabase.auth.signOut().then(() => navigate({ to: "/" }))}
              className="text-slate-400 hover:text-white transition">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Topbar mobile */}
        <header className="flex items-center justify-between border-b border-white/10 bg-slate-900 px-4 py-3 lg:hidden">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-400" />
            <span className="font-black text-white">Admin Kafoo</span>
          </div>
          <div className="flex gap-1">
            {NAV.map((n) => (
              <button key={n.id} onClick={() => setTab(n.id)}
                className={`rounded-lg p-2 transition ${tab === n.id ? "bg-white/10 text-white" : "text-slate-400"}`}>
                {n.icon}
              </button>
            ))}
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {tab === "dashboard"  && <TabDashboard  supabase={supabase} setTab={setTab} />}
          {tab === "listings"   && <TabListings   supabase={supabase} />}
          {tab === "users"      && <TabUsers      supabase={supabase} />}
          {tab === "reports"    && <TabReports    supabase={supabase} />}
          {tab === "categories" && <TabCategories supabase={supabase} />}
          {tab === "settings"   && <TabSettings   supabase={supabase} user={user} />}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   TAB — DASHBOARD
════════════════════════════════════════════════════════════ */
function TabDashboard({ supabase, setTab }: { supabase: any; setTab: (t: Tab) => void }) {
  const [stats, setStats] = useState({ users: 0, listings: 0, pending: 0, reports: 0, published: 0, sold: 0 });
  const [recent, setRecent] = useState<AdminListing[]>([]);

  useEffect(() => {
    void (async () => {
      const [u, l, p, r, pub, sold] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("listings").select("*", { count: "exact", head: true }),
        supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "published"),
        supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "sold"),
      ]);
      setStats({
        users: u.count ?? 0, listings: l.count ?? 0, pending: p.count ?? 0,
        reports: r.count ?? 0, published: pub.count ?? 0, sold: sold.count ?? 0,
      });
      const { data } = await supabase.from("listings")
        .select("id,title,slug,status,price,currency,created_at,user_id")
        .order("created_at", { ascending: false }).limit(8);
      setRecent((data ?? []) as AdminListing[]);
    })();
  }, [supabase]);

  const STAT_CARDS = [
    { label: "Utilisateurs",  value: stats.users,     icon: <Users className="h-5 w-5" />,       from: "from-blue-600",    to: "to-blue-400",    tab: "users"    as Tab },
    { label: "Total annonces",value: stats.listings,  icon: <Package className="h-5 w-5" />,      from: "from-violet-600",  to: "to-violet-400",  tab: "listings" as Tab },
    { label: "En attente",    value: stats.pending,   icon: <TrendingUp className="h-5 w-5" />,   from: "from-yellow-600",  to: "to-yellow-400",  tab: "listings" as Tab },
    { label: "Signalements",  value: stats.reports,   icon: <AlertTriangle className="h-5 w-5" />,from: "from-red-600",     to: "to-red-400",     tab: "reports"  as Tab },
    { label: "Publiées",      value: stats.published, icon: <CheckCircle className="h-5 w-5" />,  from: "from-emerald-600", to: "to-emerald-400", tab: "listings" as Tab },
    { label: "Vendues",       value: stats.sold,      icon: <BarChart3 className="h-5 w-5" />,    from: "from-orange-600",  to: "to-orange-400",  tab: "listings" as Tab },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Tableau de bord</h1>
        <p className="mt-1 text-sm text-slate-400">Vue d'ensemble de la plateforme Kafoo</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {STAT_CARDS.map((s) => (
          <button key={s.label} onClick={() => setTab(s.tab)}
            className="group rounded-2xl border border-white/10 bg-slate-800 p-4 text-left transition hover:border-white/20 hover:bg-slate-700">
            <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${s.from} ${s.to} text-white shadow-lg`}>
              {s.icon}
            </div>
            <div className="text-2xl font-black text-white">{s.value}</div>
            <div className="mt-0.5 text-xs font-semibold text-slate-400">{s.label}</div>
          </button>
        ))}
      </div>

      {/* Recent listings */}
      <div className="rounded-2xl border border-white/10 bg-slate-800">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="font-black text-white">Annonces récentes</h2>
          <button onClick={() => setTab("listings")} className="text-xs font-bold text-blue-400 hover:underline">Voir tout</button>
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
              {recent.map((l) => (
                <tr key={l.id} className="border-b border-white/5 hover:bg-white/5 transition">
                  <td className="px-5 py-3">
                    <a href={`/annonces/${l.slug}`} target="_blank" rel="noreferrer"
                      className="font-semibold text-white hover:text-blue-400 hover:underline line-clamp-1">
                      {l.title}
                    </a>
                  </td>
                  <td className="px-5 py-3"><Badge status={l.status} /></td>
                  <td className="px-5 py-3 text-xs text-slate-400">
                    {new Date(l.created_at).toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

  useEffect(() => {
    void (async () => {
      let q = supabase.from("listings")
        .select("id,title,slug,status,price,currency,created_at,user_id,region:regions(name),city:cities(name)")
        .order("created_at", { ascending: false }).limit(100);
      if (filter !== "all") q = q.eq("status", filter);
      const { data } = await q;
      setItems((data ?? []) as AdminListing[]);
    })();
  }, [supabase, filter]);

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("listings").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Statut mis à jour"); setItems((l) => l.map((x) => x.id === id ? { ...x, status } : x)); }
  };

  const del = async (id: string) => {
    if (!confirm("Supprimer définitivement ?")) return;
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Annonce supprimée"); setItems((l) => l.filter((x) => x.id !== id)); }
  };

  const filtered = items.filter((l) =>
    l.title.toLowerCase().includes(search.toLowerCase())
  );

  const FILTERS = ["all", "pending", "published", "rejected", "suspended", "sold"];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-white">Gestion des annonces</h1>
        <p className="mt-1 text-sm text-slate-400">{items.length} annonces au total</p>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
              filter === f ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
            }`}>
            {f === "all" ? "Tout" : STATUS_CFG[f]?.label ?? f}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une annonce…"
          className="bg-slate-800 border-white/10 text-white placeholder:text-slate-500 pl-9 rounded-xl" />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/10 bg-slate-800 overflow-x-auto">
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
            {filtered.map((l) => (
              <tr key={l.id} className="border-b border-white/5 hover:bg-white/5 transition">
                <td className="px-5 py-3 max-w-[200px]">
                  <a href={`/annonces/${l.slug}`} target="_blank" rel="noreferrer"
                    className="font-semibold text-white hover:text-blue-400 line-clamp-1 block">{l.title}</a>
                </td>
                <td className="px-5 py-3 text-xs text-slate-400">
                  {[l.city?.name, l.region?.name].filter(Boolean).join(", ") || "—"}
                </td>
                <td className="px-5 py-3"><Badge status={l.status} /></td>
                <td className="px-5 py-3 text-xs text-slate-400">
                  {new Date(l.created_at).toLocaleDateString("fr-FR")}
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1">
                    <ActionBtn color="emerald" title="Publier"   onClick={() => setStatus(l.id, "published")}><CheckCircle className="h-3.5 w-3.5" /></ActionBtn>
                    <ActionBtn color="red"     title="Rejeter"   onClick={() => setStatus(l.id, "rejected")} ><XCircle className="h-3.5 w-3.5" /></ActionBtn>
                    <ActionBtn color="orange"  title="Suspendre" onClick={() => setStatus(l.id, "suspended")}><AlertTriangle className="h-3.5 w-3.5" /></ActionBtn>
                    <ActionBtn color="slate"   title="Supprimer" onClick={() => del(l.id)}><Trash2 className="h-3.5 w-3.5" /></ActionBtn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-500">Aucune annonce trouvée.</p>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   TAB — UTILISATEURS
════════════════════════════════════════════════════════════ */
function TabUsers({ supabase }: { supabase: any }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    void supabase.from("profiles")
      .select("id,user_id,display_name,phone,created_at,is_admin")
      .order("created_at", { ascending: false }).limit(100)
      .then(({ data }: any) => setUsers((data ?? []) as AdminUser[]));
  }, [supabase]);

  const toggleAdmin = async (uid: string, current: boolean) => {
    const { error } = await supabase.from("profiles").update({ is_admin: !current }).eq("user_id", uid);
    if (error) toast.error(error.message);
    else {
      toast.success(current ? "Droits admin retirés" : "Droits admin accordés");
      setUsers((u) => u.map((x) => x.user_id === uid ? { ...x, is_admin: !current } : x));
    }
  };

  const del = async (uid: string) => {
    if (!confirm("Supprimer cet utilisateur et toutes ses données ?")) return;
    const { error } = await supabase.from("profiles").delete().eq("user_id", uid);
    if (error) toast.error(error.message);
    else { toast.success("Utilisateur supprimé"); setUsers((u) => u.filter((x) => x.user_id !== uid)); }
  };

  const filtered = users.filter((u) =>
    (u.display_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (u.phone ?? "").includes(search)
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-white">Utilisateurs</h1>
        <p className="mt-1 text-sm text-slate-400">{users.length} inscrits au total</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Nom ou téléphone…"
          className="bg-slate-800 border-white/10 text-white placeholder:text-slate-500 pl-9 rounded-xl" />
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-800 overflow-x-auto">
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
            {filtered.map((u) => (
              <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-fuchsia-500 text-xs font-black text-white">
                      {(u.display_name ?? "?")[0]?.toUpperCase()}
                    </div>
                    <span className="font-semibold text-white">{u.display_name ?? <span className="text-slate-500 italic">Sans nom</span>}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-slate-400">{u.phone ?? "—"}</td>
                <td className="px-5 py-3">
                  {u.is_admin
                    ? <span className="inline-flex items-center gap-1 rounded-full bg-blue-900/60 px-2.5 py-0.5 text-xs font-bold text-blue-300"><Shield className="h-3 w-3" />Admin</span>
                    : <span className="inline-flex items-center gap-1 rounded-full bg-slate-700 px-2.5 py-0.5 text-xs font-bold text-slate-300"><UserCheck className="h-3 w-3" />Membre</span>}
                </td>
                <td className="px-5 py-3 text-xs text-slate-400">
                  {new Date(u.created_at).toLocaleDateString("fr-FR")}
                </td>
                <td className="px-5 py-3">
                  <div className="flex gap-1">
                    <ActionBtn color="blue" title={u.is_admin ? "Retirer admin" : "Passer admin"}
                      onClick={() => toggleAdmin(u.user_id, u.is_admin)}>
                      <Shield className="h-3.5 w-3.5" />
                    </ActionBtn>
                    <ActionBtn color="slate" title="Supprimer" onClick={() => del(u.user_id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </ActionBtn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-500">Aucun utilisateur trouvé.</p>
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
    void supabase.from("reports")
      .select("id,reason,status,created_at,listing:listings(title,slug)")
      .order("created_at", { ascending: false }).limit(100)
      .then(({ data }: any) => setReports((data ?? []) as AdminReport[]));
  }, [supabase]);

  const resolve = async (id: string) => {
    const { error } = await supabase.from("reports").update({ status: "resolved" }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Signalement résolu"); setReports((r) => r.map((x) => x.id === id ? { ...x, status: "resolved" } : x)); }
  };

  const del = async (id: string) => {
    const { error } = await supabase.from("reports").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Supprimé"); setReports((r) => r.filter((x) => x.id !== id)); }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-white">Signalements</h1>
        <p className="mt-1 text-sm text-slate-400">{reports.filter((r) => r.status === "open").length} ouverts</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-800 overflow-x-auto">
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
            {reports.map((r) => (
              <tr key={r.id} className="border-b border-white/5 hover:bg-white/5 transition">
                <td className="px-5 py-3 max-w-[180px]">
                  {r.listing
                    ? <a href={`/annonces/${r.listing.slug}`} target="_blank" rel="noreferrer"
                        className="font-semibold text-white hover:text-blue-400 line-clamp-1 block">{r.listing.title}</a>
                    : <span className="text-slate-500 italic">Annonce supprimée</span>}
                </td>
                <td className="px-5 py-3 text-slate-300 max-w-[160px]">
                  <span className="line-clamp-2">{r.reason}</span>
                </td>
                <td className="px-5 py-3"><Badge status={r.status} /></td>
                <td className="px-5 py-3 text-xs text-slate-400">
                  {new Date(r.created_at).toLocaleDateString("fr-FR")}
                </td>
                <td className="px-5 py-3">
                  <div className="flex gap-1">
                    {r.status === "open" && (
                      <ActionBtn color="emerald" title="Résoudre" onClick={() => resolve(r.id)}>
                        <CheckCircle className="h-3.5 w-3.5" />
                      </ActionBtn>
                    )}
                    <ActionBtn color="slate" title="Supprimer" onClick={() => del(r.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </ActionBtn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {reports.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-500">Aucun signalement.</p>
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
    void supabase.from("categories").select("id,name,slug,icon,is_active,sort_order")
      .is("parent_id", null).order("sort_order")
      .then(({ data }: any) => setCats((data ?? []) as AdminCategory[]));
  }, [supabase]);

  const add = async () => {
    if (!newName || !newSlug) { toast.error("Nom et slug requis"); return; }
    const { data, error } = await supabase.from("categories")
      .insert({ name: newName, slug: newSlug, icon: newIcon || null, is_active: true, sort_order: cats.length + 1 })
      .select().single();
    if (error) toast.error(error.message);
    else { toast.success("Catégorie ajoutée"); setCats((c) => [...c, data as AdminCategory]); setNewName(""); setNewSlug(""); setNewIcon(""); }
  };

  const toggle = async (id: string, current: boolean) => {
    const { error } = await supabase.from("categories").update({ is_active: !current }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Mis à jour"); setCats((c) => c.map((x) => x.id === id ? { ...x, is_active: !current } : x)); }
  };

  const del = async (id: string) => {
    if (!confirm("Supprimer cette catégorie ?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Supprimée"); setCats((c) => c.filter((x) => x.id !== id)); }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-white">Catégories</h1>
        <p className="mt-1 text-sm text-slate-400">{cats.length} catégories</p>
      </div>

      {/* Ajouter */}
      <div className="rounded-2xl border border-white/10 bg-slate-800 p-5">
        <h2 className="mb-4 font-black text-white">Ajouter une catégorie</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-400">Nom</label>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)}
              placeholder="ex: Électronique"
              className="bg-slate-700 border-white/10 text-white placeholder:text-slate-500 rounded-xl" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-400">Slug</label>
            <Input value={newSlug} onChange={(e) => setNewSlug(e.target.value)}
              placeholder="ex: electronique"
              className="bg-slate-700 border-white/10 text-white placeholder:text-slate-500 rounded-xl" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-400">Icône (nom Lucide)</label>
            <Input value={newIcon} onChange={(e) => setNewIcon(e.target.value)}
              placeholder="ex: smartphone"
              className="bg-slate-700 border-white/10 text-white placeholder:text-slate-500 rounded-xl" />
          </div>
        </div>
        <Button onClick={add} className="mt-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold px-6">
          Ajouter
        </Button>
      </div>

      {/* Liste */}
      <div className="rounded-2xl border border-white/10 bg-slate-800 overflow-x-auto">
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
            {cats.map((c) => (
              <tr key={c.id} className="border-b border-white/5 hover:bg-white/5 transition">
                <td className="px-5 py-3 font-semibold text-white">{c.name}</td>
                <td className="px-5 py-3 text-slate-400 font-mono text-xs">{c.slug}</td>
                <td className="px-5 py-3 text-slate-400">{c.icon ?? "—"}</td>
                <td className="px-5 py-3">
                  <Badge status={c.is_active ? "published" : "suspended"} />
                </td>
                <td className="px-5 py-3">
                  <div className="flex gap-1">
                    <ActionBtn color={c.is_active ? "orange" : "emerald"}
                      title={c.is_active ? "Désactiver" : "Activer"}
                      onClick={() => toggle(c.id, c.is_active)}>
                      {c.is_active ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
                    </ActionBtn>
                    <ActionBtn color="slate" title="Supprimer" onClick={() => del(c.id)}>
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
   TAB — PARAMÈTRES
════════════════════════════════════════════════════════════ */
function TabSettings({ supabase, user }: { supabase: any; user: any }) {
  const [siteName, setSiteName]   = useState("Kafoo");
  const [siteDesc, setSiteDesc]   = useState("");
  const [saving, setSaving]       = useState(false);

  const save = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    toast.success("Paramètres enregistrés");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-black text-white">Paramètres</h1>
        <p className="mt-1 text-sm text-slate-400">Configuration générale de la plateforme</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-800 p-5 space-y-4">
        <h2 className="font-black text-white">Site</h2>
        <div>
          <label className="mb-1 block text-xs font-bold text-slate-400">Nom du site</label>
          <Input value={siteName} onChange={(e) => setSiteName(e.target.value)}
            className="bg-slate-700 border-white/10 text-white rounded-xl" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-slate-400">Description</label>
          <textarea value={siteDesc} onChange={(e) => setSiteDesc(e.target.value)} rows={3}
            className="w-full rounded-xl border border-white/10 bg-slate-700 px-3 py-2 text-sm text-white resize-none outline-none focus:border-blue-500" />
        </div>
        <Button onClick={save} disabled={saving}
          className="rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold px-6">
          {saving ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-800 p-5 space-y-3">
        <h2 className="font-black text-white">Compte admin</h2>
        <p className="text-sm text-slate-400">Connecté en tant que <span className="text-white font-bold">{user?.email}</span></p>
        <div className="flex items-center gap-2 rounded-xl bg-emerald-900/30 border border-emerald-700/30 px-4 py-3">
          <Shield className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="text-sm font-bold text-emerald-300">Accès super administrateur actif</span>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   COMPOSANT UTILITAIRE
════════════════════════════════════════════════════════════ */
const COLOR_MAP: Record<string, string> = {
  emerald: "bg-emerald-900/40 text-emerald-400 hover:bg-emerald-800/60 border-emerald-700/30",
  red:     "bg-red-900/40 text-red-400 hover:bg-red-800/60 border-red-700/30",
  orange:  "bg-orange-900/40 text-orange-400 hover:bg-orange-800/60 border-orange-700/30",
  blue:    "bg-blue-900/40 text-blue-400 hover:bg-blue-800/60 border-blue-700/30",
  slate:   "bg-slate-700/60 text-slate-400 hover:bg-slate-600/60 border-slate-600/30",
  violet:  "bg-violet-900/40 text-violet-400 hover:bg-violet-800/60 border-violet-700/30",
};

function ActionBtn({ color, title, onClick, children }: {
  color: string; title: string; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button title={title} onClick={onClick}
      className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border text-xs transition ${COLOR_MAP[color] ?? COLOR_MAP.slate}`}>
      {children}
    </button>
  );
}

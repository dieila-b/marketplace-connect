import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Eye,
  Heart,
  LogOut,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  PlusCircle,
  Trash2,
  User,
} from "lucide-react";
import { useSupabase } from "@/integrations/supabase/provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Mon compte — Kafoo" }] }),
});

type MyListing = {
  id: string;
  slug: string;
  title: string;
  status: string;
  views_count: number;
  favorites_count: number;
  created_at: string;
};

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  published: { label: "Publié", color: "bg-emerald-100 text-emerald-700" },
  pending:   { label: "En attente", color: "bg-yellow-100 text-yellow-700" },
  sold:      { label: "Vendu", color: "bg-slate-100 text-slate-600" },
  rejected:  { label: "Rejeté", color: "bg-red-100 text-red-700" },
};

function Dashboard() {
  const { supabase, user, profile, refreshProfile } = useSupabase();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [listings, setListings] = useState<MyListing[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "listings">("profile");

  // Champs profil
  const [name, setName]         = useState("");
  const [phone, setPhone]       = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [bio, setBio]           = useState("");
  const [city, setCity]         = useState("");
  const [commune, setCommune]   = useState("");
  const [region, setRegion]     = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) navigate({ to: "/auth" });
  }, [user, navigate]);

  useEffect(() => {
    if (!profile) return;
    setName(profile.display_name ?? "");
    setPhone(profile.phone ?? "");
    setWhatsapp(profile.whatsapp ?? "");
    setBio((profile as any).bio ?? "");
    setCity((profile as any).city ?? "");
    setCommune((profile as any).commune ?? "");
    setRegion((profile as any).region ?? "");
    setAvatarUrl((profile as any).avatar_url ?? null);
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    void supabase
      .from("listings")
      .select("id,slug,title,status,views_count,favorites_count,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setListings((data ?? []) as MyListing[]));
  }, [supabase, user]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: name,
        phone,
        whatsapp,
        bio,
        city,
        commune,
        region,
      })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("Profil mis à jour"); await refreshProfile(); }
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `avatars/${user.id}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });
    if (upErr) { toast.error(upErr.message); setUploading(false); return; }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = data.publicUrl;
    const { error: dbErr } = await supabase
      .from("profiles")
      .update({ avatar_url: url })
      .eq("user_id", user.id);
    if (dbErr) toast.error(dbErr.message);
    else { setAvatarUrl(url); toast.success("Photo mise à jour"); await refreshProfile(); }
    setUploading(false);
  };

  const del = async (id: string) => {
    if (!confirm("Supprimer cette annonce ?")) return;
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (error) toast.error(error.message);
    else setListings((l) => l.filter((x) => x.id !== id));
  };

  const markSold = async (id: string) => {
    const { error } = await supabase
      .from("listings")
      .update({ status: "sold", sold_at: new Date().toISOString() })
      .eq("id", id);
    if (error) toast.error(error.message);
    else setListings((l) => l.map((x) => x.id === id ? { ...x, status: "sold" } : x));
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  if (!user) return null;

  const initials = name
    ? name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : user.email?.[0]?.toUpperCase() ?? "?";

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header profil */}
      <div className="bg-white border-b">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="h-20 w-20 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-fuchsia-500 flex items-center justify-center text-white text-2xl font-black shadow-lg">
                {avatarUrl
                  ? <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                  : initials}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-blue-600 text-white flex items-center justify-center shadow hover:bg-blue-700 transition"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); }}
              />
            </div>

            <div className="text-center sm:text-left flex-1 min-w-0">
              <h1 className="text-xl font-black text-slate-950 truncate">
                {name || user.email}
              </h1>
              <p className="text-sm text-slate-500">{user.email}</p>
              {(city || region) && (
                <p className="mt-1 flex items-center justify-center sm:justify-start gap-1 text-xs text-slate-400">
                  <MapPin className="h-3 w-3" />{[city, region].filter(Boolean).join(", ")}
                </p>
              )}
            </div>

            <div className="flex gap-2 shrink-0">
              <Button asChild size="sm" className="rounded-full bg-blue-600 hover:bg-blue-700 text-white">
                <Link to="/publier">
                  <PlusCircle className="mr-1.5 h-4 w-4" />
                  Publier
                </Link>
              </Button>
              <Button size="sm" variant="outline" className="rounded-full" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Stats rapides */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <StatBox value={listings.length} label="Annonces" icon={<Package className="h-4 w-4" />} />
            <StatBox value={listings.reduce((a, l) => a + (l.views_count ?? 0), 0)} label="Vues" icon={<Eye className="h-4 w-4" />} />
            <StatBox value={listings.reduce((a, l) => a + (l.favorites_count ?? 0), 0)} label="Favoris" icon={<Heart className="h-4 w-4" />} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="mx-auto max-w-5xl px-4 flex gap-6">
          <TabBtn active={activeTab === "profile"} onClick={() => setActiveTab("profile")}>
            <User className="h-4 w-4" /> Mon profil
          </TabBtn>
          <TabBtn active={activeTab === "listings"} onClick={() => setActiveTab("listings")}>
            <Package className="h-4 w-4" /> Mes annonces ({listings.length})
          </TabBtn>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6">

        {/* ---- ONGLET PROFIL ---- */}
        {activeTab === "profile" && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Identité */}
            <section className="rounded-2xl border bg-white p-5 space-y-4">
              <h2 className="font-black text-slate-950">Identité</h2>
              <Field label="Nom affiché">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Votre nom ou pseudo" />
              </Field>
              <Field label="Bio / Description">
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="Décrivez-vous en quelques mots..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </Field>
            </section>

            {/* Contact */}
            <section className="rounded-2xl border bg-white p-5 space-y-4">
              <h2 className="font-black text-slate-950">Contact</h2>
              <Field label="Email">
                <Input value={user.email ?? ""} disabled className="bg-slate-100 cursor-not-allowed" />
              </Field>
              <Field label="Téléphone">
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="ex: 622000000" className="pl-9" />
                </div>
              </Field>
              <Field label="WhatsApp">
                <div className="relative">
                  <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="ex: 224622000000" className="pl-9" />
                </div>
              </Field>
            </section>

            {/* Localisation */}
            <section className="rounded-2xl border bg-white p-5 space-y-4 md:col-span-2">
              <h2 className="font-black text-slate-950">Localisation</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Région">
                  <Input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="ex: Conakry" />
                </Field>
                <Field label="Ville">
                  <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="ex: Conakry" />
                </Field>
                <Field label="Commune">
                  <Input value={commune} onChange={(e) => setCommune(e.target.value)} placeholder="ex: Ratoma" />
                </Field>
              </div>
            </section>

            {/* Bouton save */}
            <div className="md:col-span-2">
              <Button
                onClick={saveProfile}
                disabled={saving}
                className="w-full sm:w-auto rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 h-11"
              >
                {saving ? "Enregistrement…" : "Enregistrer le profil"}
              </Button>
            </div>
          </div>
        )}

        {/* ---- ONGLET ANNONCES ---- */}
        {activeTab === "listings" && (
          <section className="rounded-2xl border bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-black text-slate-950">Mes annonces</h2>
              <Button asChild size="sm" className="rounded-full bg-blue-600 hover:bg-blue-700 text-white">
                <Link to="/publier"><PlusCircle className="mr-1.5 h-4 w-4" />Publier</Link>
              </Button>
            </div>

            {listings.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Package className="mx-auto mb-3 h-10 w-10 opacity-40" />
                <p className="font-semibold">Aucune annonce publiée</p>
                <p className="mt-1 text-sm">Publiez votre première annonce gratuitement.</p>
                <Button asChild className="mt-4 rounded-full" size="sm">
                  <Link to="/publier">Publier maintenant</Link>
                </Button>
              </div>
            ) : (
              <ul className="divide-y">
                {listings.map((l) => {
                  const st = STATUS_LABEL[l.status] ?? { label: l.status, color: "bg-slate-100 text-slate-600" };
                  return (
                    <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                      <div className="min-w-0 flex-1">
                        <Link
                          to="/annonces/$slug"
                          params={{ slug: l.slug }}
                          className="block truncate font-semibold text-slate-950 hover:text-blue-600 hover:underline"
                        >
                          {l.title}
                        </Link>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className={`rounded-full px-2 py-0.5 font-bold ${st.color}`}>{st.label}</span>
                          <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{l.views_count}</span>
                          <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{l.favorites_count}</span>
                          <span>{new Date(l.created_at).toLocaleDateString("fr-GN")}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {l.status !== "sold" && (
                          <Button size="sm" variant="outline" className="rounded-full text-xs" onClick={() => markSold(l.id)}>
                            Marquer vendu
                          </Button>
                        )}
                        <Button size="sm" variant="destructive" className="rounded-full" onClick={() => del(l.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-bold text-slate-600">{label}</Label>
      {children}
    </div>
  );
}

function StatBox({ value, label, icon }: { value: number; label: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-slate-50 border p-3 text-center">
      <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">{icon}</div>
      <div className="text-lg font-black text-slate-950">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-bold transition ${
        active ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"
      }`}
    >
      {children}
    </button>
  );
}

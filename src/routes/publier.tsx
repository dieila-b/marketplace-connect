import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useSupabase } from "@/integrations/supabase/provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/publier")({
  component: PublishPage,
  head: () => ({ meta: [{ title: "Publier une annonce — Kafoo" }] }),
});

type Opt = { id: string; name: string; slug: string };

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

function PublishPage() {
  const { supabase, user, profile } = useSupabase();
  const navigate = useNavigate();
  const [cats, setCats] = useState<Opt[]>([]);
  const [regions, setRegions] = useState<Opt[]>([]);
  const [cities, setCities] = useState<Opt[]>([]);
  const [communes, setCommunes] = useState<Opt[]>([]);
  const [districts, setDistricts] = useState<Opt[]>([]);

  const [form, setForm] = useState({
    title: "", description: "", price: "", currency: "GNF",
    condition: "bon", listing_type: "vente",
    category_id: "", region_id: "", city_id: "", commune_id: "", district_id: "",
    address_text: "", negotiable: false, phone_visible: true, whatsapp_enabled: true,
  });
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (!user) navigate({ to: "/auth" }); }, [user, navigate]);

  useEffect(() => {
    void (async () => {
      const [{ data: c }, { data: r }] = await Promise.all([
        supabase.from("categories").select("id,name,slug").is("parent_id", null).eq("is_active", true).order("sort_order"),
        supabase.from("regions").select("id,name,slug").eq("is_active", true).order("name"),
      ]);
      setCats((c ?? []) as Opt[]); setRegions((r ?? []) as Opt[]);
    })();
  }, [supabase]);

  useEffect(() => {
    if (!form.region_id) { setCities([]); return; }
    void supabase.from("cities").select("id,name,slug").eq("region_id", form.region_id).order("name")
      .then(({ data }) => setCities((data ?? []) as Opt[]));
  }, [supabase, form.region_id]);
  useEffect(() => {
    if (!form.city_id) { setCommunes([]); return; }
    void supabase.from("communes").select("id,name,slug").eq("city_id", form.city_id).order("name")
      .then(({ data }) => setCommunes((data ?? []) as Opt[]));
  }, [supabase, form.city_id]);
  useEffect(() => {
    if (!form.commune_id) { setDistricts([]); return; }
    void supabase.from("districts").select("id,name,slug").eq("commune_id", form.commune_id).order("name")
      .then(({ data }) => setDistricts((data ?? []) as Opt[]));
  }, [supabase, form.commune_id]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.title || !form.description || !form.category_id) { toast.error("Titre, description et catégorie requis"); return; }
    setSubmitting(true);
    try {
      const baseSlug = slugify(form.title) + "-" + Math.random().toString(36).slice(2, 7);
      const { data: created, error } = await supabase.from("listings").insert({
        user_id: user.id,
        category_id: form.category_id,
        title: form.title,
        slug: baseSlug,
        description: form.description,
        price: form.price ? Number(form.price) : null,
        currency: form.currency,
        condition: form.condition,
        listing_type: form.listing_type,
        seller_type: profile?.account_type ?? "particulier",
        region_id: form.region_id || null,
        city_id: form.city_id || null,
        commune_id: form.commune_id || null,
        district_id: form.district_id || null,
        address_text: form.address_text || null,
        negotiable: form.negotiable,
        phone_visible: form.phone_visible,
        whatsapp_enabled: form.whatsapp_enabled,
        status: "published",
        published_at: new Date().toISOString(),
      }).select("id,slug").maybeSingle();
      if (error || !created) throw error ?? new Error("Création échouée");

      // Upload images
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const path = `${user.id}/${created.id}/${Date.now()}-${i}-${f.name}`;
        const { error: upErr } = await supabase.storage.from("listings").upload(path, f, { upsert: false });
        if (upErr) { toast.error("Upload image : " + upErr.message); continue; }
        const { data: pub } = supabase.storage.from("listings").getPublicUrl(path);
        await supabase.from("listing_images").insert({
          listing_id: created.id, image_url: pub.publicUrl, storage_path: path,
          is_main: i === 0, sort_order: i,
        });
      }
      toast.success("Annonce publiée !");
      navigate({ to: "/annonces/$slug", params: { slug: created.slug } });
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Publier une annonce</h1>
      <form onSubmit={submit} className="space-y-4 rounded-lg border bg-card p-6">
        <div><Label>Titre *</Label><Input value={form.title} onChange={(e) => set("title", e.target.value)} maxLength={120} required /></div>
        <div><Label>Description *</Label><Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={5} required /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Prix</Label><Input type="number" value={form.price} onChange={(e) => set("price", e.target.value)} /></div>
          <div>
            <Label>Devise</Label>
            <select className="mt-1 w-full rounded-md border bg-background px-2 py-2 text-sm" value={form.currency} onChange={(e) => set("currency", e.target.value)}>
              <option value="GNF">GNF</option><option value="EUR">EUR</option><option value="USD">USD</option><option value="XOF">XOF</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>État</Label>
            <select className="mt-1 w-full rounded-md border bg-background px-2 py-2 text-sm" value={form.condition} onChange={(e) => set("condition", e.target.value)}>
              <option value="neuf">Neuf</option><option value="tres_bon">Très bon état</option>
              <option value="bon">Bon état</option><option value="moyen">État moyen</option><option value="a_reparer">À réparer</option>
            </select>
          </div>
          <div>
            <Label>Type</Label>
            <select className="mt-1 w-full rounded-md border bg-background px-2 py-2 text-sm" value={form.listing_type} onChange={(e) => set("listing_type", e.target.value)}>
              <option value="vente">Vente</option><option value="echange">Échange</option><option value="don">Don</option><option value="recherche">Recherche</option>
            </select>
          </div>
        </div>
        <div>
          <Label>Catégorie *</Label>
          <select className="mt-1 w-full rounded-md border bg-background px-2 py-2 text-sm" value={form.category_id} onChange={(e) => set("category_id", e.target.value)} required>
            <option value="">Choisir…</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Région</Label>
            <select className="mt-1 w-full rounded-md border bg-background px-2 py-2 text-sm" value={form.region_id} onChange={(e) => { set("region_id", e.target.value); set("city_id",""); set("commune_id",""); set("district_id",""); }}>
              <option value="">Choisir…</option>{regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <Label>Ville</Label>
            <select className="mt-1 w-full rounded-md border bg-background px-2 py-2 text-sm" value={form.city_id} onChange={(e) => { set("city_id", e.target.value); set("commune_id",""); set("district_id",""); }} disabled={!cities.length}>
              <option value="">Choisir…</option>{cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <Label>Commune</Label>
            <select className="mt-1 w-full rounded-md border bg-background px-2 py-2 text-sm" value={form.commune_id} onChange={(e) => { set("commune_id", e.target.value); set("district_id",""); }} disabled={!communes.length}>
              <option value="">Choisir…</option>{communes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <Label>Quartier</Label>
            <select className="mt-1 w-full rounded-md border bg-background px-2 py-2 text-sm" value={form.district_id} onChange={(e) => set("district_id", e.target.value)} disabled={!districts.length}>
              <option value="">Choisir…</option>{districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </div>
        <div><Label>Adresse approximative</Label><Input value={form.address_text} onChange={(e) => set("address_text", e.target.value)} /></div>
        <div>
          <Label>Photos (la 1ère sera principale)</Label>
          <Input type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 8))} />
          {files.length > 0 && <p className="mt-1 text-xs text-muted-foreground">{files.length} fichier(s) sélectionné(s)</p>}
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.negotiable} onChange={(e) => set("negotiable", e.target.checked)} /> Prix négociable</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.phone_visible} onChange={(e) => set("phone_visible", e.target.checked)} /> Afficher mon téléphone</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.whatsapp_enabled} onChange={(e) => set("whatsapp_enabled", e.target.checked)} /> Activer WhatsApp</label>
        </div>
        <Button type="submit" className="w-full" disabled={submitting}>{submitting ? "Publication…" : "Publier l'annonce"}</Button>
      </form>
    </main>
  );
}

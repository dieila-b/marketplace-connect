import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, Crosshair, Loader2, MapPin, Navigation, Trash2 } from "lucide-react";
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
  const [submittedListing, setSubmittedListing] = useState<{
    id: string;
    slug: string;
    title: string;
  } | null>(null);
  const [geoPosition, setGeoPosition] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number | null;
  } | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState("");

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

  const detectLocation = () => {
    setGeoError("");

    if (!("geolocation" in navigator)) {
      const message = "La géolocalisation n'est pas disponible sur cet appareil.";
      setGeoError(message);
      toast.error(message);
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoPosition({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Number.isFinite(position.coords.accuracy)
            ? position.coords.accuracy
            : null,
        });
        setLocating(false);
        toast.success("Position actuelle détectée.");
      },
      (error) => {
        let message = "Impossible de récupérer votre position.";

        if (error.code === error.PERMISSION_DENIED) {
          message = "Autorisez l'accès à votre position dans les réglages du navigateur.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = "Votre position est momentanément indisponible.";
        } else if (error.code === error.TIMEOUT) {
          message = "La détection de position a pris trop de temps. Réessayez.";
        }

        setGeoPosition(null);
        setGeoError(message);
        setLocating(false);
        toast.error(message);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 60000,
      },
    );
  };

  const clearLocation = () => {
    setGeoPosition(null);
    setGeoError("");
    toast.success("Position GPS retirée de l'annonce.");
  };

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
        latitude: geoPosition?.latitude ?? null,
        longitude: geoPosition?.longitude ?? null,
        location_accuracy: geoPosition?.accuracy ?? null,
        negotiable: form.negotiable,
        phone_visible: form.phone_visible,
        whatsapp_enabled: form.whatsapp_enabled,
        // Une annonce n'est visible publiquement qu'après validation admin.
        status: "pending",
      }).select("id,slug").single();
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
      setSubmittedListing({
        id: created.id,
        slug: created.slug,
        title: form.title.trim(),
      });

      toast.success("Annonce envoyée pour validation", {
        description:
          "La validation par l'équipe Kafoo peut prendre jusqu'à 24 heures.",
        duration: 8000,
      });
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedListing) {
    return (
      <main className="min-h-[70vh] bg-slate-50 px-4 py-10 sm:py-16">
        <div className="mx-auto w-full max-w-2xl">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
            <div className="border-b border-emerald-100 bg-emerald-50/70 px-6 py-7 text-center sm:px-8">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="h-7 w-7" />
              </div>

              <h1 className="mt-4 text-2xl font-black text-slate-950">
                Annonce envoyée avec succès
              </h1>

              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
                Votre annonce « {submittedListing.title} » a bien été enregistrée.
              </p>
            </div>

            <div className="space-y-5 px-6 py-7 sm:px-8">
              <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                    <Clock3 className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="text-sm font-black text-slate-950">
                      Validation administrative obligatoire
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Avant d'apparaître publiquement sur Kafoo, votre annonce
                      doit être vérifiée et approuvée par un administrateur.
                      Cette validation peut prendre jusqu'à 24 heures.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-black text-slate-800">
                  Que se passe-t-il maintenant ?
                </p>

                <div className="mt-3 space-y-2.5 text-sm leading-6 text-slate-600">
                  <p>
                    • Votre annonce est actuellement au statut
                    <strong> « En attente de validation »</strong>.
                  </p>
                  <p>
                    • L'équipe Kafoo vérifie les informations, le contenu et les photos.
                  </p>
                  <p>
                    • Après approbation, l'annonce devient automatiquement visible
                    dans la liste des annonces.
                  </p>
                </div>
              </div>

              <p className="text-center text-xs leading-5 text-slate-400">
                Vous pouvez suivre son statut depuis votre espace personnel,
                dans « Mes annonces ».
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-xl font-black"
                  onClick={() => {
                    setSubmittedListing(null);
                    setForm({
                      title: "",
                      description: "",
                      price: "",
                      currency: "GNF",
                      condition: "bon",
                      listing_type: "vente",
                      category_id: "",
                      region_id: "",
                      city_id: "",
                      commune_id: "",
                      district_id: "",
                      address_text: "",
                      negotiable: false,
                      phone_visible: true,
                      whatsapp_enabled: true,
                    });
                    setFiles([]);
                    setGeoPosition(null);
                    setGeoError("");
                    setCities([]);
                    setCommunes([]);
                    setDistricts([]);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  Publier une autre annonce
                </Button>

                <Button
                  type="button"
                  className="h-11 rounded-xl bg-blue-600 font-black hover:bg-blue-700"
                  onClick={() => navigate({ to: "/dashboard" })}
                >
                  Voir mes annonces
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-950">Publier une annonce</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Votre annonce sera soumise à validation avant d'être visible publiquement.
        </p>
      </div>
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
        <div>
          <Label>Adresse approximative</Label>
          <Input
            value={form.address_text}
            onChange={(e) => set("address_text", e.target.value)}
            placeholder="Ex. près du carrefour, côté station-service..."
          />
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Navigation className="h-4 w-4 text-blue-600" />
                Position actuelle
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Ajoutez votre position GPS pour permettre les recherches autour de vous.
                Les coordonnées exactes n'ont pas besoin d'être affichées publiquement.
              </p>
            </div>

            {!geoPosition ? (
              <Button
                type="button"
                variant="outline"
                onClick={detectLocation}
                disabled={locating}
                className="shrink-0 rounded-xl border-blue-200 bg-white text-blue-700 hover:bg-blue-50"
              >
                {locating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Crosshair className="mr-2 h-4 w-4" />
                )}
                {locating ? "Localisation..." : "Utiliser ma position"}
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={clearLocation}
                className="shrink-0 rounded-xl border-red-200 bg-white text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Retirer
              </Button>
            )}
          </div>

          {geoPosition && (
            <div className="mt-3 rounded-xl bg-white p-3 text-xs text-slate-600">
              <p className="flex items-center gap-2 font-bold text-emerald-600">
                <MapPin className="h-4 w-4" />
                Position détectée
              </p>
              <p className="mt-1">
                Précision estimée :{" "}
                {geoPosition.accuracy != null
                  ? `${Math.round(geoPosition.accuracy)} m`
                  : "non disponible"}
              </p>
            </div>
          )}

          {geoError && (
            <p className="mt-3 text-xs font-semibold text-red-600">{geoError}</p>
          )}
        </div>
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
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-black text-amber-950">
                Validation avant publication
              </p>
              <p className="mt-1 text-xs leading-5 text-amber-800">
                Après l'envoi, votre annonce sera contrôlée par un administrateur.
                Son apparition sur Kafoo peut prendre jusqu'à 24 heures.
              </p>
            </div>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitting ? "Envoi pour validation…" : "Envoyer pour validation"}
        </Button>
      </form>
    </main>
  );
}

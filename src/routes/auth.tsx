import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  BriefcaseBusiness,
  Check,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { useSupabase } from "@/integrations/supabase/provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Connexion & inscription — Kafoo" },
      {
        name: "description",
        content: "Connectez-vous ou créez gratuitement votre compte Kafoo.",
      },
    ],
  }),
});

type LocationOption = {
  id: string;
  name: string;
  slug: string;
};

type AccountType = "particulier" | "professionnel";

function AuthPage() {
  const { supabase, user } = useSupabase();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate({ to: "/dashboard" });
  }, [user, navigate]);

  return (
    <main className="min-h-[calc(100vh-64px)] bg-slate-50 px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            Bienvenue sur Kafoo
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
            Connectez-vous ou créez gratuitement votre compte pour publier,
            contacter les vendeurs et gérer vos favoris.
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
          <Tabs defaultValue="signin">
            <div className="border-b border-slate-100 bg-slate-50/80 p-3 sm:p-4">
              <TabsList className="grid h-11 w-full grid-cols-2 rounded-xl bg-slate-100 p-1">
                <TabsTrigger value="signin" className="rounded-lg font-bold">
                  Connexion
                </TabsTrigger>
                <TabsTrigger value="signup" className="rounded-lg font-bold">
                  Inscription
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="signin" className="m-0">
              <SignIn supabase={supabase} />
            </TabsContent>
            <TabsContent value="signup" className="m-0">
              <SignUp supabase={supabase} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  );
}

function SignIn({ supabase }: { supabase: SupabaseClient }) {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: pwd,
    });

    setLoading(false);

    if (error) {
      toast.error(
        error.message === "Invalid login credentials"
          ? "Adresse e-mail ou mot de passe incorrect."
          : error.message,
      );
      return;
    }

    toast.success("Connexion réussie");
  };

  const resetPassword = async () => {
    if (!email.trim()) {
      toast.error("Saisissez d'abord votre adresse e-mail.");
      return;
    }

    setResetting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth`,
    });
    setResetting(false);

    if (error) toast.error(error.message);
    else toast.success("Un lien de réinitialisation a été envoyé par e-mail.");
  };

  return (
    <div className="p-5 sm:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-black text-slate-950">Heureux de vous revoir</h2>
        <p className="mt-1 text-sm text-slate-500">Accédez à votre espace Kafoo.</p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <Field label="Adresse e-mail" icon={<Mail className="h-4 w-4" />}>
          <Input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="exemple@email.com"
            className="h-11 rounded-xl"
            required
          />
        </Field>

        <Field label="Mot de passe" icon={<LockKeyhole className="h-4 w-4" />}>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              className="h-11 rounded-xl pr-11"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>

        <div className="flex justify-end">
          <button
            type="button"
            disabled={resetting}
            onClick={() => void resetPassword()}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 disabled:opacity-50"
          >
            {resetting ? "Envoi..." : "Mot de passe oublié ?"}
          </button>
        </div>

        <Button
          type="submit"
          className="h-11 w-full rounded-xl bg-blue-600 font-black hover:bg-blue-700"
          disabled={loading}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? "Connexion..." : "Se connecter"}
        </Button>
      </form>
    </div>
  );
}

function SignUp({ supabase }: { supabase: SupabaseClient }) {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [sameWhatsapp, setSameWhatsapp] = useState(true);
  const [type, setType] = useState<AccountType>("particulier");
  const [businessName, setBusinessName] = useState("");

  const [regions, setRegions] = useState<LocationOption[]>([]);
  const [cities, setCities] = useState<LocationOption[]>([]);
  const [communes, setCommunes] = useState<LocationOption[]>([]);
  const [regionId, setRegionId] = useState("");
  const [cityId, setCityId] = useState("");
  const [communeId, setCommuneId] = useState("");

  const [acceptTerms, setAcceptTerms] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void supabase
      .from("regions")
      .select("id,name,slug")
      .order("name")
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.warn("[Auth] Régions :", error);
        else setRegions((data ?? []) as LocationOption[]);
      });
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  useEffect(() => {
    setCityId("");
    setCommuneId("");
    setCommunes([]);

    if (!regionId) {
      setCities([]);
      return;
    }

    let cancelled = false;
    void supabase
      .from("cities")
      .select("id,name,slug")
      .eq("region_id", regionId)
      .order("name")
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.warn("[Auth] Villes :", error);
          setCities([]);
        } else setCities((data ?? []) as LocationOption[]);
      });

    return () => {
      cancelled = true;
    };
  }, [supabase, regionId]);

  useEffect(() => {
    setCommuneId("");
    if (!cityId) {
      setCommunes([]);
      return;
    }

    let cancelled = false;
    void supabase
      .from("communes")
      .select("id,name,slug")
      .eq("city_id", cityId)
      .order("name")
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.warn("[Auth] Communes :", error);
          setCommunes([]);
        } else setCommunes((data ?? []) as LocationOption[]);
      });

    return () => {
      cancelled = true;
    };
  }, [supabase, cityId]);

  useEffect(() => {
    if (sameWhatsapp) setWhatsapp(phone);
  }, [phone, sameWhatsapp]);

  const passwordRules = useMemo(
    () => ({
      length: pwd.length >= 8,
      letter: /[A-Za-zÀ-ÿ]/.test(pwd),
      number: /\d/.test(pwd),
      match: Boolean(pwd) && pwd === confirmPwd,
    }),
    [pwd, confirmPwd],
  );

  const selectedRegion = regions.find((x) => x.id === regionId);
  const selectedCity = cities.find((x) => x.id === cityId);
  const selectedCommune = communes.find((x) => x.id === communeId);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const cleanWhatsapp = (sameWhatsapp ? phone : whatsapp).trim();
    const cleanBusinessName = businessName.trim();

    if (!cleanName || !cleanEmail || !cleanPhone) {
      toast.error("Nom, e-mail et téléphone sont obligatoires.");
      return;
    }
    if (!passwordRules.length || !passwordRules.letter || !passwordRules.number) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères, une lettre et un chiffre.");
      return;
    }
    if (!passwordRules.match) {
      toast.error("Les deux mots de passe ne correspondent pas.");
      return;
    }
    if (type === "professionnel" && !cleanBusinessName) {
      toast.error("Indiquez le nom de votre entreprise ou boutique.");
      return;
    }
    if (!acceptTerms) {
      toast.error("Vous devez accepter les conditions d'utilisation et la politique de confidentialité.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: pwd,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          display_name: cleanName,
          account_type: type,
          phone: cleanPhone,
          whatsapp: cleanWhatsapp || null,
          business_name: type === "professionnel" ? cleanBusinessName : null,
          region_id: regionId || null,
          region_name: selectedRegion?.name ?? null,
          city_id: cityId || null,
          city_name: selectedCity?.name ?? null,
          commune_id: communeId || null,
          commune_name: selectedCommune?.name ?? null,
          marketing_opt_in: marketingOptIn,
          terms_accepted: true,
          terms_accepted_at: new Date().toISOString(),
        },
      },
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    if (data.user && data.session) {
      const profileUpdate = await supabase
        .from("profiles")
        .update({ display_name: cleanName, phone: cleanPhone })
        .eq("user_id", data.user.id);

      if (profileUpdate.error) {
        console.warn("[Auth] Synchronisation profil :", profileUpdate.error);
      }
    }

    toast.success(
      data.session
        ? "Compte créé avec succès."
        : "Compte créé. Consultez votre e-mail pour confirmer votre inscription.",
    );
  };

  return (
    <div className="p-5 sm:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-black text-slate-950">Créer votre compte</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Quelques informations suffisent pour commencer à acheter, vendre et échanger sur Kafoo.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-7">
        <FormSection
          title="Informations personnelles"
          description="Ces informations servent à identifier votre profil et faciliter les échanges."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom affiché *" icon={<UserRound className="h-4 w-4" />}>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Mamadou Barry" className="h-11 rounded-xl" required />
            </Field>
            <Field label="Adresse e-mail *" icon={<Mail className="h-4 w-4" />}>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="exemple@email.com" className="h-11 rounded-xl" required />
            </Field>
            <Field label="Téléphone *" icon={<Phone className="h-4 w-4" />}>
              <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+224 6XX XX XX XX" className="h-11 rounded-xl" required />
            </Field>
            <Field label="WhatsApp" icon={<Phone className="h-4 w-4" />}>
              <Input type="tel" value={sameWhatsapp ? phone : whatsapp} onChange={(e) => setWhatsapp(e.target.value)} disabled={sameWhatsapp} placeholder="+224 6XX XX XX XX" className="h-11 rounded-xl disabled:bg-slate-50" />
            </Field>
          </div>

          <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-600">
            <input type="checkbox" checked={sameWhatsapp} onChange={(e) => setSameWhatsapp(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
            Mon numéro WhatsApp est le même que mon téléphone
          </label>
        </FormSection>

        <FormSection title="Sécurité du compte" description="Choisissez un mot de passe difficile à deviner.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Mot de passe *" icon={<LockKeyhole className="h-4 w-4" />}>
              <PasswordInput value={pwd} onChange={setPwd} visible={showPassword} onToggle={() => setShowPassword((v) => !v)} />
            </Field>
            <Field label="Confirmer le mot de passe *" icon={<LockKeyhole className="h-4 w-4" />}>
              <PasswordInput value={confirmPwd} onChange={setConfirmPwd} visible={showConfirmation} onToggle={() => setShowConfirmation((v) => !v)} />
            </Field>
          </div>

          <div className="mt-3 grid gap-2 rounded-2xl bg-slate-50 p-3 sm:grid-cols-3">
            <PasswordRule valid={passwordRules.length} label="8 caractères minimum" />
            <PasswordRule valid={passwordRules.letter} label="Au moins une lettre" />
            <PasswordRule valid={passwordRules.number} label="Au moins un chiffre" />
          </div>
        </FormSection>

        <FormSection title="Type de compte" description="Choisissez le profil qui correspond à votre utilisation de Kafoo.">
          <div className="grid gap-3 sm:grid-cols-2">
            <AccountTypeButton
              active={type === "particulier"}
              icon={<UserRound className="h-5 w-5" />}
              title="Particulier"
              description="Acheter et vendre occasionnellement."
              onClick={() => setType("particulier")}
            />
            <AccountTypeButton
              active={type === "professionnel"}
              icon={<BriefcaseBusiness className="h-5 w-5" />}
              title="Professionnel"
              description="Boutique, entreprise ou vendeur régulier."
              onClick={() => setType("professionnel")}
            />
          </div>

          {type === "professionnel" && (
            <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
              <Field label="Nom de l'entreprise / boutique *" icon={<BriefcaseBusiness className="h-4 w-4" />}>
                <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Ex. Barry Mobile" className="h-11 rounded-xl bg-white" required />
              </Field>
            </div>
          )}
        </FormSection>

        <FormSection title="Localisation" description="Facultatif, mais utile pour les annonces proches de vous.">
          <div className="grid gap-4 sm:grid-cols-3">
            <SelectField label="Région" value={regionId} onChange={setRegionId} rows={regions} placeholder="Choisir" />
            <SelectField label="Ville" value={cityId} onChange={setCityId} rows={cities} placeholder={regionId ? "Choisir" : "Région d'abord"} disabled={!regionId} />
            <SelectField label="Commune" value={communeId} onChange={setCommuneId} rows={communes} placeholder={cityId ? "Choisir" : "Ville d'abord"} disabled={!cityId} />
          </div>
        </FormSection>

        <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300" />
            <span className="text-xs leading-5 text-slate-600">
              J'accepte les conditions d'utilisation et la politique de confidentialité de Kafoo. *
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3">
            <input type="checkbox" checked={marketingOptIn} onChange={(e) => setMarketingOptIn(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300" />
            <span className="text-xs leading-5 text-slate-600">
              Je souhaite recevoir les nouveautés, conseils et offres Kafoo.
            </span>
          </label>
        </div>

        <Button type="submit" className="h-12 w-full rounded-xl bg-blue-600 text-sm font-black shadow-lg shadow-blue-600/15 hover:bg-blue-700" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? "Création du compte..." : "Créer mon compte gratuitement"}
        </Button>
      </form>
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 flex items-center gap-2 text-xs font-bold text-slate-700">
        {icon && <span className="text-slate-400">{icon}</span>}
        {label}
      </Label>
      {children}
    </div>
  );
}

function FormSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section>
      <div className="mb-4">
        <h3 className="text-sm font-black text-slate-950">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      </div>
      {children}
    </section>
  );
}

function PasswordInput({ value, onChange, visible, onToggle }: { value: string; onChange: (value: string) => void; visible: boolean; onToggle: () => void }) {
  return (
    <div className="relative">
      <Input type={visible ? "text" : "password"} minLength={8} value={value} onChange={(e) => onChange(e.target.value)} autoComplete="new-password" className="h-11 rounded-xl pr-11" required />
      <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700" aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}>
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function PasswordRule({ valid, label }: { valid: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2 text-[11px] font-semibold ${valid ? "text-emerald-600" : "text-slate-400"}`}>
      <span className={`flex h-4 w-4 items-center justify-center rounded-full ${valid ? "bg-emerald-100" : "bg-slate-200"}`}>
        <Check className="h-2.5 w-2.5" />
      </span>
      {label}
    </div>
  );
}

function AccountTypeButton({ active, icon, title, description, onClick }: { active: boolean; icon: ReactNode; title: string; description: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-2xl border p-4 text-left transition ${active ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"}`}>
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>
        {icon}
      </div>
      <p className="text-sm font-black text-slate-950">{title}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
    </button>
  );
}

function SelectField({ label, value, onChange, rows, placeholder, disabled = false }: { label: string; value: string; onChange: (value: string) => void; rows: LocationOption[]; placeholder: string; disabled?: boolean }) {
  return (
    <div>
      <Label className="mb-1.5 flex items-center gap-2 text-xs font-bold text-slate-700">
        <MapPin className="h-4 w-4 text-slate-400" />
        {label}
      </Label>
      <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400">
        <option value="">{placeholder}</option>
        {rows.map((row) => (
          <option key={row.id} value={row.id}>{row.name}</option>
        ))}
      </select>
    </div>
  );
}

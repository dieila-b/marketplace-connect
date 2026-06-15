import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useSupabase } from "@/integrations/supabase/provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({ meta: [{ title: "Connexion — Kafoo" }] }),
});

function AuthPage() {
  const { supabase, user } = useSupabase();
  const navigate = useNavigate();
  useEffect(() => { if (user) navigate({ to: "/dashboard" }); }, [user, navigate]);

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-6 text-center text-2xl font-bold">Bienvenue sur Kafoo</h1>
      <Tabs defaultValue="signin">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signin">Connexion</TabsTrigger>
          <TabsTrigger value="signup">Inscription</TabsTrigger>
        </TabsList>
        <TabsContent value="signin"><SignIn supabase={supabase} /></TabsContent>
        <TabsContent value="signup"><SignUp supabase={supabase} /></TabsContent>
      </Tabs>
    </main>
  );
}

function SignIn({ supabase }: { supabase: ReturnType<typeof useSupabase>["supabase"] }) {
  const [email, setEmail] = useState(""); const [pwd, setPwd] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pwd });
    setLoading(false);
    if (error) toast.error(error.message); else toast.success("Connecté");
  };
  return (
    <form onSubmit={submit} className="mt-4 space-y-3">
      <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
      <div><Label>Mot de passe</Label><Input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} required /></div>
      <Button type="submit" className="w-full" disabled={loading}>Se connecter</Button>
    </form>
  );
}

function SignUp({ supabase }: { supabase: ReturnType<typeof useSupabase>["supabase"] }) {
  const [email, setEmail] = useState(""); const [pwd, setPwd] = useState("");
  const [name, setName] = useState(""); const [type, setType] = useState<"particulier" | "professionnel">("particulier");
  const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password: pwd,
      options: {
        emailRedirectTo: window.location.origin,
        data: { display_name: name, account_type: type },
      },
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Compte créé. Vérifiez votre email si la confirmation est activée.");
  };
  return (
    <form onSubmit={submit} className="mt-4 space-y-3">
      <div><Label>Nom affiché</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
      <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
      <div><Label>Mot de passe (min. 6)</Label><Input type="password" minLength={6} value={pwd} onChange={(e) => setPwd(e.target.value)} required /></div>
      <div>
        <Label>Type de compte</Label>
        <div className="mt-1 flex gap-2">
          {(["particulier", "professionnel"] as const).map((t) => (
            <button type="button" key={t}
              onClick={() => setType(t)}
              className={"flex-1 rounded-md border px-3 py-2 text-sm capitalize " + (type === t ? "border-primary bg-primary text-primary-foreground" : "bg-background")}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>Créer mon compte</Button>
    </form>
  );
}

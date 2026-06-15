import { Link, useNavigate } from "@tanstack/react-router";
import { useSupabase } from "@/integrations/supabase/provider";
import { Button } from "@/components/ui/button";
import { Search, PlusCircle, Heart, MessageCircle, User as UserIcon, LogOut } from "lucide-react";

export function AppHeader() {
  const { user, profile, isAdmin, supabase } = useSupabase();
  const navigate = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <Link to="/" className="text-xl font-bold tracking-tight text-primary">
          Kafoo
        </Link>
        <nav className="hidden flex-1 items-center gap-4 md:flex">
          <Link to="/annonces" className="text-sm text-muted-foreground hover:text-foreground">
            <span className="inline-flex items-center gap-1"><Search className="h-4 w-4" /> Annonces</span>
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link to="/publier">
            <Button size="sm" className="gap-1">
              <PlusCircle className="h-4 w-4" /> Publier
            </Button>
          </Link>
          {user ? (
            <>
              <Link to="/favoris" className="hidden md:inline-flex">
                <Button size="icon" variant="ghost" aria-label="Favoris"><Heart className="h-4 w-4" /></Button>
              </Link>
              <Link to="/messages" className="hidden md:inline-flex">
                <Button size="icon" variant="ghost" aria-label="Messages"><MessageCircle className="h-4 w-4" /></Button>
              </Link>
              <Link to="/dashboard">
                <Button size="sm" variant="outline" className="gap-1">
                  <UserIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">{profile?.display_name ?? "Mon compte"}</span>
                </Button>
              </Link>
              {isAdmin && (
                <Link to="/admin" className="hidden md:inline-flex">
                  <Button size="sm" variant="secondary">Admin</Button>
                </Link>
              )}
              <Button size="icon" variant="ghost" onClick={signOut} aria-label="Déconnexion">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button size="sm" variant="outline">Connexion</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

import { Link } from "@tanstack/react-router";
import { Heart, MessageCircle, Plus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/MobileNav";
import { useSupabase } from "@/integrations/supabase/provider";

export function AppHeader() {
  const { user } = useSupabase();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <MobileNav />
          <Link to="/" className="text-xl font-bold tracking-tight">
            Kafoo
          </Link>
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          <Link to="/annonces" className="px-3 py-2 text-sm font-medium hover:text-primary">
            Annonces
          </Link>
          <Link to="/favoris" className="px-3 py-2 text-sm font-medium hover:text-primary">
            <Heart className="h-4 w-4" />
          </Link>
          <Link to="/messages" className="px-3 py-2 text-sm font-medium hover:text-primary">
            <MessageCircle className="h-4 w-4" />
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="gap-1">
            <Link to="/publier">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Publier</span>
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to={user ? "/dashboard" : "/auth"}>
              <User className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

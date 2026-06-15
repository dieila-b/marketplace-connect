import { Link, useNavigate } from "@tanstack/react-router";
import {
  Heart,
  LogOut,
  Menu,
  MessageCircle,
  PlusCircle,
  Search,
  User as UserIcon,
} from "lucide-react";

import { useSupabase } from "@/integrations/supabase/provider";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  const { user, profile, isAdmin, supabase } = useSupabase();
  const navigate = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-fuchsia-600 text-sm font-black text-white shadow-sm">
            K
          </span>
          <span className="text-xl font-black tracking-tight text-slate-950">
            Kafoo
          </span>
        </Link>

        <nav className="ml-3 hidden flex-1 items-center gap-2 md:flex">
          <Link
            to="/annonces"
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
          >
            <Search className="h-4 w-4" />
            Annonces
          </Link>
        </nav>

        <div className="ml-auto flex min-w-0 items-center justify-end gap-2">
          <Link to="/publier" className="shrink-0">
            <Button
              size="sm"
              className="h-9 rounded-full bg-slate-950 px-3 text-xs font-bold text-white hover:bg-slate-800 sm:px-4 sm:text-sm"
            >
              <PlusCircle className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Publier</span>
            </Button>
          </Link>

          {user ? (
            <>
              <Link to="/favoris" className="hidden lg:inline-flex">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 rounded-full"
                  aria-label="Favoris"
                >
                  <Heart className="h-4 w-4" />
                </Button>
              </Link>

              <Link to="/messages" className="hidden lg:inline-flex">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 rounded-full"
                  aria-label="Messages"
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </Link>

              <Link to="/dashboard" className="hidden sm:inline-flex">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 max-w-[180px] rounded-full px-3 text-xs font-bold sm:text-sm"
                >
                  <UserIcon className="mr-1 h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {profile?.display_name ?? "Mon compte"}
                  </span>
                </Button>
              </Link>

              {isAdmin && (
                <Link to="/admin" className="hidden md:inline-flex">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-9 rounded-full px-3 text-xs font-bold sm:text-sm"
                  >
                    Admin
                  </Button>
                </Link>
              )}

              <Button
                size="icon"
                variant="ghost"
                onClick={signOut}
                className="hidden h-9 w-9 rounded-full sm:inline-flex"
                aria-label="Déconnexion"
              >
                <LogOut className="h-4 w-4" />
              </Button>

              <Link to="/dashboard" className="inline-flex sm:hidden">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-9 w-9 rounded-full"
                  aria-label="Mon compte"
                >
                  <UserIcon className="h-4 w-4" />
                </Button>
              </Link>
            </>
          ) : (
            <Link to="/auth" className="shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="h-9 rounded-full px-3 text-xs font-bold sm:px-4 sm:text-sm"
              >
                Connexion
              </Button>
            </Link>
          )}

          <Link to="/annonces" className="inline-flex md:hidden">
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9 rounded-full"
              aria-label="Menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

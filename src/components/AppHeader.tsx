import { Link } from "@tanstack/react-router";
import { Heart, MessageCircle, PlusSquare, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary">Kafoo</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link to="/annonces" className="text-foreground/80 hover:text-foreground">
            Annonces
          </Link>
          <Link to="/publier" className="text-foreground/80 hover:text-foreground">
            Publier
          </Link>
          <Link to="/messages" className="text-foreground/80 hover:text-foreground">
            Messages
          </Link>
          <Link to="/favoris" className="text-foreground/80 hover:text-foreground">
            Favoris
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/favoris" className="hidden md:inline-flex">
            <Button variant="ghost" size="icon" aria-label="Favoris">
              <Heart className="h-5 w-5" />
            </Button>
          </Link>
          <Link to="/messages" className="hidden md:inline-flex">
            <Button variant="ghost" size="icon" aria-label="Messages">
              <MessageCircle className="h-5 w-5" />
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="ghost" size="icon" aria-label="Compte">
              <User className="h-5 w-5" />
            </Button>
          </Link>
          <Link to="/publier">
            <Button size="sm" className="gap-2">
              <PlusSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Publier</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

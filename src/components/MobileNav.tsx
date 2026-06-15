import { Link } from "@tanstack/react-router";
import { Home, Search, PlusSquare, MessageCircle, User } from "lucide-react";

export function MobileNav() {
  const items = [
    { to: "/", label: "Accueil", icon: Home },
    { to: "/annonces", label: "Rechercher", icon: Search },
    { to: "/publier", label: "Publier", icon: PlusSquare },
    { to: "/messages", label: "Messages", icon: MessageCircle },
    { to: "/dashboard", label: "Compte", icon: User },
  ] as const;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background md:hidden">
      <ul className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <Link
              to={to}
              className="flex flex-col items-center gap-1 px-3 py-1 text-[11px] text-muted-foreground"
              activeProps={{ className: "flex flex-col items-center gap-1 px-3 py-1 text-[11px] text-primary" }}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

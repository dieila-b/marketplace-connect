import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  Activity,
  AlertTriangle,
  Bell,
  Building2,
  CheckCircle,
  CircleDollarSign,
  Edit3,
  Eye,
  FileText,
  Globe,
  HelpCircle,
  Home,
  Image as ImageIcon,
  LayoutDashboard,
  Link2,
  ListTree,
  Lock,
  LogOut,
  MapPin,
  Megaphone,
  Menu,
  Newspaper,
  Package,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  Shield,
  Star,
  Tags,
  Trash2,
  TrendingUp,
  Upload,
  UserCog,
  Users,
  X,
  XCircle,
} from "lucide-react";

import { useSupabase } from "@/integrations/supabase/provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({
    meta: [
      { title: "Administration — Kafoo" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

type Tab =
  | "dashboard"
  | "listings"
  | "users"
  | "shops"
  | "reports"
  | "categories"
  | "locations"
  | "media"
  | "homepage"
  | "pages"
  | "sections"
  | "menus"
  | "banners"
  | "faq"
  | "testimonials"
  | "blog"
  | "sponsored"
  | "ads"
  | "notifications"
  | "seo"
  | "redirects"
  | "settings"
  | "admins"
  | "roles"
  | "audit";

type NavItem = {
  id: Tab;
  label: string;
  icon: ReactNode;
  color: string;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "select"
  | "datetime"
  | "json"
  | "tags";

type FieldConfig = {
  key: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: string }>;
  defaultValue?: unknown;
  list?: boolean;
};

type CrudConfig = {
  table: string;
  title: string;
  description: string;
  singular: string;
  fields: FieldConfig[];
  orderBy?: string;
  ascending?: boolean;
  select?: string;
  userColumns?: {
    createdBy?: string;
    updatedBy?: string;
  };
  transformBeforeSave?: (
    payload: Record<string, unknown>,
  ) => Record<string, unknown>;
};

type AdminListing = {
  id: string;
  title: string;
  slug: string;
  status: string;
  created_at: string;
  price: number;
  currency: string;
  user_id: string;
  is_featured?: boolean;
  is_sponsored?: boolean;
  sponsored_until?: string | null;
  region?: { name: string } | null;
  city?: { name: string } | null;
};

type AdminUser = {
  id: string;
  user_id: string;
  display_name: string | null;
  phone: string | null;
  created_at: string;
  is_admin: boolean;
  is_suspended?: boolean;
  admin_label?: string | null;
};

type AdminReport = {
  id: string;
  reason: string;
  status: string;
  created_at: string;
  listing?: { title: string; slug: string } | null;
};

type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  is_active: boolean;
  sort_order: number;
};

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> =
  {
    active: { label: "Actif", color: "text-emerald-700", bg: "bg-emerald-100" },
    published: {
      label: "Publié",
      color: "text-emerald-700",
      bg: "bg-emerald-100",
    },
    pending: {
      label: "En attente",
      color: "text-yellow-700",
      bg: "bg-yellow-100",
    },
    draft: { label: "Brouillon", color: "text-slate-600", bg: "bg-slate-100" },
    rejected: { label: "Rejeté", color: "text-red-700", bg: "bg-red-100" },
    suspended: {
      label: "Suspendu",
      color: "text-orange-700",
      bg: "bg-orange-100",
    },
    paused: {
      label: "En pause",
      color: "text-orange-700",
      bg: "bg-orange-100",
    },
    archived: { label: "Archivé", color: "text-slate-600", bg: "bg-slate-100" },
    sold: { label: "Vendu", color: "text-slate-600", bg: "bg-slate-100" },
    open: { label: "Ouvert", color: "text-red-700", bg: "bg-red-100" },
    resolved: {
      label: "Résolu",
      color: "text-emerald-700",
      bg: "bg-emerald-100",
    },
    sent: { label: "Envoyé", color: "text-emerald-700", bg: "bg-emerald-100" },
    scheduled: { label: "Planifié", color: "text-blue-700", bg: "bg-blue-100" },
    failed: { label: "Échec", color: "text-red-700", bg: "bg-red-100" },
  };

function Badge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? {
    label: status,
    color: "text-slate-600",
    bg: "bg-slate-100",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${cfg.bg} ${cfg.color}`}
    >
      {cfg.label}
    </span>
  );
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Vue d'ensemble",
    items: [
      {
        id: "dashboard",
        label: "Tableau de bord",
        icon: <LayoutDashboard className="h-4 w-4" />,
        color: "text-blue-400",
      },
    ],
  },
  {
    label: "Gestion",
    items: [
      {
        id: "listings",
        label: "Annonces",
        icon: <Package className="h-4 w-4" />,
        color: "text-violet-400",
      },
      {
        id: "users",
        label: "Utilisateurs",
        icon: <Users className="h-4 w-4" />,
        color: "text-emerald-400",
      },
      {
        id: "shops",
        label: "Boutiques",
        icon: <Building2 className="h-4 w-4" />,
        color: "text-cyan-400",
      },
      {
        id: "reports",
        label: "Signalements",
        icon: <AlertTriangle className="h-4 w-4" />,
        color: "text-red-400",
      },
    ],
  },
  {
    label: "Catalogue",
    items: [
      {
        id: "categories",
        label: "Catégories",
        icon: <Tags className="h-4 w-4" />,
        color: "text-orange-400",
      },
      {
        id: "locations",
        label: "Localisation",
        icon: <MapPin className="h-4 w-4" />,
        color: "text-sky-400",
      },
      {
        id: "media",
        label: "Médiathèque",
        icon: <ImageIcon className="h-4 w-4" />,
        color: "text-pink-400",
      },
    ],
  },
  {
    label: "CMS",
    items: [
      {
        id: "homepage",
        label: "Page d'accueil",
        icon: <Home className="h-4 w-4" />,
        color: "text-blue-400",
      },
      {
        id: "pages",
        label: "Pages",
        icon: <FileText className="h-4 w-4" />,
        color: "text-indigo-400",
      },
      {
        id: "sections",
        label: "Sections",
        icon: <ListTree className="h-4 w-4" />,
        color: "text-teal-400",
      },
      {
        id: "menus",
        label: "Menus",
        icon: <Menu className="h-4 w-4" />,
        color: "text-slate-300",
      },
      {
        id: "banners",
        label: "Bannières",
        icon: <Megaphone className="h-4 w-4" />,
        color: "text-fuchsia-400",
      },
      {
        id: "faq",
        label: "FAQ",
        icon: <HelpCircle className="h-4 w-4" />,
        color: "text-amber-400",
      },
      {
        id: "testimonials",
        label: "Témoignages",
        icon: <Star className="h-4 w-4" />,
        color: "text-yellow-400",
      },
      {
        id: "blog",
        label: "Blog / Actualités",
        icon: <Newspaper className="h-4 w-4" />,
        color: "text-lime-400",
      },
    ],
  },
  {
    label: "Marketing",
    items: [
      {
        id: "sponsored",
        label: "Annonces sponsorisées",
        icon: <TrendingUp className="h-4 w-4" />,
        color: "text-yellow-400",
      },
      {
        id: "ads",
        label: "Publicités",
        icon: <CircleDollarSign className="h-4 w-4" />,
        color: "text-emerald-400",
      },
      {
        id: "notifications",
        label: "Notifications",
        icon: <Bell className="h-4 w-4" />,
        color: "text-rose-400",
      },
    ],
  },
  {
    label: "Configuration",
    items: [
      {
        id: "seo",
        label: "SEO",
        icon: <Globe className="h-4 w-4" />,
        color: "text-cyan-400",
      },
      {
        id: "redirects",
        label: "Redirections",
        icon: <Link2 className="h-4 w-4" />,
        color: "text-indigo-400",
      },
      {
        id: "settings",
        label: "Paramètres",
        icon: <Settings className="h-4 w-4" />,
        color: "text-slate-400",
      },
    ],
  },
  {
    label: "Système",
    items: [
      {
        id: "admins",
        label: "Administrateurs",
        icon: <UserCog className="h-4 w-4" />,
        color: "text-blue-400",
      },
      {
        id: "roles",
        label: "Rôles & permissions",
        icon: <Lock className="h-4 w-4" />,
        color: "text-purple-400",
      },
      {
        id: "audit",
        label: "Journal d'activité",
        icon: <Activity className="h-4 w-4" />,
        color: "text-teal-400",
      },
    ],
  },
];

const ALL_NAV_ITEMS = NAV_SECTIONS.flatMap((section) => section.items);

const CRUD_CONFIGS: Partial<Record<Tab, CrudConfig>> = {
  shops: {
    table: "shops",
    title: "Boutiques & professionnels",
    description:
      "Validez, mettez en avant ou suspendez les boutiques professionnelles.",
    singular: "boutique",
    orderBy: "created_at",
    fields: [
      { key: "name", label: "Nom", required: true, list: true },
      { key: "slug", label: "Slug", required: true, list: true },
      { key: "description", label: "Description", type: "textarea" },
      { key: "phone", label: "Téléphone", list: true },
      { key: "email", label: "E-mail", list: true },
      { key: "address", label: "Adresse" },
      { key: "logo_url", label: "URL du logo" },
      { key: "banner_url", label: "URL de la bannière" },
      {
        key: "status",
        label: "Statut",
        type: "select",
        defaultValue: "pending",
        list: true,
        options: [
          { label: "En attente", value: "pending" },
          { label: "Active", value: "active" },
          { label: "Suspendue", value: "suspended" },
          { label: "Rejetée", value: "rejected" },
        ],
      },
      {
        key: "is_verified",
        label: "Vérifiée",
        type: "boolean",
        defaultValue: false,
        list: true,
      },
      {
        key: "is_featured",
        label: "Mise en avant",
        type: "boolean",
        defaultValue: false,
        list: true,
      },
      { key: "subscription_plan", label: "Formule" },
      {
        key: "subscription_ends_at",
        label: "Fin d'abonnement",
        type: "datetime",
      },
    ],
  },
  pages: {
    table: "cms_pages",
    title: "Pages CMS",
    description: "Créez et publiez les pages éditoriales du site.",
    singular: "page",
    orderBy: "updated_at",
    userColumns: { createdBy: "created_by", updatedBy: "updated_by" },
    fields: [
      { key: "locale", label: "Langue", defaultValue: "fr" },
      { key: "title", label: "Titre", required: true, list: true },
      { key: "slug", label: "Slug", required: true, list: true },
      { key: "excerpt", label: "Résumé", type: "textarea" },
      { key: "content", label: "Contenu", type: "textarea" },
      { key: "cover_image_url", label: "Image de couverture" },
      { key: "template", label: "Modèle", defaultValue: "default" },
      {
        key: "status",
        label: "Statut",
        type: "select",
        defaultValue: "draft",
        list: true,
        options: [
          { label: "Brouillon", value: "draft" },
          { label: "Publié", value: "published" },
          { label: "Archivé", value: "archived" },
        ],
      },
      { key: "seo_title", label: "Titre SEO" },
      { key: "seo_description", label: "Description SEO", type: "textarea" },
      { key: "robots", label: "Robots", defaultValue: "index,follow" },
      { key: "sort_order", label: "Ordre", type: "number", defaultValue: 0 },
    ],
    transformBeforeSave: (payload) => ({
      ...payload,
      published_at:
        payload.status === "published" ? new Date().toISOString() : null,
    }),
  },
  sections: {
    table: "cms_sections",
    title: "Sections CMS",
    description: "Ajoutez des blocs dynamiques aux pages publiques.",
    singular: "section",
    orderBy: "sort_order",
    ascending: true,
    userColumns: { createdBy: "created_by", updatedBy: "updated_by" },
    fields: [
      { key: "locale", label: "Langue", defaultValue: "fr" },
      {
        key: "page_key",
        label: "Clé de page",
        required: true,
        placeholder: "home ou slug-page",
        list: true,
      },
      {
        key: "section_key",
        label: "Clé de section",
        required: true,
        list: true,
      },
      {
        key: "section_type",
        label: "Type",
        defaultValue: "content",
        list: true,
      },
      { key: "title", label: "Titre" },
      { key: "subtitle", label: "Sous-titre", type: "textarea" },
      { key: "body", label: "Contenu", type: "textarea" },
      { key: "image_url", label: "URL image" },
      { key: "cta_label", label: "Texte du bouton" },
      { key: "cta_url", label: "Lien du bouton" },
      { key: "content", label: "Données JSON", type: "json", defaultValue: {} },
      {
        key: "sort_order",
        label: "Ordre",
        type: "number",
        defaultValue: 0,
        list: true,
      },
      {
        key: "is_active",
        label: "Active",
        type: "boolean",
        defaultValue: true,
        list: true,
      },
    ],
  },
  banners: {
    table: "banners",
    title: "Bannières",
    description: "Gérez les campagnes visuelles affichées sur le site.",
    singular: "bannière",
    orderBy: "sort_order",
    ascending: true,
    userColumns: { createdBy: "created_by", updatedBy: "updated_by" },
    fields: [
      { key: "locale", label: "Langue", defaultValue: "fr" },
      { key: "title", label: "Titre", required: true, list: true },
      { key: "subtitle", label: "Sous-titre", type: "textarea" },
      { key: "image_url", label: "Image bureau", list: true },
      { key: "mobile_image_url", label: "Image mobile" },
      { key: "cta_label", label: "Texte du bouton" },
      { key: "cta_url", label: "Lien du bouton" },
      {
        key: "placement",
        label: "Emplacement",
        defaultValue: "homepage",
        list: true,
      },
      {
        key: "status",
        label: "Statut",
        type: "select",
        defaultValue: "draft",
        list: true,
        options: [
          { label: "Brouillon", value: "draft" },
          { label: "Active", value: "active" },
          { label: "En pause", value: "paused" },
          { label: "Archivée", value: "archived" },
        ],
      },
      { key: "starts_at", label: "Début", type: "datetime" },
      { key: "ends_at", label: "Fin", type: "datetime" },
      { key: "sort_order", label: "Ordre", type: "number", defaultValue: 0 },
      {
        key: "audience",
        label: "Audience JSON",
        type: "json",
        defaultValue: { type: "all" },
      },
    ],
  },
  faq: {
    table: "faqs",
    title: "FAQ",
    description: "Gérez les questions fréquentes du site.",
    singular: "question",
    orderBy: "sort_order",
    ascending: true,
    userColumns: { createdBy: "created_by", updatedBy: "updated_by" },
    fields: [
      { key: "locale", label: "Langue", defaultValue: "fr" },
      { key: "category", label: "Catégorie", list: true },
      {
        key: "question",
        label: "Question",
        required: true,
        type: "textarea",
        list: true,
      },
      { key: "answer", label: "Réponse", required: true, type: "textarea" },
      { key: "sort_order", label: "Ordre", type: "number", defaultValue: 0 },
      {
        key: "is_active",
        label: "Active",
        type: "boolean",
        defaultValue: true,
        list: true,
      },
    ],
  },
  testimonials: {
    table: "testimonials",
    title: "Témoignages",
    description: "Gérez les avis affichés sur la plateforme.",
    singular: "témoignage",
    orderBy: "sort_order",
    ascending: true,
    userColumns: { createdBy: "created_by", updatedBy: "updated_by" },
    fields: [
      { key: "locale", label: "Langue", defaultValue: "fr" },
      { key: "author_name", label: "Auteur", required: true, list: true },
      { key: "author_role", label: "Fonction" },
      { key: "author_avatar_url", label: "Avatar" },
      {
        key: "content",
        label: "Témoignage",
        required: true,
        type: "textarea",
        list: true,
      },
      {
        key: "rating",
        label: "Note",
        type: "number",
        defaultValue: 5,
        list: true,
      },
      { key: "sort_order", label: "Ordre", type: "number", defaultValue: 0 },
      {
        key: "is_active",
        label: "Actif",
        type: "boolean",
        defaultValue: true,
        list: true,
      },
    ],
  },
  blog: {
    table: "posts",
    title: "Blog & actualités",
    description: "Créez, planifiez et publiez les articles Kafoo.",
    singular: "article",
    orderBy: "updated_at",
    fields: [
      { key: "locale", label: "Langue", defaultValue: "fr" },
      { key: "title", label: "Titre", required: true, list: true },
      { key: "slug", label: "Slug", required: true, list: true },
      { key: "excerpt", label: "Résumé", type: "textarea" },
      { key: "content", label: "Contenu", type: "textarea" },
      { key: "cover_image_url", label: "Image de couverture" },
      { key: "category", label: "Catégorie", list: true },
      {
        key: "tags",
        label: "Tags séparés par des virgules",
        type: "tags",
        defaultValue: [],
      },
      {
        key: "status",
        label: "Statut",
        type: "select",
        defaultValue: "draft",
        list: true,
        options: [
          { label: "Brouillon", value: "draft" },
          { label: "Publié", value: "published" },
          { label: "Archivé", value: "archived" },
        ],
      },
      {
        key: "is_featured",
        label: "À la une",
        type: "boolean",
        defaultValue: false,
        list: true,
      },
      { key: "seo_title", label: "Titre SEO" },
      { key: "seo_description", label: "Description SEO", type: "textarea" },
    ],
    transformBeforeSave: (payload) => ({
      ...payload,
      published_at:
        payload.status === "published" ? new Date().toISOString() : null,
    }),
  },
  ads: {
    table: "ads",
    title: "Publicités",
    description: "Administrez les campagnes et emplacements publicitaires.",
    singular: "publicité",
    orderBy: "created_at",
    userColumns: { createdBy: "created_by", updatedBy: "updated_by" },
    fields: [
      { key: "name", label: "Nom de campagne", required: true, list: true },
      { key: "advertiser_name", label: "Annonceur", list: true },
      { key: "placement", label: "Emplacement", required: true, list: true },
      { key: "image_url", label: "Image" },
      { key: "target_url", label: "Lien cible" },
      {
        key: "status",
        label: "Statut",
        type: "select",
        defaultValue: "draft",
        list: true,
        options: [
          { label: "Brouillon", value: "draft" },
          { label: "Active", value: "active" },
          { label: "En pause", value: "paused" },
          { label: "Terminée", value: "completed" },
          { label: "Archivée", value: "archived" },
        ],
      },
      { key: "starts_at", label: "Début", type: "datetime" },
      { key: "ends_at", label: "Fin", type: "datetime" },
      {
        key: "audience",
        label: "Audience JSON",
        type: "json",
        defaultValue: { type: "all" },
      },
      { key: "sort_order", label: "Ordre", type: "number", defaultValue: 0 },
    ],
  },
  notifications: {
    table: "notifications",
    title: "Notifications",
    description:
      "Créez des notifications in-app et préparez les campagnes multicanales.",
    singular: "notification",
    orderBy: "created_at",
    userColumns: { createdBy: "created_by" },
    fields: [
      { key: "title", label: "Titre", required: true, list: true },
      { key: "body", label: "Message", required: true, type: "textarea" },
      { key: "notification_type", label: "Type", defaultValue: "info" },
      {
        key: "channel",
        label: "Canal",
        type: "select",
        defaultValue: "in_app",
        list: true,
        options: [
          { label: "Dans l'application", value: "in_app" },
          { label: "E-mail", value: "email" },
          { label: "SMS", value: "sms" },
          { label: "WhatsApp", value: "whatsapp" },
          { label: "Push", value: "push" },
        ],
      },
      {
        key: "target_type",
        label: "Destinataires",
        type: "select",
        defaultValue: "all",
        list: true,
        options: [
          { label: "Tous", value: "all" },
          { label: "Utilisateur", value: "user" },
          { label: "Administrateurs", value: "admins" },
          { label: "Professionnels", value: "professionals" },
          { label: "Segment", value: "segment" },
        ],
      },
      { key: "target_user_id", label: "UUID utilisateur" },
      {
        key: "target_filter",
        label: "Filtre JSON",
        type: "json",
        defaultValue: {},
      },
      { key: "data", label: "Données JSON", type: "json", defaultValue: {} },
      {
        key: "status",
        label: "Statut",
        type: "select",
        defaultValue: "draft",
        list: true,
        options: [
          { label: "Brouillon", value: "draft" },
          { label: "Planifiée", value: "scheduled" },
          { label: "Envoyée", value: "sent" },
          { label: "Annulée", value: "cancelled" },
          { label: "Échec", value: "failed" },
        ],
      },
      { key: "scheduled_at", label: "Date planifiée", type: "datetime" },
    ],
    transformBeforeSave: (payload) => ({
      ...payload,
      sent_at: payload.status === "sent" ? new Date().toISOString() : null,
    }),
  },
  seo: {
    table: "seo_metadata",
    title: "Référencement SEO",
    description: "Gérez les métadonnées de chaque route publique.",
    singular: "configuration SEO",
    orderBy: "route",
    ascending: true,
    userColumns: { updatedBy: "updated_by" },
    fields: [
      { key: "locale", label: "Langue", defaultValue: "fr" },
      {
        key: "route",
        label: "Route",
        required: true,
        placeholder: "/",
        list: true,
      },
      { key: "title", label: "Titre", list: true },
      { key: "description", label: "Description", type: "textarea" },
      { key: "canonical_url", label: "URL canonique" },
      { key: "og_title", label: "Titre Open Graph" },
      {
        key: "og_description",
        label: "Description Open Graph",
        type: "textarea",
      },
      { key: "og_image_url", label: "Image Open Graph" },
      {
        key: "twitter_card",
        label: "Twitter Card",
        defaultValue: "summary_large_image",
      },
      {
        key: "robots",
        label: "Robots",
        defaultValue: "index,follow",
        list: true,
      },
      {
        key: "schema_json",
        label: "Schema JSON-LD",
        type: "json",
        defaultValue: {},
      },
    ],
  },
  redirects: {
    table: "seo_redirects",
    title: "Redirections SEO",
    description: "Gérez les changements d'URL et redirections permanentes.",
    singular: "redirection",
    orderBy: "created_at",
    userColumns: { createdBy: "created_by" },
    fields: [
      { key: "source_path", label: "Ancienne URL", required: true, list: true },
      {
        key: "destination_path",
        label: "Nouvelle URL",
        required: true,
        list: true,
      },
      {
        key: "status_code",
        label: "Code HTTP",
        type: "select",
        defaultValue: "301",
        list: true,
        options: [
          { label: "301", value: "301" },
          { label: "302", value: "302" },
          { label: "307", value: "307" },
          { label: "308", value: "308" },
        ],
      },
      {
        key: "is_active",
        label: "Active",
        type: "boolean",
        defaultValue: true,
        list: true,
      },
    ],
  },
};

function AdminPage() {
  const { supabase, user, isAdmin, loading } = useSupabase();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [accessError, setAccessError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function verifyAdminAccess() {
      if (loading) return;

      if (!user) {
        if (!cancelled) {
          setAuthorized(false);
          setCheckingAccess(false);
          setAccessError("");
        }
        return;
      }

      if (isAdmin === true) {
        if (!cancelled) {
          setAuthorized(true);
          setCheckingAccess(false);
          setAccessError("");
        }
        return;
      }

      try {
        const { data, error } = await supabase.rpc("is_admin");

        if (cancelled) return;

        if (error) {
          setAuthorized(false);
          setAccessError(
            `Impossible de vérifier vos droits : ${error.message}`,
          );
          return;
        }

        setAuthorized(Boolean(data));
        if (!data) {
          setAccessError(
            "Votre compte ne possède pas les droits administrateur.",
          );
        }
      } catch (error) {
        if (cancelled) return;
        console.error("[Admin] Vérification impossible :", error);
        setAuthorized(false);
        setAccessError(
          "Une erreur est survenue pendant la vérification des droits.",
        );
      } finally {
        if (!cancelled) setCheckingAccess(false);
      }
    }

    void verifyAdminAccess();

    return () => {
      cancelled = true;
    };
  }, [loading, user, isAdmin, supabase]);

  if (loading || checkingAccess) {
    return (
      <AdminFullscreen>
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="mt-4 text-sm font-semibold text-slate-400">
            Vérification de vos droits administrateur...
          </p>
        </div>
      </AdminFullscreen>
    );
  }

  if (!user) {
    return (
      <AdminFullscreen>
        <AdminLogin supabase={supabase} />
      </AdminFullscreen>
    );
  }

  if (!authorized) {
    return (
      <AdminFullscreen>
        <AdminAccessDenied
          message={accessError}
          onBack={() => navigate({ to: "/", replace: true })}
          onLogout={async () => {
            await supabase.auth.signOut();
            window.location.href = "/admin";
          }}
        />
      </AdminFullscreen>
    );
  }

  const activeItem = ALL_NAV_ITEMS.find((item) => item.id === tab);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
      return;
    }
    window.location.href = "/admin";
  };

  const crudConfig = CRUD_CONFIGS[tab];

  return (
    <AdminFullscreen>
      <div className="flex min-h-screen bg-slate-950 text-white">
        <aside className="hidden h-screen w-72 shrink-0 flex-col border-r border-white/10 bg-slate-900 lg:flex">
          <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-fuchsia-500">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-black text-white">Kafoo</p>
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
                Administration
              </p>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {NAV_SECTIONS.map((section) => (
              <div key={section.label} className="mb-5">
                <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">
                  {section.label}
                </p>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setTab(item.id)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                        tab === item.id
                          ? "bg-white/10 text-white"
                          : "text-slate-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span
                        className={tab === item.id ? "text-white" : item.color}
                      >
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="border-t border-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-fuchsia-500 text-xs font-black">
                {user.email?.[0]?.toUpperCase() ?? "A"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-white">
                  {user.email}
                </p>
                <p className="text-[10px] font-semibold text-emerald-400">
                  Administrateur
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
                title="Se déconnecter"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-white/10 bg-slate-900 lg:hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-400" />
                <div>
                  <p className="text-sm font-black text-white">Admin Kafoo</p>
                  <p className="text-[10px] text-slate-500">
                    {activeItem?.label}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
            <div className="flex overflow-x-auto border-t border-white/5 px-2 py-2">
              {ALL_NAV_ITEMS.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  title={item.label}
                  className={`mx-0.5 shrink-0 rounded-lg p-2.5 ${
                    tab === item.id
                      ? "bg-white/10 text-white"
                      : "text-slate-400"
                  }`}
                >
                  {item.icon}
                </button>
              ))}
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            {tab === "dashboard" && (
              <TabDashboard supabase={supabase} setTab={setTab} />
            )}
            {tab === "listings" && <TabListings supabase={supabase} />}
            {tab === "users" && (
              <TabUsers supabase={supabase} currentUserId={user.id} />
            )}
            {tab === "reports" && <TabReports supabase={supabase} />}
            {tab === "categories" && <TabCategories supabase={supabase} />}
            {tab === "locations" && <TabLocations supabase={supabase} />}
            {tab === "media" && (
              <TabMedia supabase={supabase} currentUserId={user.id} />
            )}
            {tab === "homepage" && (
              <TabHomepageCms supabase={supabase} currentUserId={user.id} />
            )}
            {tab === "menus" && <TabMenus supabase={supabase} />}
            {tab === "sponsored" && <TabSponsored supabase={supabase} />}
            {tab === "settings" && (
              <TabSettings
                supabase={supabase}
                currentUserId={user.id}
                user={user}
              />
            )}
            {tab === "admins" && (
              <TabAdmins supabase={supabase} currentUserId={user.id} />
            )}
            {tab === "roles" && <TabRoles supabase={supabase} />}
            {tab === "audit" && <TabAudit supabase={supabase} />}
            {crudConfig && (
              <GenericCrudManager
                key={crudConfig.table}
                supabase={supabase}
                currentUserId={user.id}
                config={crudConfig}
              />
            )}
          </main>
        </div>
      </div>
    </AdminFullscreen>
  );
}

function AdminFullscreen({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] overflow-auto bg-slate-950">
      {children}
    </div>
  );
}

function AdminLogin({ supabase }: { supabase: SupabaseClient }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage(
        "Veuillez renseigner votre e-mail et votre mot de passe.",
      );
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage("");

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage(
          error.message === "Invalid login credentials"
            ? "Adresse e-mail ou mot de passe incorrect."
            : error.message,
        );
        return;
      }

      if (!data.user) {
        setErrorMessage("Impossible de récupérer le compte.");
        return;
      }

      const access = await supabase.rpc("is_admin");
      if (access.error || !access.data) {
        await supabase.auth.signOut();
        setErrorMessage("Ce compte ne possède pas les droits administrateur.");
        return;
      }

      window.location.href = "/admin";
    } catch (error) {
      console.error("[Admin Login]", error);
      setErrorMessage("Une erreur est survenue pendant la connexion.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600">
            <Shield className="h-8 w-8" />
          </div>
          <h1 className="mt-5 text-3xl font-black">Administration Kafoo</h1>
          <p className="mt-2 text-sm text-slate-400">
            Connectez-vous pour accéder au back-office.
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="space-y-5 rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl sm:p-8"
        >
          <FormLabel label="Adresse e-mail">
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-12 border-white/10 bg-slate-800 text-white"
              disabled={submitting}
            />
          </FormLabel>

          <FormLabel label="Mot de passe">
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-12 border-white/10 bg-slate-800 pr-12 text-white"
                disabled={submitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              >
                <Eye className="h-4 w-4" />
              </button>
            </div>
          </FormLabel>

          {errorMessage && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
              {errorMessage}
            </div>
          )}

          <Button
            type="submit"
            disabled={submitting}
            className="h-12 w-full rounded-xl bg-blue-600 font-black hover:bg-blue-700"
          >
            {submitting ? "Connexion en cours..." : "Se connecter"}
          </Button>
        </form>
      </div>
    </div>
  );
}

function AdminAccessDenied({
  message,
  onBack,
  onLogout,
}: {
  message: string;
  onBack: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-5">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-7 text-center text-white">
        <Shield className="mx-auto h-12 w-12 text-red-400" />
        <h1 className="mt-5 text-2xl font-black">Accès refusé</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">{message}</p>
        <div className="mt-6 grid gap-2">
          <Button onClick={onLogout} className="bg-blue-600 hover:bg-blue-700">
            Utiliser un autre compte
          </Button>
          <Button onClick={onBack} className="bg-slate-800 hover:bg-slate-700">
            Retour au site
          </Button>
        </div>
      </div>
    </div>
  );
}

function TabDashboard({
  supabase,
  setTab,
}: {
  supabase: SupabaseClient;
  setTab: (tab: Tab) => void;
}) {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [recent, setRecent] = useState<AdminListing[]>([]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const [users, listings, pending, reports, pages, posts, media] =
        await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("listings").select("*", { count: "exact", head: true }),
          supabase
            .from("listings")
            .select("*", { count: "exact", head: true })
            .eq("status", "pending"),
          supabase
            .from("reports")
            .select("*", { count: "exact", head: true })
            .eq("status", "open"),
          supabase
            .from("cms_pages")
            .select("*", { count: "exact", head: true }),
          supabase.from("posts").select("*", { count: "exact", head: true }),
          supabase.from("media").select("*", { count: "exact", head: true }),
        ]);

      if (!cancelled) {
        setStats({
          users: users.count ?? 0,
          listings: listings.count ?? 0,
          pending: pending.count ?? 0,
          reports: reports.count ?? 0,
          pages: pages.count ?? 0,
          posts: posts.count ?? 0,
          media: media.count ?? 0,
        });
      }

      const { data } = await supabase
        .from("listings")
        .select("id,title,slug,status,price,currency,created_at,user_id")
        .order("created_at", { ascending: false })
        .limit(8);

      if (!cancelled) setRecent((data ?? []) as AdminListing[]);
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const cards: Array<{
    label: string;
    value: number;
    tab: Tab;
    icon: ReactNode;
  }> = [
    {
      label: "Utilisateurs",
      value: stats.users ?? 0,
      tab: "users",
      icon: <Users className="h-5 w-5" />,
    },
    {
      label: "Annonces",
      value: stats.listings ?? 0,
      tab: "listings",
      icon: <Package className="h-5 w-5" />,
    },
    {
      label: "En attente",
      value: stats.pending ?? 0,
      tab: "listings",
      icon: <TrendingUp className="h-5 w-5" />,
    },
    {
      label: "Signalements",
      value: stats.reports ?? 0,
      tab: "reports",
      icon: <AlertTriangle className="h-5 w-5" />,
    },
    {
      label: "Pages CMS",
      value: stats.pages ?? 0,
      tab: "pages",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      label: "Articles",
      value: stats.posts ?? 0,
      tab: "blog",
      icon: <Newspaper className="h-5 w-5" />,
    },
    {
      label: "Médias",
      value: stats.media ?? 0,
      tab: "media",
      icon: <ImageIcon className="h-5 w-5" />,
    },
  ];

  return (
    <PageContainer
      title="Tableau de bord"
      description="Vue globale de la plateforme et du CMS Kafoo."
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-7">
        {cards.map((card) => (
          <button
            type="button"
            key={card.label}
            onClick={() => setTab(card.tab)}
            className="rounded-2xl border border-white/10 bg-slate-800 p-4 text-left transition hover:bg-slate-700"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              {card.icon}
            </div>
            <p className="text-2xl font-black">{card.value}</p>
            <p className="text-xs font-semibold text-slate-400">{card.label}</p>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-800">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="font-black">Annonces récentes</h2>
          <button
            className="text-xs font-bold text-blue-400"
            onClick={() => setTab("listings")}
          >
            Voir tout
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase text-slate-500">
                <th className="px-5 py-3">Titre</th>
                <th className="px-5 py-3">Statut</th>
                <th className="px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((listing) => (
                <tr key={listing.id} className="border-b border-white/5">
                  <td className="px-5 py-3 font-semibold">{listing.title}</td>
                  <td className="px-5 py-3">
                    <Badge status={listing.status} />
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-400">
                    {new Date(listing.created_at).toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {recent.length === 0 && <EmptyRow text="Aucune annonce récente." />}
        </div>
      </div>
    </PageContainer>
  );
}

function TabListings({ supabase }: { supabase: SupabaseClient }) {
  const [items, setItems] = useState<AdminListing[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    let query = supabase
      .from("listings")
      .select(
        "id,title,slug,status,price,currency,created_at,user_id,is_featured,is_sponsored,sponsored_until",
      )
      .order("created_at", { ascending: false })
      .limit(200);

    if (filter !== "all") query = query.eq("status", filter);
    const { data, error } = await query;
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    setItems((data ?? []) as AdminListing[]);
  };

  useEffect(() => {
    void load();
  }, [filter]);

  const update = async (id: string, patch: Record<string, unknown>) => {
    const { error } = await supabase
      .from("listings")
      .update(patch)
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Annonce mise à jour");
    await load();
  };

  const remove = async (id: string) => {
    if (!window.confirm("Supprimer définitivement cette annonce ?")) return;
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Annonce supprimée");
      await load();
    }
  };

  const filtered = items.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <PageContainer
      title="Gestion des annonces"
      description={`${items.length} annonces chargées`}
      action={<RefreshButton onClick={() => void load()} loading={loading} />}
    >
      <div className="flex flex-wrap gap-2">
        {[
          "all",
          "pending",
          "active",
          "published",
          "rejected",
          "suspended",
          "sold",
        ].map((status) => (
          <button
            type="button"
            key={status}
            onClick={() => setFilter(status)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold ${
              filter === status ? "bg-blue-600" : "bg-slate-800 text-slate-400"
            }`}
          >
            {status === "all" ? "Tout" : (STATUS_CFG[status]?.label ?? status)}
          </button>
        ))}
      </div>

      <SearchBox
        value={search}
        onChange={setSearch}
        placeholder="Rechercher une annonce…"
      />

      <DataTable
        headers={[
          "Titre",
          "Prix",
          "Statut",
          "Mise en avant",
          "Date",
          "Actions",
        ]}
      >
        {filtered.map((item) => (
          <tr key={item.id} className="border-b border-white/5">
            <td className="px-5 py-3 font-semibold">{item.title}</td>
            <td className="px-5 py-3 text-slate-400">
              {item.price} {item.currency}
            </td>
            <td className="px-5 py-3">
              <Badge status={item.status} />
            </td>
            <td className="px-5 py-3 text-xs text-slate-400">
              {item.is_sponsored
                ? "Sponsorisé"
                : item.is_featured
                  ? "À la une"
                  : "Standard"}
            </td>
            <td className="px-5 py-3 text-xs text-slate-400">
              {new Date(item.created_at).toLocaleDateString("fr-FR")}
            </td>
            <td className="px-5 py-3">
              <div className="flex gap-1">
                <ActionBtn
                  color="emerald"
                  title="Publier"
                  onClick={() => void update(item.id, { status: "published" })}
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                </ActionBtn>
                <ActionBtn
                  color="red"
                  title="Rejeter"
                  onClick={() => void update(item.id, { status: "rejected" })}
                >
                  <XCircle className="h-3.5 w-3.5" />
                </ActionBtn>
                <ActionBtn
                  color="orange"
                  title="Suspendre"
                  onClick={() => void update(item.id, { status: "suspended" })}
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                </ActionBtn>
                <ActionBtn
                  color="slate"
                  title="Supprimer"
                  onClick={() => void remove(item.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </ActionBtn>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
      {!loading && filtered.length === 0 && (
        <EmptyRow text="Aucune annonce trouvée." />
      )}
    </PageContainer>
  );
}

function TabUsers({
  supabase,
  currentUserId,
}: {
  supabase: SupabaseClient;
  currentUserId: string;
}) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");

  const load = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id,user_id,display_name,phone,created_at,is_admin,is_suspended,admin_label",
      )
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setUsers((data ?? []) as AdminUser[]);
  };

  useEffect(() => {
    void load();
  }, []);

  const update = async (item: AdminUser, patch: Record<string, unknown>) => {
    if (item.user_id === currentUserId && patch.is_admin === false) {
      toast.error("Vous ne pouvez pas retirer vos propres droits.");
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("user_id", item.user_id);
    if (error) toast.error(error.message);
    else {
      toast.success("Utilisateur mis à jour");
      await load();
    }
  };

  const filtered = users.filter((item) =>
    `${item.display_name ?? ""} ${item.phone ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <PageContainer title="Utilisateurs" description={`${users.length} profils`}>
      <SearchBox
        value={search}
        onChange={setSearch}
        placeholder="Nom ou téléphone…"
      />
      <DataTable
        headers={[
          "Utilisateur",
          "Téléphone",
          "Rôle",
          "État",
          "Inscrit le",
          "Actions",
        ]}
      >
        {filtered.map((item) => (
          <tr key={item.id} className="border-b border-white/5">
            <td className="px-5 py-3 font-semibold">
              {item.display_name || "Sans nom"}
            </td>
            <td className="px-5 py-3 text-slate-400">{item.phone || "—"}</td>
            <td className="px-5 py-3">
              {item.is_admin ? "Administrateur" : "Membre"}
            </td>
            <td className="px-5 py-3">
              {item.is_suspended ? (
                <Badge status="suspended" />
              ) : (
                <Badge status="active" />
              )}
            </td>
            <td className="px-5 py-3 text-xs text-slate-400">
              {new Date(item.created_at).toLocaleDateString("fr-FR")}
            </td>
            <td className="px-5 py-3">
              <div className="flex gap-1">
                <ActionBtn
                  color="blue"
                  title={item.is_admin ? "Retirer admin" : "Passer admin"}
                  onClick={() =>
                    void update(item, { is_admin: !item.is_admin })
                  }
                >
                  <Shield className="h-3.5 w-3.5" />
                </ActionBtn>
                <ActionBtn
                  color="orange"
                  title={item.is_suspended ? "Réactiver" : "Suspendre"}
                  onClick={() =>
                    void update(item, { is_suspended: !item.is_suspended })
                  }
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                </ActionBtn>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
      {filtered.length === 0 && <EmptyRow text="Aucun utilisateur trouvé." />}
    </PageContainer>
  );
}

function TabReports({ supabase }: { supabase: SupabaseClient }) {
  const [reports, setReports] = useState<AdminReport[]>([]);

  const load = async () => {
    let { data, error } = await supabase
      .from("reports")
      .select("id,reason,status,created_at,listing:listings(title,slug)")
      .order("created_at", { ascending: false });

    if (error) {
      const fallback = await supabase
        .from("reports")
        .select("id,reason,status,created_at")
        .order("created_at", { ascending: false });
      data = fallback.data as any;
      error = fallback.error;
    }

    if (error) toast.error(error.message);
    else setReports((data ?? []) as unknown as AdminReport[]);
  };

  useEffect(() => {
    void load();
  }, []);

  const update = async (id: string, status: string) => {
    const { error } = await supabase
      .from("reports")
      .update({ status })
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Signalement mis à jour");
      await load();
    }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("reports").delete().eq("id", id);
    if (error) toast.error(error.message);
    else await load();
  };

  return (
    <PageContainer
      title="Signalements"
      description={`${reports.filter((item) => item.status === "open").length} ouverts`}
    >
      <DataTable headers={["Annonce", "Raison", "Statut", "Date", "Actions"]}>
        {reports.map((item) => (
          <tr key={item.id} className="border-b border-white/5">
            <td className="px-5 py-3 font-semibold">
              {item.listing?.title || "Annonce indisponible"}
            </td>
            <td className="max-w-sm px-5 py-3 text-slate-300">{item.reason}</td>
            <td className="px-5 py-3">
              <Badge status={item.status} />
            </td>
            <td className="px-5 py-3 text-xs text-slate-400">
              {new Date(item.created_at).toLocaleDateString("fr-FR")}
            </td>
            <td className="px-5 py-3">
              <div className="flex gap-1">
                <ActionBtn
                  color="emerald"
                  title="Résoudre"
                  onClick={() => void update(item.id, "resolved")}
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                </ActionBtn>
                <ActionBtn
                  color="slate"
                  title="Supprimer"
                  onClick={() => void remove(item.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </ActionBtn>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
      {reports.length === 0 && <EmptyRow text="Aucun signalement." />}
    </PageContainer>
  );
}

function TabCategories({ supabase }: { supabase: SupabaseClient }) {
  const [rows, setRows] = useState<AdminCategory[]>([]);
  const [form, setForm] = useState({ name: "", slug: "", icon: "" });

  const load = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("id,name,slug,icon,is_active,sort_order")
      .is("parent_id", null)
      .order("sort_order");
    if (error) toast.error(error.message);
    else setRows((data ?? []) as AdminCategory[]);
  };

  useEffect(() => {
    void load();
  }, []);

  const add = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error("Nom et slug requis");
      return;
    }
    const { error } = await supabase.from("categories").insert({
      name: form.name.trim(),
      slug: form.slug.trim().toLowerCase(),
      icon: form.icon.trim() || null,
      is_active: true,
      sort_order: rows.length + 1,
    });
    if (error) toast.error(error.message);
    else {
      setForm({ name: "", slug: "", icon: "" });
      toast.success("Catégorie ajoutée");
      await load();
    }
  };

  const toggle = async (row: AdminCategory) => {
    const { error } = await supabase
      .from("categories")
      .update({ is_active: !row.is_active })
      .eq("id", row.id);
    if (error) toast.error(error.message);
    else await load();
  };

  const remove = async (id: string) => {
    if (!window.confirm("Supprimer cette catégorie ?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) toast.error(error.message);
    else await load();
  };

  return (
    <PageContainer
      title="Catégories"
      description={`${rows.length} catégories principales`}
    >
      <Panel title="Ajouter une catégorie">
        <div className="grid gap-3 md:grid-cols-3">
          <Input
            value={form.name}
            onChange={(e) =>
              setForm((current) => ({ ...current, name: e.target.value }))
            }
            placeholder="Nom"
            className="border-white/10 bg-slate-700 text-white"
          />
          <Input
            value={form.slug}
            onChange={(e) =>
              setForm((current) => ({ ...current, slug: e.target.value }))
            }
            placeholder="Slug"
            className="border-white/10 bg-slate-700 text-white"
          />
          <Input
            value={form.icon}
            onChange={(e) =>
              setForm((current) => ({ ...current, icon: e.target.value }))
            }
            placeholder="Icône Lucide"
            className="border-white/10 bg-slate-700 text-white"
          />
        </div>
        <Button
          onClick={() => void add()}
          className="mt-4 bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Ajouter
        </Button>
      </Panel>

      <DataTable headers={["Nom", "Slug", "Icône", "Statut", "Actions"]}>
        {rows.map((row) => (
          <tr key={row.id} className="border-b border-white/5">
            <td className="px-5 py-3 font-semibold">{row.name}</td>
            <td className="px-5 py-3 text-slate-400">{row.slug}</td>
            <td className="px-5 py-3 text-slate-400">{row.icon || "—"}</td>
            <td className="px-5 py-3">
              <Badge status={row.is_active ? "active" : "suspended"} />
            </td>
            <td className="px-5 py-3">
              <div className="flex gap-1">
                <ActionBtn
                  color="orange"
                  title="Activer/désactiver"
                  onClick={() => void toggle(row)}
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                </ActionBtn>
                <ActionBtn
                  color="slate"
                  title="Supprimer"
                  onClick={() => void remove(row.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </ActionBtn>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
    </PageContainer>
  );
}

function TabLocations({ supabase }: { supabase: SupabaseClient }) {
  const [regions, setRegions] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [communes, setCommunes] = useState<any[]>([]);
  const [newRegion, setNewRegion] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newCommune, setNewCommune] = useState("");
  const [regionId, setRegionId] = useState("");
  const [cityId, setCityId] = useState("");

  const load = async () => {
    const [r, c, m] = await Promise.all([
      supabase.from("regions").select("*").order("name"),
      supabase.from("cities").select("*").order("name"),
      supabase.from("communes").select("*").order("name"),
    ]);
    if (r.error) toast.error(r.error.message);
    if (c.error) toast.error(c.error.message);
    if (m.error) toast.error(m.error.message);
    setRegions(r.data ?? []);
    setCities(c.data ?? []);
    setCommunes(m.data ?? []);
  };

  useEffect(() => {
    void load();
  }, []);

  const slugify = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const addLocation = async (
    table: "regions" | "cities" | "communes",
    name: string,
    parent?: { key: string; value: string },
  ) => {
    if (!name.trim()) return;
    const payload: Record<string, unknown> = {
      name: name.trim(),
      slug: slugify(name),
      is_active: true,
    };
    if (parent?.value) payload[parent.key] = parent.value;

    let result = await supabase.from(table).insert(payload);
    if (result.error && parent) {
      delete payload[parent.key];
      result = await supabase.from(table).insert(payload);
    }
    if (result.error) toast.error(result.error.message);
    else {
      toast.success("Localisation ajoutée");
      await load();
    }
  };

  const remove = async (table: string, id: string) => {
    if (!window.confirm("Supprimer cet élément ?")) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) toast.error(error.message);
    else await load();
  };

  return (
    <PageContainer
      title="Localisation"
      description="Régions, villes et communes utilisées par les annonces."
    >
      <div className="grid gap-4 xl:grid-cols-3">
        <LocationPanel
          title="Régions"
          rows={regions}
          value={newRegion}
          onChange={setNewRegion}
          onAdd={() =>
            void addLocation("regions", newRegion).then(() => setNewRegion(""))
          }
          onDelete={(id) => void remove("regions", id)}
        />
        <LocationPanel
          title="Villes"
          rows={cities}
          value={newCity}
          onChange={setNewCity}
          onAdd={() =>
            void addLocation("cities", newCity, {
              key: "region_id",
              value: regionId,
            }).then(() => setNewCity(""))
          }
          onDelete={(id) => void remove("cities", id)}
          parentValue={regionId}
          onParentChange={setRegionId}
          parentRows={regions}
          parentLabel="Région"
        />
        <LocationPanel
          title="Communes"
          rows={communes}
          value={newCommune}
          onChange={setNewCommune}
          onAdd={() =>
            void addLocation("communes", newCommune, {
              key: "city_id",
              value: cityId,
            }).then(() => setNewCommune(""))
          }
          onDelete={(id) => void remove("communes", id)}
          parentValue={cityId}
          onParentChange={setCityId}
          parentRows={cities}
          parentLabel="Ville"
        />
      </div>
    </PageContainer>
  );
}

function TabMedia({
  supabase,
  currentUserId,
}: {
  supabase: SupabaseClient;
  currentUserId: string;
}) {
  const [rows, setRows] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [folder, setFolder] = useState("general");
  const [altText, setAltText] = useState("");
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from("media")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setRows(data ?? []);
  };

  useEffect(() => {
    void load();
  }, []);

  const upload = async () => {
    if (!file) {
      toast.error("Sélectionnez un fichier");
      return;
    }

    setUploading(true);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `${folder}/${Date.now()}-${safeName}`;
    const storage = await supabase.storage
      .from("cms-media")
      .upload(path, file, {
        upsert: false,
        contentType: file.type,
      });

    if (storage.error) {
      setUploading(false);
      toast.error(storage.error.message);
      return;
    }

    const { data: publicUrl } = supabase.storage
      .from("cms-media")
      .getPublicUrl(path);
    const insert = await supabase.from("media").insert({
      bucket_id: "cms-media",
      name: file.name,
      path,
      public_url: publicUrl.publicUrl,
      mime_type: file.type,
      size_bytes: file.size,
      alt_text: altText || null,
      folder,
      is_public: true,
      uploaded_by: currentUserId,
    });

    setUploading(false);
    if (insert.error) {
      toast.error(insert.error.message);
      return;
    }

    setFile(null);
    setAltText("");
    toast.success("Média téléversé");
    await load();
  };

  const remove = async (row: any) => {
    if (!window.confirm("Supprimer ce média ?")) return;
    const storage = await supabase.storage.from("cms-media").remove([row.path]);
    if (storage.error) {
      toast.error(storage.error.message);
      return;
    }
    const { error } = await supabase.from("media").delete().eq("id", row.id);
    if (error) toast.error(error.message);
    else await load();
  };

  return (
    <PageContainer title="Médiathèque" description={`${rows.length} médias`}>
      <Panel title="Téléverser un média">
        <div className="grid gap-3 md:grid-cols-3">
          <Input
            type="file"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="border-white/10 bg-slate-700 text-white"
          />
          <Input
            value={folder}
            onChange={(event) => setFolder(event.target.value)}
            placeholder="Dossier"
            className="border-white/10 bg-slate-700 text-white"
          />
          <Input
            value={altText}
            onChange={(event) => setAltText(event.target.value)}
            placeholder="Texte alternatif"
            className="border-white/10 bg-slate-700 text-white"
          />
        </div>
        <Button
          disabled={uploading}
          onClick={() => void upload()}
          className="mt-4 bg-blue-600 hover:bg-blue-700"
        >
          <Upload className="mr-2 h-4 w-4" />
          {uploading ? "Téléversement..." : "Téléverser"}
        </Button>
      </Panel>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {rows.map((row) => (
          <div
            key={row.id}
            className="overflow-hidden rounded-2xl border border-white/10 bg-slate-800"
          >
            <div className="aspect-video bg-slate-900">
              {row.mime_type?.startsWith("image/") ? (
                <img
                  src={row.public_url}
                  alt={row.alt_text || row.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <FileText className="h-10 w-10 text-slate-500" />
                </div>
              )}
            </div>
            <div className="p-4">
              <p className="truncate text-sm font-bold">{row.name}</p>
              <p className="mt-1 text-xs text-slate-500">{row.folder}</p>
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(row.public_url)}
                  className="bg-slate-700 hover:bg-slate-600"
                >
                  Copier l'URL
                </Button>
                <ActionBtn
                  color="slate"
                  title="Supprimer"
                  onClick={() => void remove(row)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </ActionBtn>
              </div>
            </div>
          </div>
        ))}
      </div>
      {rows.length === 0 && <EmptyRow text="Aucun média." />}
    </PageContainer>
  );
}

function TabHomepageCms({
  supabase,
  currentUserId,
}: {
  supabase: SupabaseClient;
  currentUserId: string;
}) {
  const defaults = {
    locale: "fr",
    hero_badge: "Nouvelle marketplace locale en Guinée",
    hero_title: "Vendez et trouvez vos bonnes affaires près de chez vous",
    hero_subtitle:
      "Publiez gratuitement et échangez directement avec les acheteurs partout en Guinée.",
    hero_description:
      "Téléphones, véhicules, immobilier, meubles, mode, électroménager et services.",
    hero_background_url: "",
    hero_primary_label: "Publier gratuitement",
    hero_primary_url: "/publier",
    hero_secondary_label: "Explorer",
    hero_secondary_url: "/annonces",
    search_placeholder: "Que recherchez-vous ?",
    featured_categories_title: "Catégories populaires",
    featured_listings_title: "Annonces récentes",
    statistics: JSON.stringify(
      [
        { label: "Annonces publiées", value: "1 200+" },
        { label: "Vendeurs actifs", value: "850+" },
        { label: "Villes couvertes", value: "12" },
      ],
      null,
      2,
    ),
    seo_title: "Kafoo — Petites annonces en Guinée",
    seo_description:
      "Achetez et vendez facilement près de chez vous en Guinée.",
    og_image_url: "",
    status: "published",
  };

  const [form, setForm] = useState<Record<string, any>>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("cms_homepage")
      .select("*")
      .eq("locale", "fr")
      .maybeSingle();
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data) {
      setForm({
        ...defaults,
        ...data,
        statistics: JSON.stringify(data.statistics ?? [], null, 2),
      });
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async () => {
    setSaving(true);
    let statistics: unknown;
    try {
      statistics = JSON.parse(form.statistics || "[]");
    } catch {
      setSaving(false);
      toast.error("Le JSON des statistiques est invalide");
      return;
    }

    const payload = {
      ...form,
      locale: "fr",
      statistics,
      options: form.options ?? {},
      updated_by: currentUserId,
      published_at:
        form.status === "published" ? new Date().toISOString() : null,
    };
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;

    const { error } = await supabase
      .from("cms_homepage")
      .upsert(payload, { onConflict: "locale" });
    setSaving(false);

    if (error) toast.error(error.message);
    else {
      toast.success(
        "Page d'accueil enregistrée. Le site public utilise maintenant ces données.",
      );
      await load();
    }
  };

  return (
    <PageContainer
      title="Page d'accueil"
      description="Tous les champs publiés sont lus automatiquement par la page publique."
      action={<RefreshButton onClick={() => void load()} loading={loading} />}
    >
      <Panel title="Hero principal">
        <div className="grid gap-4 md:grid-cols-2">
          <CmsInput
            label="Badge"
            value={form.hero_badge}
            onChange={(value) =>
              setForm((current) => ({ ...current, hero_badge: value }))
            }
          />
          <CmsInput
            label="Image de fond"
            value={form.hero_background_url}
            onChange={(value) =>
              setForm((current) => ({ ...current, hero_background_url: value }))
            }
          />
          <div className="md:col-span-2">
            <CmsInput
              label="Titre principal"
              value={form.hero_title}
              onChange={(value) =>
                setForm((current) => ({ ...current, hero_title: value }))
              }
            />
          </div>
          <div className="md:col-span-2">
            <CmsTextarea
              label="Sous-titre"
              value={form.hero_subtitle}
              onChange={(value) =>
                setForm((current) => ({ ...current, hero_subtitle: value }))
              }
            />
          </div>
          <div className="md:col-span-2">
            <CmsTextarea
              label="Description"
              value={form.hero_description}
              onChange={(value) =>
                setForm((current) => ({ ...current, hero_description: value }))
              }
            />
          </div>
          <CmsInput
            label="Bouton principal"
            value={form.hero_primary_label}
            onChange={(value) =>
              setForm((current) => ({ ...current, hero_primary_label: value }))
            }
          />
          <CmsInput
            label="Lien principal"
            value={form.hero_primary_url}
            onChange={(value) =>
              setForm((current) => ({ ...current, hero_primary_url: value }))
            }
          />
          <CmsInput
            label="Bouton secondaire"
            value={form.hero_secondary_label}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                hero_secondary_label: value,
              }))
            }
          />
          <CmsInput
            label="Lien secondaire"
            value={form.hero_secondary_url}
            onChange={(value) =>
              setForm((current) => ({ ...current, hero_secondary_url: value }))
            }
          />
          <CmsInput
            label="Placeholder recherche"
            value={form.search_placeholder}
            onChange={(value) =>
              setForm((current) => ({ ...current, search_placeholder: value }))
            }
          />
        </div>
      </Panel>

      <Panel title="Sections et statistiques">
        <div className="grid gap-4 md:grid-cols-2">
          <CmsInput
            label="Titre catégories"
            value={form.featured_categories_title}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                featured_categories_title: value,
              }))
            }
          />
          <CmsInput
            label="Titre annonces"
            value={form.featured_listings_title}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                featured_listings_title: value,
              }))
            }
          />
          <div className="md:col-span-2">
            <CmsTextarea
              label="Statistiques JSON"
              value={form.statistics}
              onChange={(value) =>
                setForm((current) => ({ ...current, statistics: value }))
              }
              rows={8}
            />
          </div>
        </div>
      </Panel>

      <Panel title="SEO de l'accueil">
        <div className="grid gap-4">
          <CmsInput
            label="Titre SEO"
            value={form.seo_title}
            onChange={(value) =>
              setForm((current) => ({ ...current, seo_title: value }))
            }
          />
          <CmsTextarea
            label="Description SEO"
            value={form.seo_description}
            onChange={(value) =>
              setForm((current) => ({ ...current, seo_description: value }))
            }
          />
          <CmsInput
            label="Image Open Graph"
            value={form.og_image_url}
            onChange={(value) =>
              setForm((current) => ({ ...current, og_image_url: value }))
            }
          />
          <FormLabel label="Statut">
            <select
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value,
                }))
              }
              className="h-11 w-full rounded-xl border border-white/10 bg-slate-700 px-3 text-sm text-white"
            >
              <option value="draft">Brouillon</option>
              <option value="published">Publié</option>
              <option value="archived">Archivé</option>
            </select>
          </FormLabel>
        </div>
      </Panel>

      <Button
        disabled={saving}
        onClick={() => void save()}
        className="bg-blue-600 px-6 hover:bg-blue-700"
      >
        <Save className="mr-2 h-4 w-4" />
        {saving ? "Enregistrement..." : "Enregistrer et publier"}
      </Button>
    </PageContainer>
  );
}

function TabMenus({ supabase }: { supabase: SupabaseClient }) {
  const [menus, setMenus] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [menuForm, setMenuForm] = useState({
    name: "",
    slug: "",
    location: "header",
  });
  const [itemForm, setItemForm] = useState({
    menu_id: "",
    label: "",
    url: "",
    sort_order: "0",
  });

  const load = async () => {
    const [menusResult, itemsResult] = await Promise.all([
      supabase.from("navigation_menus").select("*").order("name"),
      supabase.from("navigation_items").select("*").order("sort_order"),
    ]);
    if (menusResult.error) toast.error(menusResult.error.message);
    if (itemsResult.error) toast.error(itemsResult.error.message);
    setMenus(menusResult.data ?? []);
    setItems(itemsResult.data ?? []);
  };

  useEffect(() => {
    void load();
  }, []);

  const addMenu = async () => {
    const { error } = await supabase.from("navigation_menus").insert({
      ...menuForm,
      is_active: true,
    });
    if (error) toast.error(error.message);
    else {
      setMenuForm({ name: "", slug: "", location: "header" });
      await load();
    }
  };

  const addItem = async () => {
    const { error } = await supabase.from("navigation_items").insert({
      menu_id: itemForm.menu_id,
      label: itemForm.label,
      url: itemForm.url,
      sort_order: Number(itemForm.sort_order || 0),
      is_active: true,
    });
    if (error) toast.error(error.message);
    else {
      setItemForm({ menu_id: "", label: "", url: "", sort_order: "0" });
      await load();
    }
  };

  const remove = async (table: string, id: string) => {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) toast.error(error.message);
    else await load();
  };

  return (
    <PageContainer
      title="Menus de navigation"
      description="Gérez les menus du header et du pied de page."
    >
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Créer un menu">
          <div className="grid gap-3">
            <Input
              value={menuForm.name}
              onChange={(e) =>
                setMenuForm((current) => ({ ...current, name: e.target.value }))
              }
              placeholder="Nom"
              className="border-white/10 bg-slate-700 text-white"
            />
            <Input
              value={menuForm.slug}
              onChange={(e) =>
                setMenuForm((current) => ({ ...current, slug: e.target.value }))
              }
              placeholder="Slug"
              className="border-white/10 bg-slate-700 text-white"
            />
            <select
              value={menuForm.location}
              onChange={(e) =>
                setMenuForm((current) => ({
                  ...current,
                  location: e.target.value,
                }))
              }
              className="h-11 rounded-xl border border-white/10 bg-slate-700 px-3 text-white"
            >
              <option value="header">Header</option>
              <option value="footer">Footer</option>
            </select>
            <Button
              onClick={() => void addMenu()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Ajouter le menu
            </Button>
          </div>
          <div className="mt-5 space-y-2">
            {menus.map((menu) => (
              <div
                key={menu.id}
                className="flex items-center justify-between rounded-xl bg-slate-900 p-3"
              >
                <div>
                  <p className="font-bold">{menu.name}</p>
                  <p className="text-xs text-slate-500">{menu.location}</p>
                </div>
                <ActionBtn
                  color="slate"
                  title="Supprimer"
                  onClick={() => void remove("navigation_menus", menu.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </ActionBtn>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Ajouter un élément">
          <div className="grid gap-3">
            <select
              value={itemForm.menu_id}
              onChange={(e) =>
                setItemForm((current) => ({
                  ...current,
                  menu_id: e.target.value,
                }))
              }
              className="h-11 rounded-xl border border-white/10 bg-slate-700 px-3 text-white"
            >
              <option value="">Choisir un menu</option>
              {menus.map((menu) => (
                <option key={menu.id} value={menu.id}>
                  {menu.name}
                </option>
              ))}
            </select>
            <Input
              value={itemForm.label}
              onChange={(e) =>
                setItemForm((current) => ({
                  ...current,
                  label: e.target.value,
                }))
              }
              placeholder="Libellé"
              className="border-white/10 bg-slate-700 text-white"
            />
            <Input
              value={itemForm.url}
              onChange={(e) =>
                setItemForm((current) => ({ ...current, url: e.target.value }))
              }
              placeholder="URL"
              className="border-white/10 bg-slate-700 text-white"
            />
            <Input
              type="number"
              value={itemForm.sort_order}
              onChange={(e) =>
                setItemForm((current) => ({
                  ...current,
                  sort_order: e.target.value,
                }))
              }
              placeholder="Ordre"
              className="border-white/10 bg-slate-700 text-white"
            />
            <Button
              onClick={() => void addItem()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Ajouter l'élément
            </Button>
          </div>
          <div className="mt-5 space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl bg-slate-900 p-3"
              >
                <div>
                  <p className="font-bold">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.url}</p>
                </div>
                <ActionBtn
                  color="slate"
                  title="Supprimer"
                  onClick={() => void remove("navigation_items", item.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </ActionBtn>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </PageContainer>
  );
}

function TabSponsored({ supabase }: { supabase: SupabaseClient }) {
  const [rows, setRows] = useState<AdminListing[]>([]);
  const [search, setSearch] = useState("");

  const load = async () => {
    const { data, error } = await supabase
      .from("listings")
      .select(
        "id,title,slug,status,is_featured,is_sponsored,sponsored_until,created_at,price,currency,user_id",
      )
      .order("is_sponsored", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setRows((data ?? []) as AdminListing[]);
  };

  useEffect(() => {
    void load();
  }, []);

  const update = async (id: string, patch: Record<string, unknown>) => {
    const { error } = await supabase
      .from("listings")
      .update(patch)
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Mise en avant actualisée");
      await load();
    }
  };

  const filtered = rows.filter((row) =>
    row.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <PageContainer
      title="Annonces sponsorisées"
      description="Contrôlez la priorité et la durée des mises en avant."
    >
      <SearchBox
        value={search}
        onChange={setSearch}
        placeholder="Rechercher une annonce…"
      />
      <DataTable
        headers={["Annonce", "À la une", "Sponsorisé", "Expiration", "Actions"]}
      >
        {filtered.map((row) => (
          <tr key={row.id} className="border-b border-white/5">
            <td className="px-5 py-3 font-semibold">{row.title}</td>
            <td className="px-5 py-3">{row.is_featured ? "Oui" : "Non"}</td>
            <td className="px-5 py-3">{row.is_sponsored ? "Oui" : "Non"}</td>
            <td className="px-5 py-3 text-xs text-slate-400">
              {row.sponsored_until
                ? new Date(row.sponsored_until).toLocaleDateString("fr-FR")
                : "—"}
            </td>
            <td className="px-5 py-3">
              <div className="flex gap-1">
                <ActionBtn
                  color="blue"
                  title="À la une"
                  onClick={() =>
                    void update(row.id, { is_featured: !row.is_featured })
                  }
                >
                  <Star className="h-3.5 w-3.5" />
                </ActionBtn>
                <ActionBtn
                  color="emerald"
                  title="Sponsoriser 30 jours"
                  onClick={() =>
                    void update(row.id, {
                      is_sponsored: true,
                      sponsored_until: new Date(
                        Date.now() + 30 * 86400000,
                      ).toISOString(),
                    })
                  }
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                </ActionBtn>
                <ActionBtn
                  color="orange"
                  title="Retirer le sponsoring"
                  onClick={() =>
                    void update(row.id, {
                      is_sponsored: false,
                      sponsored_until: null,
                    })
                  }
                >
                  <X className="h-3.5 w-3.5" />
                </ActionBtn>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
    </PageContainer>
  );
}

function TabSettings({
  supabase,
  currentUserId,
  user,
}: {
  supabase: SupabaseClient;
  currentUserId: string;
  user: any;
}) {
  const settingKeys = [
    {
      key: "general.site_name",
      label: "Nom du site",
      group_name: "general",
      public: true,
      fallback: "Kafoo",
    },
    {
      key: "general.site_description",
      label: "Description",
      group_name: "general",
      public: true,
      fallback: "",
    },
    {
      key: "general.default_country",
      label: "Pays par défaut",
      group_name: "general",
      public: true,
      fallback: "Guinée",
    },
    {
      key: "general.default_currency",
      label: "Devise",
      group_name: "general",
      public: true,
      fallback: "GNF",
    },
    {
      key: "contact.support_email",
      label: "E-mail support",
      group_name: "contact",
      public: true,
      fallback: "",
    },
    {
      key: "listings.max_images",
      label: "Nombre maximal d'images",
      group_name: "listings",
      public: false,
      fallback: "10",
    },
    {
      key: "listings.require_moderation",
      label: "Modération obligatoire (true/false)",
      group_name: "listings",
      public: false,
      fallback: "true",
    },
    {
      key: "maintenance.enabled",
      label: "Mode maintenance (true/false)",
      group_name: "maintenance",
      public: false,
      fallback: "false",
    },
  ];
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data, error } = await supabase.from("site_settings").select("*");
    if (error) {
      toast.error(error.message);
      return;
    }
    const mapped: Record<string, string> = {};
    for (const definition of settingKeys) {
      const row = (data ?? []).find((item: any) => item.key === definition.key);
      const value = row?.value;
      mapped[definition.key] =
        typeof value === "string"
          ? value
          : value === undefined
            ? definition.fallback
            : JSON.stringify(value);
    }
    setValues(mapped);
  };

  useEffect(() => {
    void load();
  }, []);

  const parseSetting = (value: string): unknown => {
    if (value === "true") return true;
    if (value === "false") return false;
    if (/^-?\d+(\.\d+)?$/.test(value.trim())) return Number(value);
    return value;
  };

  const save = async () => {
    setSaving(true);
    const rows = settingKeys.map((definition) => ({
      key: definition.key,
      group_name: definition.group_name,
      value: parseSetting(values[definition.key] ?? definition.fallback),
      is_public: definition.public,
      updated_by: currentUserId,
    }));
    const { error } = await supabase
      .from("site_settings")
      .upsert(rows, { onConflict: "key" });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Paramètres enregistrés");
  };

  return (
    <PageContainer
      title="Paramètres"
      description="Configuration générale de Kafoo."
    >
      <Panel title="Paramètres de la plateforme">
        <div className="grid gap-4 md:grid-cols-2">
          {settingKeys.map((definition) => (
            <CmsInput
              key={definition.key}
              label={definition.label}
              value={values[definition.key] ?? definition.fallback}
              onChange={(value) =>
                setValues((current) => ({
                  ...current,
                  [definition.key]: value,
                }))
              }
            />
          ))}
        </div>
        <Button
          disabled={saving}
          onClick={() => void save()}
          className="mt-5 bg-blue-600 hover:bg-blue-700"
        >
          <Save className="mr-2 h-4 w-4" />
          Enregistrer
        </Button>
      </Panel>
      <Panel title="Compte administrateur">
        <p className="text-sm text-slate-400">
          Connecté en tant que{" "}
          <strong className="text-white">{user.email}</strong>
        </p>
      </Panel>
    </PageContainer>
  );
}

function TabAdmins({
  supabase,
  currentUserId,
}: {
  supabase: SupabaseClient;
  currentUserId: string;
}) {
  const [rows, setRows] = useState<AdminUser[]>([]);

  const load = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id,user_id,display_name,phone,created_at,is_admin,is_suspended,admin_label",
      )
      .or("is_admin.eq.true,admin_label.not.is.null")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setRows((data ?? []) as AdminUser[]);
  };

  useEffect(() => {
    void load();
  }, []);

  const update = async (row: AdminUser, patch: Record<string, unknown>) => {
    if (row.user_id === currentUserId && patch.is_admin === false) {
      toast.error("Impossible de retirer vos propres droits.");
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("user_id", row.user_id);
    if (error) toast.error(error.message);
    else await load();
  };

  return (
    <PageContainer
      title="Administrateurs"
      description="Comptes autorisés à accéder au back-office."
    >
      <DataTable headers={["Nom", "UUID", "Libellé", "État", "Actions"]}>
        {rows.map((row) => (
          <tr key={row.id} className="border-b border-white/5">
            <td className="px-5 py-3 font-semibold">
              {row.display_name || "Sans nom"}
            </td>
            <td className="px-5 py-3 font-mono text-xs text-slate-500">
              {row.user_id}
            </td>
            <td className="px-5 py-3 text-slate-400">
              {row.admin_label || "Administrateur"}
            </td>
            <td className="px-5 py-3">
              {row.is_suspended ? (
                <Badge status="suspended" />
              ) : (
                <Badge status="active" />
              )}
            </td>
            <td className="px-5 py-3">
              <div className="flex gap-1">
                <ActionBtn
                  color="orange"
                  title="Suspendre/réactiver"
                  onClick={() =>
                    void update(row, { is_suspended: !row.is_suspended })
                  }
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                </ActionBtn>
                <ActionBtn
                  color="red"
                  title="Retirer l'accès"
                  onClick={() =>
                    void update(row, { is_admin: false, admin_label: null })
                  }
                >
                  <XCircle className="h-3.5 w-3.5" />
                </ActionBtn>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
    </PageContainer>
  );
}

function TabRoles({ supabase }: { supabase: SupabaseClient }) {
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [newRole, setNewRole] = useState({
    name: "",
    slug: "",
    description: "",
  });

  const load = async () => {
    const [r, p, l] = await Promise.all([
      supabase.from("admin_roles").select("*").order("name"),
      supabase.from("admin_permissions").select("*").order("module"),
      supabase.from("admin_role_permissions").select("*"),
    ]);
    if (r.error) toast.error(r.error.message);
    if (p.error) toast.error(p.error.message);
    if (l.error) toast.error(l.error.message);
    setRoles(r.data ?? []);
    setPermissions(p.data ?? []);
    setLinks(l.data ?? []);
  };

  useEffect(() => {
    void load();
  }, []);

  const addRole = async () => {
    const { error } = await supabase
      .from("admin_roles")
      .insert({ ...newRole, is_system: false });
    if (error) toast.error(error.message);
    else {
      setNewRole({ name: "", slug: "", description: "" });
      await load();
    }
  };

  const togglePermission = async (roleId: string, permissionId: string) => {
    const exists = links.some(
      (link) => link.role_id === roleId && link.permission_id === permissionId,
    );
    const result = exists
      ? await supabase
          .from("admin_role_permissions")
          .delete()
          .eq("role_id", roleId)
          .eq("permission_id", permissionId)
      : await supabase
          .from("admin_role_permissions")
          .insert({ role_id: roleId, permission_id: permissionId });
    if (result.error) toast.error(result.error.message);
    else await load();
  };

  return (
    <PageContainer
      title="Rôles & permissions"
      description="Définissez les droits des équipes d'administration."
    >
      <Panel title="Créer un rôle">
        <div className="grid gap-3 md:grid-cols-3">
          <Input
            value={newRole.name}
            onChange={(e) =>
              setNewRole((current) => ({ ...current, name: e.target.value }))
            }
            placeholder="Nom"
            className="border-white/10 bg-slate-700 text-white"
          />
          <Input
            value={newRole.slug}
            onChange={(e) =>
              setNewRole((current) => ({ ...current, slug: e.target.value }))
            }
            placeholder="Slug"
            className="border-white/10 bg-slate-700 text-white"
          />
          <Input
            value={newRole.description}
            onChange={(e) =>
              setNewRole((current) => ({
                ...current,
                description: e.target.value,
              }))
            }
            placeholder="Description"
            className="border-white/10 bg-slate-700 text-white"
          />
        </div>
        <Button
          onClick={() => void addRole()}
          className="mt-4 bg-blue-600 hover:bg-blue-700"
        >
          Ajouter
        </Button>
      </Panel>

      <div className="space-y-4">
        {roles.map((role) => (
          <Panel key={role.id} title={role.name}>
            <p className="mb-4 text-sm text-slate-500">{role.description}</p>
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {permissions.map((permission) => {
                const checked = links.some(
                  (link) =>
                    link.role_id === role.id &&
                    link.permission_id === permission.id,
                );
                return (
                  <label
                    key={permission.id}
                    className="flex items-start gap-3 rounded-xl bg-slate-900 p-3"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        void togglePermission(role.id, permission.id)
                      }
                      className="mt-1"
                    />
                    <span>
                      <span className="block text-sm font-bold">
                        {permission.code}
                      </span>
                      <span className="text-xs text-slate-500">
                        {permission.description}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </Panel>
        ))}
      </div>
    </PageContainer>
  );
}

function TabAudit({ supabase }: { supabase: SupabaseClient }) {
  const [rows, setRows] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const load = async () => {
    const { data, error } = await supabase
      .from("admin_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) toast.error(error.message);
    else setRows(data ?? []);
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = rows.filter((row) =>
    `${row.action} ${row.module} ${row.entity_type} ${row.entity_id}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <PageContainer
      title="Journal d'activité"
      description="Historique automatique des opérations sensibles."
      action={<RefreshButton onClick={() => void load()} />}
    >
      <SearchBox
        value={search}
        onChange={setSearch}
        placeholder="Rechercher dans le journal…"
      />
      <DataTable
        headers={["Date", "Action", "Module", "Entité", "Administrateur"]}
      >
        {filtered.map((row) => (
          <tr key={row.id} className="border-b border-white/5">
            <td className="px-5 py-3 text-xs text-slate-400">
              {new Date(row.created_at).toLocaleString("fr-FR")}
            </td>
            <td className="px-5 py-3 font-semibold">{row.action}</td>
            <td className="px-5 py-3 text-slate-400">{row.module}</td>
            <td className="px-5 py-3 text-xs text-slate-400">
              {row.entity_type} {row.entity_id}
            </td>
            <td className="px-5 py-3 font-mono text-xs text-slate-500">
              {row.admin_user_id || "—"}
            </td>
          </tr>
        ))}
      </DataTable>
    </PageContainer>
  );
}

function GenericCrudManager({
  supabase,
  currentUserId,
  config,
}: {
  supabase: SupabaseClient;
  currentUserId: string;
  config: CrudConfig;
}) {
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState<Record<string, any>>(() =>
    createEmptyForm(config.fields),
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    let query = supabase.from(config.table).select(config.select ?? "*");
    if (config.orderBy) {
      query = query.order(config.orderBy, {
        ascending: config.ascending ?? false,
      });
    }
    const { data, error } = await query;
    setLoading(false);
    if (error) toast.error(error.message);
    else setRows(data ?? []);
  };

  useEffect(() => {
    void load();
  }, [config.table]);

  const reset = () => {
    setForm(createEmptyForm(config.fields));
    setEditingId(null);
  };

  const edit = (row: any) => {
    const next: Record<string, any> = {};
    for (const field of config.fields) {
      next[field.key] = formatForForm(row[field.key], field.type);
    }
    setForm(next);
    setEditingId(row.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const save = async () => {
    for (const field of config.fields) {
      if (field.required && !String(form[field.key] ?? "").trim()) {
        toast.error(`${field.label} est obligatoire`);
        return;
      }
    }

    setSaving(true);
    let payload: Record<string, unknown> = {};
    try {
      for (const field of config.fields) {
        payload[field.key] = parseFieldValue(form[field.key], field.type);
      }
    } catch (error) {
      setSaving(false);
      toast.error(error instanceof Error ? error.message : "Donnée invalide");
      return;
    }

    if (config.userColumns?.createdBy && !editingId) {
      payload[config.userColumns.createdBy] = currentUserId;
    }
    if (config.userColumns?.updatedBy) {
      payload[config.userColumns.updatedBy] = currentUserId;
    }
    if (config.transformBeforeSave) {
      payload = config.transformBeforeSave(payload);
    }

    const result = editingId
      ? await supabase.from(config.table).update(payload).eq("id", editingId)
      : await supabase.from(config.table).insert(payload);

    setSaving(false);
    if (result.error) {
      toast.error(result.error.message);
      return;
    }

    toast.success(`${config.singular} ${editingId ? "modifié(e)" : "créé(e)"}`);
    reset();
    await load();
  };

  const remove = async (id: string) => {
    if (!window.confirm(`Supprimer cette ${config.singular} ?`)) return;
    const { error } = await supabase.from(config.table).delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Élément supprimé");
      await load();
    }
  };

  const listFields = config.fields.filter((field) => field.list).slice(0, 5);
  const filtered = rows.filter((row) =>
    listFields
      .map((field) => String(row[field.key] ?? ""))
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <PageContainer
      title={config.title}
      description={config.description}
      action={<RefreshButton onClick={() => void load()} loading={loading} />}
    >
      <Panel
        title={
          editingId
            ? `Modifier la ${config.singular}`
            : `Ajouter une ${config.singular}`
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          {config.fields.map((field) => (
            <DynamicField
              key={field.key}
              field={field}
              value={form[field.key]}
              onChange={(value) =>
                setForm((current) => ({ ...current, [field.key]: value }))
              }
            />
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            disabled={saving}
            onClick={() => void save()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving
              ? "Enregistrement..."
              : editingId
                ? "Enregistrer"
                : "Ajouter"}
          </Button>
          {editingId && (
            <Button onClick={reset} className="bg-slate-700 hover:bg-slate-600">
              <X className="mr-2 h-4 w-4" />
              Annuler
            </Button>
          )}
        </div>
      </Panel>

      <SearchBox
        value={search}
        onChange={setSearch}
        placeholder={`Rechercher une ${config.singular}…`}
      />

      <DataTable
        headers={[...listFields.map((field) => field.label), "Actions"]}
      >
        {filtered.map((row) => (
          <tr key={row.id} className="border-b border-white/5">
            {listFields.map((field) => (
              <td key={field.key} className="max-w-xs px-5 py-3 text-sm">
                <ListValue value={row[field.key]} field={field} />
              </td>
            ))}
            <td className="px-5 py-3">
              <div className="flex gap-1">
                <ActionBtn
                  color="blue"
                  title="Modifier"
                  onClick={() => edit(row)}
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </ActionBtn>
                <ActionBtn
                  color="slate"
                  title="Supprimer"
                  onClick={() => void remove(row.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </ActionBtn>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
      {!loading && filtered.length === 0 && <EmptyRow text="Aucun élément." />}
    </PageContainer>
  );
}

function DynamicField({
  field,
  value,
  onChange,
}: {
  field: FieldConfig;
  value: any;
  onChange: (value: any) => void;
}) {
  if (field.type === "boolean") {
    return (
      <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-700 p-3">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className="text-sm font-bold text-slate-300">{field.label}</span>
      </label>
    );
  }

  if (field.type === "select") {
    return (
      <FormLabel label={field.label}>
        <select
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full rounded-xl border border-white/10 bg-slate-700 px-3 text-sm text-white"
        >
          <option value="">Choisir</option>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FormLabel>
    );
  }

  if (field.type === "textarea" || field.type === "json") {
    return (
      <div className="md:col-span-2">
        <CmsTextarea
          label={field.label}
          value={value ?? ""}
          onChange={onChange}
          rows={field.type === "json" ? 7 : 4}
        />
      </div>
    );
  }

  return (
    <FormLabel label={field.label}>
      <Input
        type={
          field.type === "number"
            ? "number"
            : field.type === "datetime"
              ? "datetime-local"
              : "text"
        }
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={field.placeholder}
        className="border-white/10 bg-slate-700 text-white"
      />
    </FormLabel>
  );
}

function createEmptyForm(fields: FieldConfig[]) {
  return Object.fromEntries(
    fields.map((field) => [
      field.key,
      field.type === "json"
        ? JSON.stringify(field.defaultValue ?? {}, null, 2)
        : field.type === "tags"
          ? Array.isArray(field.defaultValue)
            ? field.defaultValue.join(", ")
            : ""
          : (field.defaultValue ?? (field.type === "boolean" ? false : "")),
    ]),
  );
}

function formatForForm(value: unknown, type?: FieldType) {
  if (type === "json") return JSON.stringify(value ?? {}, null, 2);
  if (type === "tags") return Array.isArray(value) ? value.join(", ") : "";
  if (type === "datetime" && value)
    return new Date(String(value)).toISOString().slice(0, 16);
  return value ?? (type === "boolean" ? false : "");
}

function parseFieldValue(value: any, type?: FieldType): unknown {
  if (type === "boolean") return Boolean(value);
  if (type === "number")
    return value === "" || value == null ? null : Number(value);
  if (type === "datetime") return value ? new Date(value).toISOString() : null;
  if (type === "json") {
    try {
      return JSON.parse(value || "{}");
    } catch {
      throw new Error("Un champ JSON contient une syntaxe invalide.");
    }
  }
  if (type === "tags") {
    return String(value ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return value === "" ? null : value;
}

function ListValue({ value, field }: { value: any; field: FieldConfig }) {
  if (field.type === "boolean") return <span>{value ? "Oui" : "Non"}</span>;
  if (field.key === "status") return <Badge status={String(value)} />;
  if (field.type === "datetime" && value)
    return <span>{new Date(value).toLocaleString("fr-FR")}</span>;
  if (field.type === "json")
    return (
      <span className="line-clamp-2 text-xs text-slate-500">
        {JSON.stringify(value)}
      </span>
    );
  if (Array.isArray(value)) return <span>{value.join(", ")}</span>;
  return <span className="line-clamp-2">{String(value ?? "—")}</span>;
}

function LocationPanel({
  title,
  rows,
  value,
  onChange,
  onAdd,
  onDelete,
  parentValue,
  onParentChange,
  parentRows,
  parentLabel,
}: {
  title: string;
  rows: any[];
  value: string;
  onChange: (value: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  parentValue?: string;
  onParentChange?: (value: string) => void;
  parentRows?: any[];
  parentLabel?: string;
}) {
  return (
    <Panel title={title}>
      <div className="space-y-2">
        {parentRows && onParentChange && (
          <select
            value={parentValue}
            onChange={(e) => onParentChange(e.target.value)}
            className="h-11 w-full rounded-xl border border-white/10 bg-slate-700 px-3 text-white"
          >
            <option value="">{parentLabel || "Parent"}</option>
            {parentRows.map((row) => (
              <option key={row.id} value={row.id}>
                {row.name}
              </option>
            ))}
          </select>
        )}
        <div className="flex gap-2">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Nouvelle ${title.toLowerCase()}`}
            className="border-white/10 bg-slate-700 text-white"
          />
          <Button onClick={onAdd} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="mt-4 max-h-[420px] space-y-1 overflow-y-auto">
        {rows.map((row) => (
          <div
            key={row.id}
            className="flex items-center justify-between rounded-xl bg-slate-900 px-3 py-2"
          >
            <div>
              <p className="text-sm font-semibold">{row.name}</p>
              <p className="text-[11px] text-slate-500">{row.slug}</p>
            </div>
            <ActionBtn
              color="slate"
              title="Supprimer"
              onClick={() => onDelete(row.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </ActionBtn>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function PageContainer({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">{title}</h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">
            {description}
          </p>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-800 p-5">
      <h2 className="mb-4 font-black text-white">{title}</h2>
      {children}
    </div>
  );
}

function FormLabel({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-slate-400">
        {label}
      </span>
      {children}
    </label>
  );
}

function CmsInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <FormLabel label={label}>
      <Input
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        className="border-white/10 bg-slate-700 text-white"
      />
    </FormLabel>
  );
}

function CmsTextarea({
  label,
  value,
  onChange,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <FormLabel label={label}>
      <textarea
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        className="w-full resize-y rounded-xl border border-white/10 bg-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
      />
    </FormLabel>
  );
}

function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative max-w-sm">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="border-white/10 bg-slate-800 pl-9 text-white placeholder:text-slate-500"
      />
    </div>
  );
}

function RefreshButton({
  onClick,
  loading,
}: {
  onClick: () => void;
  loading?: boolean;
}) {
  return (
    <Button onClick={onClick} className="bg-slate-800 hover:bg-slate-700">
      <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
      Actualiser
    </Button>
  );
}

function DataTable({
  headers,
  children,
}: {
  headers: string[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
            {headers.map((header) => (
              <th key={header} className="whitespace-nowrap px-5 py-3">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return <p className="py-10 text-center text-sm text-slate-500">{text}</p>;
}

const COLOR_MAP: Record<string, string> = {
  emerald:
    "bg-emerald-900/40 text-emerald-400 hover:bg-emerald-800/60 border-emerald-700/30",
  red: "bg-red-900/40 text-red-400 hover:bg-red-800/60 border-red-700/30",
  orange:
    "bg-orange-900/40 text-orange-400 hover:bg-orange-800/60 border-orange-700/30",
  blue: "bg-blue-900/40 text-blue-400 hover:bg-blue-800/60 border-blue-700/30",
  slate:
    "bg-slate-700/60 text-slate-400 hover:bg-slate-600/60 border-slate-600/30",
};

function ActionBtn({
  color,
  title,
  onClick,
  children,
}: {
  color: string;
  title: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition ${COLOR_MAP[color] ?? COLOR_MAP.slate}`}
    >
      {children}
    </button>
  );
}


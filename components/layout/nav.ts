import type { LucideIcon } from "lucide-react";
import type { Permission } from "@/lib/permissions";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Building2,
  FileText,
  Handshake,
  History,
  IdCard,
  LayoutDashboard,
  Megaphone,
  Package,
  ScrollText,
  UserCog,
  Receipt,
  Route,
  Settings,
  Truck,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: "incidents" | "notifications" | "delayed" | "documents" | "invoices" | "leads";
  /** Droit nécessaire pour voir l'entrée (espace entreprise). */
  perm?: Permission;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const ADMIN_NAV: NavGroup[] = [
  { title: "Pilotage", items: [{ href: "/dashboard", label: "Vue d'ensemble", icon: LayoutDashboard }] },
  {
    title: "Référentiels",
    items: [
      { href: "/entreprises", label: "Entreprises", icon: Building2 },
      { href: "/transporteurs", label: "Transporteurs", icon: Handshake },
      { href: "/vitrine", label: "Annuaire public", icon: Megaphone, badge: "leads" },
      { href: "/camions", label: "Camions", icon: Truck },
      { href: "/chauffeurs", label: "Chauffeurs", icon: IdCard },
    ],
  },
  {
    title: "Exploitation",
    items: [
      { href: "/missions", label: "Missions", icon: Route },
      { href: "/chargements", label: "Chargements", icon: Package },
      { href: "/documents", label: "Documents", icon: FileText, badge: "documents" },
      { href: "/factures", label: "Factures", icon: Receipt, badge: "invoices" },
      { href: "/operations", label: "Suivi des opérations", icon: Activity, badge: "delayed" },
      { href: "/incidents", label: "Incidents et retards", icon: AlertTriangle, badge: "incidents" },
    ],
  },
  {
    title: "Analyse",
    items: [
      { href: "/rapports", label: "Rapports et statistiques", icon: BarChart3 },
      { href: "/notifications", label: "Notifications", icon: Bell, badge: "notifications" },
      { href: "/audit", label: "Journal d'audit", icon: ScrollText },
      { href: "/parametres", label: "Paramètres", icon: Settings },
    ],
  },
];

export const COMPANY_NAV: NavGroup[] = [
  { title: "Mon entreprise", items: [{ href: "/entreprise", label: "Tableau de bord", icon: LayoutDashboard }] },
  {
    title: "Ressources",
    items: [
      { href: "/entreprise/camions", label: "Mes camions", icon: Truck },
      { href: "/entreprise/chauffeurs", label: "Chauffeurs et transporteurs", icon: IdCard },
      { href: "/entreprise/vitrine", label: "Annuaire public", icon: Megaphone, badge: "leads" },
    ],
  },
  {
    title: "Opérations",
    items: [
      { href: "/entreprise/missions", label: "Missions", icon: Route },
      { href: "/entreprise/chargements", label: "Chargements", icon: Package },
      { href: "/entreprise/documents", label: "Documents", icon: FileText, badge: "documents" },
      { href: "/entreprise/factures", label: "Factures", icon: Receipt, badge: "invoices", perm: "invoice.view" },
      { href: "/entreprise/suivi", label: "Suivi des opérations", icon: Activity, badge: "delayed" },
      { href: "/entreprise/incidents", label: "Incidents et retards", icon: AlertTriangle, badge: "incidents" },
    ],
  },
  {
    title: "Analyse",
    items: [
      { href: "/entreprise/historique", label: "Historique", icon: History },
      { href: "/entreprise/statistiques", label: "Statistiques", icon: BarChart3 },
      { href: "/entreprise/notifications", label: "Notifications", icon: Bell, badge: "notifications" },
      { href: "/entreprise/utilisateurs", label: "Utilisateurs et accès", icon: UserCog, perm: "users.manage" },
      { href: "/entreprise/audit", label: "Journal d'audit", icon: ScrollText, perm: "audit.view" },
    ],
  },
];

import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Building2,
  Handshake,
  History,
  IdCard,
  LayoutDashboard,
  Package,
  Route,
  Settings,
  Truck,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: "incidents" | "notifications" | "delayed";
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
      { href: "/camions", label: "Camions", icon: Truck },
      { href: "/chauffeurs", label: "Chauffeurs", icon: IdCard },
    ],
  },
  {
    title: "Exploitation",
    items: [
      { href: "/missions", label: "Missions", icon: Route },
      { href: "/chargements", label: "Chargements", icon: Package },
      { href: "/operations", label: "Suivi des opérations", icon: Activity, badge: "delayed" },
      { href: "/incidents", label: "Incidents et retards", icon: AlertTriangle, badge: "incidents" },
    ],
  },
  {
    title: "Analyse",
    items: [
      { href: "/rapports", label: "Rapports et statistiques", icon: BarChart3 },
      { href: "/notifications", label: "Notifications", icon: Bell, badge: "notifications" },
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
    ],
  },
  {
    title: "Opérations",
    items: [
      { href: "/entreprise/missions", label: "Missions", icon: Route },
      { href: "/entreprise/chargements", label: "Chargements", icon: Package },
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
    ],
  },
];

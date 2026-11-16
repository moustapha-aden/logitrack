"use client";

import { createContext, useContext, useMemo } from "react";
import { useAppData } from "@/lib/store";
import { roleCan, ROLES, type Permission } from "@/lib/permissions";
import type { AppData, AuditEntry, TransportLead, Carrier, CompanyRole, CompanyUser, Company, Driver, Incident, Invoice, Load, Mission, MissionDocument, MissionMessage, TransportRequest, Truck } from "@/types";

/** Périmètre courant : null = administration (toutes les entreprises). */
export const ScopeContext = createContext<string | null>(null);
export const useScope = () => useContext(ScopeContext);

export interface Lookups {
  company: (id: string | null | undefined) => Company | undefined;
  carrier: (id: string | null | undefined) => Carrier | undefined;
  truck: (id: string | null | undefined) => Truck | undefined;
  driver: (id: string | null | undefined) => Driver | undefined;
  mission: (id: string | null | undefined) => Mission | undefined;
  loadOfMission: (missionId: string) => Load | undefined;
}

function buildLookups(data: AppData): Lookups {
  const maps = {
    company: new Map(data.companies.map((x) => [x.id, x])),
    carrier: new Map(data.carriers.map((x) => [x.id, x])),
    truck: new Map(data.trucks.map((x) => [x.id, x])),
    driver: new Map(data.drivers.map((x) => [x.id, x])),
    mission: new Map(data.missions.map((x) => [x.id, x])),
    load: new Map(data.loads.map((x) => [x.missionId, x])),
  };
  return {
    company: (id) => (id ? maps.company.get(id) : undefined),
    carrier: (id) => (id ? maps.carrier.get(id) : undefined),
    truck: (id) => (id ? maps.truck.get(id) : undefined),
    driver: (id) => (id ? maps.driver.get(id) : undefined),
    mission: (id) => (id ? maps.mission.get(id) : undefined),
    loadOfMission: (missionId) => maps.load.get(missionId),
  };
}

export interface ScopedData {
  scope: string | null;
  all: AppData;
  companies: Company[];
  carriers: Carrier[];
  trucks: Truck[];
  drivers: Driver[];
  missions: Mission[];
  loads: Load[];
  incidents: Incident[];
  documents: MissionDocument[];
  requests: TransportRequest[];
  messages: MissionMessage[];
  invoices: Invoice[];
  audit: AuditEntry[];
  leads: TransportLead[];
  notifications: AppData["notifications"];
  activity: AppData["activity"];
  lookups: Lookups;
}

/** Données filtrées selon le périmètre (admin ou entreprise). */
export function useData(): ScopedData {
  const data = useAppData();
  const scope = useScope();
  return useMemo(() => {
    const lookups = buildLookups(data);
    if (!scope) {
      // les notifications destinées aux transporteurs restent dans leur espace
      return { scope, all: data, ...data, notifications: data.notifications.filter((n) => !n.carrierId), lookups };
    }
    const missions = data.missions.filter((m) => m.companyId === scope);
    const missionIds = new Set(missions.map((m) => m.id));
    return {
      scope,
      all: data,
      companies: data.companies.filter((c) => c.id === scope),
      carriers: data.carriers.filter((c) => c.companyId === scope),
      trucks: data.trucks.filter((t) => t.companyId === scope),
      drivers: data.drivers.filter((d) => d.companyId === scope),
      missions,
      loads: data.loads.filter((l) => missionIds.has(l.missionId)),
      incidents: data.incidents.filter((i) => missionIds.has(i.missionId)),
      documents: data.documents.filter((d) => missionIds.has(d.missionId)),
      requests: data.requests.filter((r) => missionIds.has(r.missionId)),
      messages: data.messages.filter((x) => missionIds.has(x.missionId)),
      invoices: data.invoices.filter((x) => missionIds.has(x.missionId)),
      audit: data.audit.filter((a) => a.companyId === scope),
      leads: data.leads.filter((l) => l.companyId === scope),
      notifications: data.notifications.filter((n) => n.companyId === scope),
      activity: data.activity.filter((a) => a.companyId === scope),
      lookups,
    };
  }, [data, scope]);
}

export interface Permissions {
  /** Utilisateur simulé de l'espace entreprise (null dans l'administration plateforme). */
  user: CompanyUser | null;
  role: CompanyRole | null;
  roleLabel: string;
  active: boolean;
  /** Nom inscrit dans l'activité, l'historique et le journal d'audit. */
  actor: string;
  can: (perm: Permission) => boolean;
}

/** Droits de l'utilisateur courant. L'administration plateforme dispose de tous les droits. */
export function usePermissions(): Permissions {
  const data = useAppData();
  const scope = useScope();
  return useMemo(() => {
    if (!scope) return { user: null, role: null, roleLabel: "Administrateur plateforme", active: true, actor: data.settings.userName, can: () => true };
    const company = data.companies.find((c) => c.id === scope);
    const user = data.users.find((u) => u.id === data.prefs.userId && u.companyId === scope) ?? data.users.find((u) => u.companyId === scope && u.role === "admin") ?? null;
    // aucune fiche utilisateur (entreprise ancienne ou importée) : administrateur implicite
    const noUsers = !data.users.some((u) => u.companyId === scope);
    const role: CompanyRole = user?.role ?? (noUsers ? "admin" : "lecture");
    const active = user ? user.active : noUsers;
    return {
      user,
      role,
      roleLabel: ROLES[role].label,
      active,
      actor: user ? `${user.name} · ${company?.initials ?? ""}` : `Exploitation ${company?.initials ?? ""}`,
      can: (perm) => active && roleCan(role, perm),
    };
  }, [data, scope]);
}

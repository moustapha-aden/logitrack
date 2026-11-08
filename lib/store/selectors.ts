"use client";

import { createContext, useContext, useMemo } from "react";
import { useAppData } from "@/lib/store";
import type { AppData, Carrier, Company, Driver, Incident, Load, Mission, Truck } from "@/types";

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
      return { scope, all: data, ...data, lookups };
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
      notifications: data.notifications.filter((n) => n.companyId === scope),
      activity: data.activity.filter((a) => a.companyId === scope),
      lookups,
    };
  }, [data, scope]);
}

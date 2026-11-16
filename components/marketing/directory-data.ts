// ─────────────────────────────────────────────────────────────
// Annuaire public : ce que les entreprises acceptent de montrer.
// Camions et chauffeurs publiés, entreprises présentées. Aucune
// coordonnée personnelle (téléphone de chauffeur, tarifs) n'en sort.
// ─────────────────────────────────────────────────────────────
import { COMPANY_TYPES, TRUCK_TYPES } from "@/lib/constants";
import { placeName } from "@/lib/data/geo";
import type { AppData, Company, Driver, Truck, TruckType } from "@/types";

export interface DirTruck {
  kind: "truck";
  truck: Truck;
  driver?: Driver;
  company: Company;
  /** Fin prévue de la mission en cours (camion actuellement en route). */
  freeFrom?: string;
}

export interface DirDriver {
  kind: "driver";
  driver: Driver;
  company: Company;
  truck?: Truck;
  missionsDone: number;
  routes: string[];
  available: boolean;
}

export interface DirCompany {
  kind: "company";
  company: Company;
  trucks: number;
  drivers: number;
  types: TruckType[];
  onTimeRate: number | null;
  missionsDone: number;
  since: number;
}

/** Nom affiché publiquement : prénom et initiale du nom. */
export const publicName = (d: Pick<Driver, "firstName" | "lastName">) => `${d.firstName} ${d.lastName.charAt(0)}.`;

const activeCompany = (data: AppData, id: string) => data.companies.find((c) => c.id === id && c.status === "actif" && c.type !== "client");

export function directoryTrucks(data: AppData): DirTruck[] {
  return data.trucks
    .filter((t) => t.published && (t.status === "disponible" || t.status === "en_mission"))
    .flatMap((t) => {
      const company = activeCompany(data, t.companyId);
      if (!company) return [];
      const current = data.missions.find((m) => m.truckId === t.id && m.step >= 2 && m.step <= 5);
      return [{ kind: "truck" as const, truck: t, driver: data.drivers.find((d) => d.id === t.driverId), company, freeFrom: t.status === "en_mission" ? current?.plannedArrival : undefined }];
    });
}

export function directoryDrivers(data: AppData): DirDriver[] {
  return data.drivers
    .filter((d) => d.published && d.availability !== "conge")
    .flatMap((d) => {
      const company = activeCompany(data, d.companyId);
      if (!company) return [];
      const done = data.missions.filter((m) => m.driverId === d.id && m.step >= 6);
      // itinéraires maîtrisés : destinations les plus fréquentes du chauffeur
      const counts = new Map<string, number>();
      for (const m of data.missions.filter((x) => x.driverId === d.id)) counts.set(m.destination, (counts.get(m.destination) ?? 0) + 1);
      const routes = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => placeName(id));
      return [{ kind: "driver" as const, driver: d, company, truck: data.trucks.find((t) => t.id === d.truckId), missionsDone: done.length, routes, available: d.availability === "disponible" }];
    });
}

export function directoryCompanies(data: AppData): DirCompany[] {
  return data.companies
    .filter((c) => c.listed && c.status === "actif" && c.type !== "client")
    .map((c) => {
      const trucks = data.trucks.filter((t) => t.companyId === c.id);
      const done = data.missions.filter((m) => m.companyId === c.id && m.step >= 6);
      return {
        kind: "company" as const,
        company: c,
        trucks: trucks.length,
        drivers: data.drivers.filter((d) => d.companyId === c.id).length,
        types: [...new Set(trucks.map((t) => t.type))],
        onTimeRate: done.length ? Math.round((done.filter((m) => !m.delayed).length / done.length) * 100) : null,
        missionsDone: done.length,
        since: new Date(c.createdAt).getFullYear(),
      };
    });
}

export const companyTypeLabel = (c: Company) => COMPANY_TYPES[c.type].label;
export const truckTypeLabel = (t: TruckType) => TRUCK_TYPES[t];

import { DEMO_NOW } from "@/lib/constants";
import { formatMonth } from "@/lib/utils";
import type { AppData, Mission, MonthlyStat } from "@/types";

const DAY = 86400000;
const pseudo = (i: number) => {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

/** Part d'activité d'un périmètre (1 pour l'administration). */
export function scopeShare(all: AppData, missions: Mission[]): number {
  return all.missions.length ? Math.max(0.05, missions.length / all.missions.length) : 1;
}

/** Série quotidienne (30 jours) : historique consolidé fictif + missions réelles du jeu de données. */
export function dailySeries(missions: Mission[], share: number) {
  const end = new Date(DEMO_NOW).getTime();
  return Array.from({ length: 30 }, (_, k) => {
    const i = 29 - k;
    const dayStart = end - i * DAY;
    const d = new Date(dayStart);
    const key = d.toISOString().slice(0, 10);
    const real = missions.filter((m) => m.plannedDeparture.slice(0, 10) === key);
    const base = Math.round((4.2 + pseudo(k + 3) * 3.4) * share);
    const missionsCount = base + real.length;
    const delays = Math.round(base * (0.04 + pseudo(k + 11) * 0.1)) + real.filter((m) => m.delayed).length;
    return {
      label: new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", timeZone: "Africa/Djibouti" }).format(d).replace(".", ""),
      missions: missionsCount,
      livrees: Math.max(0, missionsCount - delays - (i === 0 ? real.filter((m) => m.step < 6).length : 0)),
      retards: delays,
    };
  });
}

/** Mois en cours (incomplet) dans le jeu de démonstration. */
export const CURRENT_MONTH = DEMO_NOW.slice(0, 7);

/**
 * Série mensuelle. `skipLast` décale la fenêtre vers le passé (période précédente).
 */
export function monthlySeries(monthly: MonthlyStat[], share: number, months = 12, skipLast = 0) {
  const end = monthly.length - skipLast;
  return monthly.slice(Math.max(0, end - months), end).map((m) => {
    const missions = Math.max(1, Math.round(m.missions * share));
    const delays = Math.round(m.delays * share);
    const incidents = Math.round(m.incidents * share);
    return {
      label: `${formatMonth(m.month)}${m.month === CURRENT_MONTH ? "*" : ""}`,
      partial: m.month === CURRENT_MONTH,
      missions,
      livrees: missions - delays,
      retards: delays,
      incidents,
      tauxPonctualite: Math.round(((m.missions - m.delays) / m.missions) * 1000) / 10,
      utilisation: m.fleetUsage,
    };
  });
}

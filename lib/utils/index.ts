import { TIME_ZONE } from "@/lib/constants";
import type { Driver, LoadStatus, Mission, MissionStatus } from "@/types";

type ClassValue = string | false | null | undefined | 0;
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}

const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric", timeZone: TIME_ZONE });
const dateShortFmt = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", timeZone: TIME_ZONE });
const timeFmt = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: TIME_ZONE });
const numberFmt = new Intl.NumberFormat("fr-FR");
const monthFmt = new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: "UTC" });

export const formatDate = (iso: string) => dateFmt.format(new Date(iso));
export const formatDateShort = (iso: string) => dateShortFmt.format(new Date(iso));
export const formatTime = (iso: string) => timeFmt.format(new Date(iso));
export const formatDateTime = (iso: string) => `${dateShortFmt.format(new Date(iso))} · ${timeFmt.format(new Date(iso))}`;
export const formatNumber = (n: number) => numberFmt.format(n);
export const formatDjf = (n: number) => `${numberFmt.format(Math.round(n))} DJF`;
export const formatMonth = (yyyyMm: string) => {
  const label = monthFmt.format(new Date(`${yyyyMm}-01T00:00:00Z`)).replace(".", "");
  return label.charAt(0).toUpperCase() + label.slice(1);
};

/** Valeur pour <input type="datetime-local"> (heure de Djibouti, UTC+3). */
export function toLocalInput(iso: string): string {
  const d = new Date(new Date(iso).getTime() + 3 * 3600 * 1000);
  return d.toISOString().slice(0, 16);
}
export function fromLocalInput(value: string): string {
  return new Date(`${value}:00+03:00`).toISOString();
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export const driverName = (d: Pick<Driver, "firstName" | "lastName"> | undefined | null) =>
  d ? `${d.firstName} ${d.lastName}` : "—";

/** Statut global d'une mission, dérivé de son étape et du drapeau de retard. */
export function missionStatus(m: Pick<Mission, "step" | "delayed">): MissionStatus {
  if (m.step >= 6) return "terminee";
  if (m.delayed) return "en_retard";
  if (m.step >= 2) return "en_cours";
  return "planifiee";
}

export function isActiveMission(m: Pick<Mission, "step">): boolean {
  return m.step >= 2 && m.step <= 5;
}

/** Statut d'un chargement, dérivé de l'étape de la mission associée. */
export function loadStatusFromStep(step: number): LoadStatus {
  if (step <= 1) return "en_attente";
  if (step === 2) return "en_chargement";
  if (step === 3) return "charge";
  if (step <= 5) return "en_transit";
  return "livre";
}

export function missionProgress(step: number): number {
  return Math.round((step / 7) * 100);
}

export function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function includesText(haystack: (string | number | null | undefined)[], needle: string): boolean {
  const n = needle.trim().toLowerCase();
  if (!n) return true;
  return haystack.some((h) => h !== null && h !== undefined && String(h).toLowerCase().includes(n));
}

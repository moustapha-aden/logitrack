// ─────────────────────────────────────────────────────────────
// Lien de suivi client : ce que le client voit, et seulement cela.
// Le transitaire reste maître des informations partagées.
// ─────────────────────────────────────────────────────────────
import { DEMO_NOW } from "@/lib/constants";
import type { ClientShare, Incident, Mission, OperationStep } from "@/types";

/** Jalons simplifiés pour le client (les 8 étapes internes regroupées). */
export const CLIENT_MILESTONES: { label: string; from: OperationStep }[] = [
  { label: "Prise en charge", from: 0 },
  { label: "Chargement", from: 2 },
  { label: "En route", from: 4 },
  { label: "Arrivé à destination", from: 5 },
  { label: "Livré", from: 6 },
];

/** Jalons proposés pour les e-mails automatiques au client. */
export const NOTIFY_STEPS: { step: OperationStep; label: string }[] = [
  { step: 2, label: "Chargement démarré" },
  { step: 4, label: "En route" },
  { step: 5, label: "Arrivé à destination" },
  { step: 6, label: "Livré" },
];

export function milestoneIndex(step: OperationStep): number {
  let idx = 0;
  CLIENT_MILESTONES.forEach((ms, i) => {
    if (step >= ms.from) idx = i;
  });
  return idx;
}

/** Heure du jalon, prise dans l'historique de la mission. */
export function milestoneAt(m: Pick<Mission, "history">, from: OperationStep): string | undefined {
  return m.history.find((h) => h.step === from)?.at;
}

/** Livraison estimée : arrivée prévue + retards déclarés encore ouverts. Toujours affichée comme estimation. */
export function estimatedArrival(m: Pick<Mission, "id" | "plannedArrival" | "step">, incidents: Incident[]): string {
  const open = incidents.filter((i) => i.missionId === m.id && i.status !== "resolu").reduce((s, i) => s + (i.delayMinutes ?? 0), 0);
  return new Date(Date.parse(m.plannedArrival) + open * 60000).toISOString();
}

export type ShareState = "actif" | "expire" | "desactive";

export function shareState(share: Pick<ClientShare, "revoked" | "expiresAt">, now = Date.parse(DEMO_NOW)): ShareState {
  if (share.revoked) return "desactive";
  if (Date.parse(share.expiresAt) < now) return "expire";
  return "actif";
}

export const trackingPath = (token: string) => `/suivi/${token}`;

// ─────────────────────────────────────────────────────────────
// Coordination transitaire ↔ transporteur : demandes de transport,
// affectation par un partenaire et indicateurs.
// ─────────────────────────────────────────────────────────────
import { DEMO_NOW } from "@/lib/constants";
import type { Mission, TransportRequest } from "@/types";

/** Mission prête à partir : flotte propre complète ou camion fourni par un transporteur partenaire. */
export function isAssigned(m: Pick<Mission, "truckId" | "driverId" | "carrierAssignment">): boolean {
  return (!!m.truckId && !!m.driverId) || !!m.carrierAssignment;
}

/** Statut affiché : une demande ouverte dont la date limite est passée est « expirée ». */
export function requestStatus(r: Pick<TransportRequest, "status" | "deadline">, now = Date.parse(DEMO_NOW)): TransportRequest["status"] | "expiree" {
  if (r.status === "ouverte" && Date.parse(r.deadline) < now) return "expiree";
  return r.status;
}

/** Dernière demande d'une mission (la plus récente). */
export function latestRequest(requests: TransportRequest[], missionId: string): TransportRequest | undefined {
  return requests.filter((r) => r.missionId === missionId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

/** Demande à laquelle un transporteur doit encore répondre. */
export function awaitsAnswer(r: TransportRequest, carrierId: string): boolean {
  const resp = r.responses.find((x) => x.carrierId === carrierId);
  return !!resp && requestStatus(r) === "ouverte" && (resp.status === "envoyee" || resp.status === "vue");
}

/** Indicateurs d'un transporteur partenaire : visibles uniquement par le donneur d'ordre. */
export function carrierStats(requests: TransportRequest[], carrierId: string) {
  const responses = requests.flatMap((r) => r.responses.filter((x) => x.carrierId === carrierId).map((x) => ({ r, x })));
  const answered = responses.filter(({ x }) => x.answeredAt);
  const accepted = answered.filter(({ x }) => x.status === "acceptee").length;
  const delays = answered.map(({ r, x }) => (Date.parse(x.answeredAt!) - Date.parse(r.createdAt)) / 60000).filter((n) => n >= 0);
  const avgMin = delays.length ? Math.round(delays.reduce((a, b) => a + b, 0) / delays.length) : null;
  return {
    received: responses.length,
    answered: answered.length,
    acceptRate: answered.length ? Math.round((accepted / answered.length) * 100) : null,
    avgResponseMin: avgMin,
  };
}

export function formatMinutes(min: number | null): string {
  if (min === null) return "—";
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, "0")}`;
}

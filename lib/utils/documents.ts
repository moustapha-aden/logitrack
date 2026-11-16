// ─────────────────────────────────────────────────────────────
// Documents de transit : checklist par type d'opération,
// règles de blocage d'étape et indicateurs.
// ─────────────────────────────────────────────────────────────
import { DEMO_NOW, DOC_CLEARED, DOC_TYPES } from "@/lib/constants";
import type { DocAudience, DocType, Mission, MissionDocument, OperationStep } from "@/types";

const H = 3600 * 1000;
const PORTS = new Set(["port-djibouti", "doraleh"]);
const ETHIOPIA = new Set(["dire-dawa", "galafi", "guelile"]);

export type OperationKind = "transit_ethiopie" | "import" | "local";

export const OPERATION_KINDS: Record<OperationKind, string> = {
  transit_ethiopie: "Transit Éthiopie",
  import: "Import — sortie port",
  local: "Transport local",
};

/** Type d'opération déduit du trajet (à remplacer par un champ saisi quand le modèle sera validé). */
export function operationKind(m: Pick<Mission, "origin" | "destination">): OperationKind {
  if (ETHIOPIA.has(m.destination)) return "transit_ethiopie";
  if (PORTS.has(m.origin)) return "import";
  return "local";
}

/** Pièces attendues pour une mission, selon le type d'opération et la marchandise. */
export function checklistFor(m: Pick<Mission, "origin" | "destination" | "goodsType">, hazardous: boolean): DocType[] {
  const kind = operationKind(m);
  const list: DocType[] = [];
  if (kind !== "local") {
    list.push("facture_commerciale", "liste_colisage", "connaissement");
    if (m.goodsType === "conteneurs") list.push("delivery_order");
    list.push("declaration_douane", "bon_a_enlever", "bon_sortie_port");
    if (kind === "transit_ethiopie") list.push("doc_transit_ethiopie", "certificat_origine");
  }
  if (hazardous) list.push("autorisation_md");
  list.push("ordre_mission");
  if (m.goodsType === "conteneurs" && kind !== "local") list.push("interchange_eir");
  list.push("pod");
  return list;
}

/** Échéance par défaut d'une pièce, calée sur le départ et l'arrivée prévus. */
export function defaultDueAt(type: DocType, m: Pick<Mission, "plannedDeparture" | "plannedArrival">): string {
  const dep = Date.parse(m.plannedDeparture);
  const arr = Date.parse(m.plannedArrival);
  const block = DOC_TYPES[type].blocksStep;
  let t = dep - 24 * H;
  if (type === "pod") t = arr + 24 * H;
  else if (type === "interchange_eir") t = dep + 2 * H;
  else if (block === 2) t = dep - 6 * H;
  else if (block === 4) t = dep;
  return new Date(t).toISOString();
}

/** Partage par défaut : ce dont le transporteur a besoin sur la route, la preuve de livraison pour le client. */
export function defaultSharing(type: DocType): DocAudience[] {
  if (type === "pod") return ["transporteur", "client"];
  if (type === "ordre_mission" || type === "interchange_eir" || type === "bon_sortie_port" || type === "doc_transit_ethiopie" || type === "autorisation_md") return ["transporteur"];
  return [];
}

export function newDocument(id: string, missionId: string, type: DocType, m: Pick<Mission, "plannedDeparture" | "plannedArrival">, now: string): MissionDocument {
  const meta = DOC_TYPES[type];
  return {
    id,
    missionId,
    type,
    status: "attendu",
    responsible: meta.responsible,
    blocksStep: meta.blocksStep,
    dueAt: defaultDueAt(type, m),
    sharedWith: defaultSharing(type),
    versions: [],
    updatedAt: now,
  };
}

export const isCleared = (d: Pick<MissionDocument, "status">) => DOC_CLEARED.includes(d.status);

/** Pièce en attente d'une action du responsable (non reçue, à corriger ou expirée). */
export const isMissing = (d: Pick<MissionDocument, "status">) => d.status === "attendu" || d.status === "a_corriger";

/** Pièce reçue qui attend une vérification par l'exploitation. */
export const isToReview = (d: Pick<MissionDocument, "status">) => d.status === "recu";

/** Échéance dépassée pour une pièce manquante (référence : date de la démonstration). */
export function isOverdue(d: Pick<MissionDocument, "status" | "dueAt">, now = Date.parse(DEMO_NOW)): boolean {
  return isMissing(d) && !!d.dueAt && Date.parse(d.dueAt) < now;
}

/** Pièces qui empêchent de passer de l'étape `from` à l'étape `to`. */
export function blockingDocs(docs: MissionDocument[], missionId: string, from: OperationStep, to: OperationStep): MissionDocument[] {
  if (to <= from) return [];
  return docs.filter((d) => d.missionId === missionId && d.blocksStep !== null && d.blocksStep > from && d.blocksStep <= to && !isCleared(d));
}

/** Libellé d'une pièce bloquante, selon son statut (message au chauffeur ou au transporteur). */
export function blockerLabel(d: Pick<MissionDocument, "type" | "status">): string {
  const label = DOC_TYPES[d.type].label;
  if (d.status === "recu") return `${label} : reçue, en cours de vérification par l'exploitation`;
  if (d.status === "a_corriger") return `${label} : à corriger`;
  return `${label} : pas encore fournie`;
}

/** Pièce bloquante d'une mission ouverte, quelle que soit l'étape bloquée. */
export const isBlockingOpen = (d: Pick<MissionDocument, "blocksStep" | "status">, missionStep: number) => d.blocksStep !== null && d.blocksStep > missionStep && !isCleared(d);

export function docProgress(docs: MissionDocument[]) {
  const cleared = docs.filter(isCleared).length;
  return { cleared, total: docs.length, pct: docs.length ? Math.round((cleared / docs.length) * 100) : 100 };
}

/** Ordre d'affichage : catégorie puis ordre du catalogue. */
const ORDER = Object.keys(DOC_TYPES) as DocType[];
export const byCatalogOrder = (a: MissionDocument, b: MissionDocument) => ORDER.indexOf(a.type) - ORDER.indexOf(b.type);

/** Pièces visibles par le transporteur et le chauffeur : celles partagées, plus toutes les pièces bloquantes. */
export function routeDocs(docs: MissionDocument[], missionId: string): MissionDocument[] {
  return docs.filter((d) => d.missionId === missionId && (d.sharedWith.includes("transporteur") || d.blocksStep !== null)).sort(byCatalogOrder);
}

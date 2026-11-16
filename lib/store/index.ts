"use client";

import { useSyncExternalStore } from "react";
import { createSeed, DATA_VERSION } from "@/lib/data/seed";
import { DOC_STATUS, DOC_TYPES, INVOICE_FLOWS, INVOICE_STATUS, OPERATION_STEPS, PAYMENT_MODES } from "@/lib/constants";
import { formatMoney } from "@/lib/utils/invoices";
import { auditActionOf, ROLES } from "@/lib/permissions";
import { checklistFor, defaultDueAt, newDocument } from "@/lib/utils/documents";
import { demoNowIso, demoNowMs } from "@/lib/utils/clock";
import { placeName } from "@/lib/data/geo";
import { driverName, formatDateTime, isActiveMission, uid } from "@/lib/utils";
import type {
  ActivityItem,
  AppData,
  AppNotification,
  AuditAction,
  AuditEntry,
  Carrier,
  CarrierAssignment,
  ClientShare,
  Company,
  CompanyRole,
  CompanyUser,
  DocAudience,
  DocStatus,
  DocType,
  Driver,
  Incident,
  IncidentStatus,
  Invoice,
  InvoiceStatus,
  Load,
  Mission,
  MissionDocument,
  MessageRole,
  OperationStep,
  Payment,
  Prefs,
  Settings,
  Truck,
  TransportRequest,
  TruckStatus,
} from "@/types";

const STORAGE_KEY = "logitrack:data";
const SERVER_SNAPSHOT: AppData = createSeed();

let state: AppData | null = null;
const listeners = new Set<() => void>();

function load(): AppData {
  if (state) return state;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppData;
      if (parsed.version === DATA_VERSION) {
        state = parsed;
        return state;
      }
    }
  } catch {
    // stockage indisponible : on repart des données de démonstration
  }
  state = createSeed();
  return state;
}

function persist(next: AppData) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // quota ou mode privé : l'état reste en mémoire
  }
}

function commit(next: AppData) {
  state = reconcile(next);
  persist(state);
  listeners.forEach((l) => l());
}

function update(fn: (s: AppData) => AppData) {
  commit(fn(load()));
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      state = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useAppData(): AppData {
  return useSyncExternalStore(subscribe, load, () => SERVER_SNAPSHOT);
}

// ── Cohérence des statuts (camions / chauffeurs) ─────────────
function reconcile(s: AppData): AppData {
  const active = s.missions.filter(isActiveMission);
  const busyTrucks = new Set(active.map((m) => m.truckId).filter(Boolean));
  const busyDrivers = new Set(active.map((m) => m.driverId).filter(Boolean));
  let changed = false;
  const trucks = s.trucks.map((t) => {
    let status: TruckStatus = t.status;
    if (busyTrucks.has(t.id)) status = "en_mission";
    else if (t.status === "en_mission") status = "disponible";
    if (status !== t.status) {
      changed = true;
      return { ...t, status };
    }
    return t;
  });
  const drivers = s.drivers.map((d) => {
    let availability = d.availability;
    if (busyDrivers.has(d.id)) availability = "en_mission";
    else if (d.availability === "en_mission") availability = "disponible";
    if (availability !== d.availability) {
      changed = true;
      return { ...d, availability };
    }
    return d;
  });
  return changed ? { ...s, trucks, drivers } : s;
}

// ── Utilisateur courant (dépend de l'espace affiché) ─────────
let currentActor: string | null = null;
/** Définit l'auteur des actions (admin, exploitation d'une entreprise, chauffeur). */
export function setActor(name: string | null) {
  currentActor = name;
}
let currentRole: string | null = null;
/** Rôle de l'utilisateur courant, inscrit dans le journal d'audit. */
export function setActorRole(role: string | null) {
  currentRole = role;
}
/** Nom affiché dans l'activité et l'historique pour les actions en cours. */
export function actorOf(s: AppData): string {
  return currentActor ?? s.settings.userName;
}

// ── Helpers internes ─────────────────────────────────────────
const nowIso = () => demoNowIso();

/** Jeton aléatoire non devinable pour les liens de suivi client. */
function newToken(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => (b % 36).toString(36)).join("");
}

function withAudit(s: AppData, entry: Omit<AuditEntry, "id" | "at" | "role"> & { role?: string }): AppData {
  const row: AuditEntry = { ...entry, role: entry.role ?? currentRole ?? "—", id: uid("aud"), at: nowIso() };
  return { ...s, audit: [row, ...s.audit].slice(0, 2000) };
}

/** Chaque action tracée dans l'activité est aussi inscrite au journal d'audit (conservé plus longtemps). */
function withActivity(s: AppData, item: Omit<ActivityItem, "id" | "at">, audit?: AuditAction): AppData {
  const next = { ...s, activity: [{ ...item, id: uid("act"), at: nowIso() }, ...s.activity].slice(0, 60) };
  return withAudit(next, { actor: item.actor, companyId: item.companyId, action: audit ?? auditActionOf(item.text), text: item.text, link: item.link });
}

function withNotification(s: AppData, n: Omit<AppNotification, "id" | "at" | "read">): AppData {
  return { ...s, notifications: [{ ...n, id: uid("ntf"), at: nowIso(), read: false }, ...s.notifications].slice(0, 80) };
}

function upsert<T extends { id: string }>(list: T[], item: T): T[] {
  const exists = list.some((x) => x.id === item.id);
  return exists ? list.map((x) => (x.id === item.id ? item : x)) : [item, ...list];
}

/** Lie un camion à un chauffeur en défaisant les anciennes affectations. */
function linkTruckDriver(s: AppData, truckId: string, driverId: string | null): AppData {
  const trucks = s.trucks.map((t) => {
    if (t.id === truckId) return { ...t, driverId };
    if (driverId && t.driverId === driverId) return { ...t, driverId: null };
    return t;
  });
  const drivers = s.drivers.map((d) => {
    if (driverId && d.id === driverId) return { ...d, truckId };
    if (d.truckId === truckId && d.id !== driverId) return { ...d, truckId: null };
    return d;
  });
  return { ...s, trucks, drivers };
}

function nextRef(prefix: string, refs: string[], start: number): string {
  const max = refs.reduce((acc, r) => {
    const n = Number(r.split("-").pop());
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, start);
  return `${prefix}-26-${String(max + 1).padStart(4, "0")}`;
}

// ── Actions publiques ────────────────────────────────────────
export const actions = {
  /** Recharge les données de démonstration ; le journal d'audit est conservé (non modifiable). */
  reset() {
    const s = load();
    const fresh = createSeed();
    commit(withAudit({ ...fresh, audit: [...s.audit] }, { actor: actorOf(s), action: "modification", text: "a réinitialisé les données de démonstration" }));
  },

  // Entreprises
  saveCompany(c: Company) {
    update((s) => {
      const isNew = !s.companies.some((x) => x.id === c.id);
      let next: AppData = { ...s, companies: upsert(s.companies, c) };
      // une entreprise transporteur / transitaire doit pouvoir se connecter : son responsable devient administrateur
      if (isNew && c.type !== "client" && !s.users.some((u) => u.companyId === c.id)) {
        const admin: CompanyUser = { id: uid("usr"), companyId: c.id, name: c.manager, email: c.email, role: "admin", active: true, twoFactor: false, createdAt: nowIso() };
        next = { ...next, users: [...next.users, admin] };
        next = withAudit(next, { actor: actorOf(s), companyId: c.id, action: "droits", text: `a créé le compte administrateur de ${c.manager} (${c.email})` });
      }
      return withActivity(next, { actor: actorOf(s), text: `${isNew ? "a ajouté" : "a modifié"} l'entreprise ${c.name}`, tone: "info", link: { kind: "company", id: c.id } });
    });
  },
  toggleCompany(id: string) {
    update((s) => {
      const c = s.companies.find((x) => x.id === id);
      if (!c) return s;
      const status: Company["status"] = c.status === "actif" ? "inactif" : "actif";
      const next = { ...s, companies: s.companies.map((x) => (x.id === id ? { ...x, status } : x)) };
      return withActivity(next, { actor: actorOf(s), text: `a ${status === "actif" ? "activé" : "désactivé"} l'entreprise ${c.name}`, tone: status === "actif" ? "success" : "warning", link: { kind: "company", id } });
    });
  },
  newCompanyId: () => uid("cmp"),

  // Transporteurs
  saveCarrier(c: Carrier) {
    update((s) => {
      const isNew = !s.carriers.some((x) => x.id === c.id);
      const next: AppData = { ...s, carriers: upsert(s.carriers, c) };
      return withActivity(next, { actor: actorOf(s), text: `${isNew ? "a ajouté" : "a modifié"} le transporteur partenaire ${c.name}`, tone: "info", companyId: c.companyId, link: { kind: "carrier", id: c.id } }, "modification");
    });
  },
  /** Interdit tant que le transporteur a des missions ou des demandes en cours ; l'historique (missions, factures) est conservé. */
  deleteCarrier(id: string) {
    update((s) => {
      const c = s.carriers.find((x) => x.id === id);
      const busy = s.missions.some((m) => m.carrierId === id && m.step < 6) || s.requests.some((r) => r.status === "ouverte" && r.responses.some((x) => x.carrierId === id));
      if (!c || busy) return s;
      const next: AppData = { ...s, carriers: s.carriers.filter((x) => x.id !== id) };
      return withActivity(next, { actor: actorOf(s), text: `a supprimé le transporteur partenaire ${c.name}`, tone: "warning", companyId: c.companyId }, "modification");
    });
  },
  newCarrierId: () => uid("car"),

  // Camions
  saveTruck(t: Truck) {
    update((s) => {
      const isNew = !s.trucks.some((x) => x.id === t.id);
      let next: AppData = { ...s, trucks: upsert(s.trucks, t) };
      next = linkTruckDriver(next, t.id, t.driverId);
      return withActivity(next, { actor: actorOf(s), text: `${isNew ? "a ajouté" : "a mis à jour"} le camion ${t.plate}`, tone: "info", companyId: t.companyId, link: { kind: "truck", id: t.id } });
    });
  },
  setTruckStatus(id: string, status: TruckStatus) {
    update((s) => {
      const t = s.trucks.find((x) => x.id === id);
      if (!t) return s;
      const next: AppData = { ...s, trucks: s.trucks.map((x) => (x.id === id ? { ...x, status } : x)) };
      return withActivity(next, { actor: actorOf(s), text: `a passé le camion ${t.plate} au statut « ${status} »`, tone: "info", companyId: t.companyId, link: { kind: "truck", id } }, "modification");
    });
  },
  deleteTruck(id: string) {
    update((s) => {
      const t = s.trucks.find((x) => x.id === id);
      if (!t) return s;
      const next: AppData = {
        ...s,
        trucks: s.trucks.filter((x) => x.id !== id),
        drivers: s.drivers.map((d) => (d.truckId === id ? { ...d, truckId: null } : d)),
        missions: s.missions.map((m) => (m.truckId === id && m.step < 6 ? { ...m, truckId: null } : m)),
      };
      return withActivity(next, { actor: actorOf(s), text: `a supprimé le camion ${t.plate}`, tone: "warning", companyId: t.companyId }, "modification");
    });
  },
  newTruckId: () => uid("trk"),

  // Chauffeurs
  saveDriver(d: Driver) {
    update((s) => {
      let next: AppData = { ...s, drivers: upsert(s.drivers, d) };
      // synchronise l'affectation camion ↔ chauffeur
      next = { ...next, trucks: next.trucks.map((t) => (t.driverId === d.id && t.id !== d.truckId ? { ...t, driverId: null } : t)) };
      if (d.truckId) next = linkTruckDriver(next, d.truckId, d.id);
      return next;
    });
  },
  deleteDriver(id: string) {
    update((s) => {
      const d = s.drivers.find((x) => x.id === id);
      if (!d) return s;
      const next: AppData = {
        ...s,
        drivers: s.drivers.filter((x) => x.id !== id),
        trucks: s.trucks.map((t) => (t.driverId === id ? { ...t, driverId: null } : t)),
        missions: s.missions.map((m) => (m.driverId === id && m.step < 6 ? { ...m, driverId: null } : m)),
      };
      return withActivity(next, { actor: actorOf(s), text: `a supprimé le chauffeur ${driverName(d)}`, tone: "warning", companyId: d.companyId }, "modification");
    });
  },
  newDriverId: () => uid("drv"),

  // Missions
  saveMission(m: Mission, loadData?: Omit<Load, "id" | "ref" | "missionId">) {
    update((s) => {
      const isNew = !s.missions.some((x) => x.id === m.id);
      let next: AppData = { ...s, missions: upsert(s.missions, m) };
      if (loadData) {
        const existing = s.loads.find((l) => l.missionId === m.id);
        const loadItem: Load = existing
          ? { ...existing, ...loadData }
          : { ...loadData, id: uid("ld"), ref: nextRef("CH", s.loads.map((l) => l.ref), 5200), missionId: m.id };
        next = { ...next, loads: upsert(next.loads, loadItem) };
      }
      next = withActivity(next, {
        actor: actorOf(s),
        text: `${isNew ? "a créé" : "a modifié"} la mission ${m.ref} (${placeName(m.origin)} → ${placeName(m.destination)})`,
        tone: "info",
        companyId: m.companyId,
        link: { kind: "mission", id: m.id },
      });
      {
        const at = nowIso();
        const hazardous = loadData?.hazardous ?? s.loads.find((l) => l.missionId === m.id)?.hazardous ?? false;
        const current = next.documents.filter((d) => d.missionId === m.id);
        // pièces manquantes ajoutées (trajet, marchandise ou dangerosité modifiés)
        const added = checklistFor(m, hazardous)
          .filter((type) => !current.some((d) => d.type === type))
          .map((type) => newDocument(uid("doc"), m.id, type, m, at));
        // échéances recalculées pour les pièces encore sans fichier (dates modifiées)
        const documents = next.documents.map((d) => (d.missionId === m.id && d.versions.length === 0 ? { ...d, dueAt: defaultDueAt(d.type, m) } : d));
        next = { ...next, documents: [...documents, ...added] };
      }
      if (isNew && (!m.truckId || !m.driverId)) {
        next = withNotification(next, { kind: "systeme", title: `Mission à affecter — ${m.ref}`, message: "Aucun camion ou chauffeur n'est encore affecté à cette mission.", companyId: m.companyId, link: { kind: "mission", id: m.id } });
      }
      return next;
    });
  },
  newMissionDraft(s: AppData): Pick<Mission, "id" | "ref"> {
    return { id: uid("ms"), ref: nextRef("MS", s.missions.map((m) => m.ref), 1040) };
  },
  assignMission(id: string, truckId: string | null, driverId: string | null) {
    update((s) => {
      const m = s.missions.find((x) => x.id === id);
      if (!m) return s;
      const ownFleet = !!(truckId || driverId);
      const at = nowIso();
      // affecter la flotte propre retire la mission au transporteur partenaire
      let next: AppData = { ...s, missions: s.missions.map((x) => (x.id === id ? { ...x, truckId, driverId, carrierAssignment: ownFleet ? null : x.carrierAssignment, carrierId: ownFleet && x.carrierAssignment ? null : x.carrierId } : x)) };
      const t = s.trucks.find((x) => x.id === truckId);
      const d = s.drivers.find((x) => x.id === driverId);
      // camion et chauffeur connus : l'ordre de mission est émis automatiquement
      if (truckId && driverId) {
        next = {
          ...next,
          documents: next.documents.map((doc) =>
            doc.missionId === id && doc.type === "ordre_mission" && doc.status !== "valide"
              ? { ...doc, status: "valide" as const, updatedAt: at, versions: [...doc.versions, { at, by: actorOf(s), fileName: `Ordre_mission_${m.ref}.pdf`, sizeKb: 96 }] }
              : doc,
          ),
        };
      }
      if (ownFleet && m.carrierAssignment && m.carrierId) {
        next = withNotification(next, { kind: "transport", title: `Mission retirée — ${m.ref}`, message: "Le donneur d'ordre exécute finalement cette mission avec sa propre flotte.", carrierId: m.carrierId, link: { kind: "mission", id } });
      }
      return withActivity(next, { actor: actorOf(s), text: `a affecté ${t?.plate ?? "aucun camion"} / ${driverName(d)} à la mission ${m.ref}`, tone: "info", companyId: m.companyId, link: { kind: "mission", id } });
    });
  },
  deleteMission(id: string) {
    update((s) => {
      const m = s.missions.find((x) => x.id === id);
      const billed = s.invoices.some((i) => i.missionId === id && (i.status !== "brouillon" || i.payments.length > 0));
      if (!m || billed) return s;
      const next: AppData = {
      ...s,
      missions: s.missions.filter((x) => x.id !== id),
      loads: s.loads.filter((l) => l.missionId !== id),
      incidents: s.incidents.filter((i) => i.missionId !== id),
      documents: s.documents.filter((d) => d.missionId !== id),
      requests: s.requests.filter((r) => r.missionId !== id),
      invoices: s.invoices.filter((x) => x.missionId !== id),
      messages: s.messages.filter((x) => x.missionId !== id),
      };
      return withActivity(next, { actor: actorOf(s), text: `a supprimé la mission ${m.ref} et ses éléments rattachés`, tone: "warning", companyId: m.companyId }, "modification");
    });
  },
  /** `forcedReason` : passage forcé malgré des pièces bloquantes (tracé dans l'activité). */
  setMissionStep(id: string, step: OperationStep, by: string, note?: string, forcedReason?: string) {
    update((s) => {
      const m = s.missions.find((x) => x.id === id);
      if (!m || step === m.step) return s;
      const at = nowIso();
      let history = m.history.filter((h) => h.step <= step);
      for (let st = m.step + 1; st <= step; st++) {
        history = [...history, { step: st as OperationStep, at, by, note: st === step ? (forcedReason ? `Passage forcé : ${forcedReason}` : note) : undefined }];
      }
      const delayed = step >= 6 ? false : m.delayed;
      // e-mails de suivi au client sur les jalons choisis (simulation)
      const share = m.clientShare;
      const reached = share && !share.revoked && share.notifyEmail ? share.notifySteps.filter((st) => st > m.step && st <= step && !share.sentEmails.some((e) => e.step === st)) : [];
      const clientShare = share && reached.length ? { ...share, sentEmails: [...share.sentEmails, ...reached.map((st) => ({ at, step: st, to: share.notifyEmail }))] } : share;
      const updated: Mission = { ...m, step, history, delayed, clientShare };
      const label = OPERATION_STEPS[step].label;
      let next: AppData = { ...s, missions: s.missions.map((x) => (x.id === id ? updated : x)) };
      next = withActivity(next, { actor: by, text: `a mis à jour ${m.ref} : ${label}`, tone: step >= 6 ? "success" : "info", companyId: m.companyId, link: { kind: "mission", id } }, "statut");
      if (reached.length && share) {
        next = withActivity(next, { actor: "LogiTrack", text: `a envoyé l'e-mail de suivi « ${OPERATION_STEPS[step].label} » à ${share.notifyEmail} — ${m.ref}`, tone: "info", companyId: m.companyId, link: { kind: "mission", id } }, "partage");
      }
      if (forcedReason) {
        next = withActivity(next, { actor: by, text: `a forcé le passage à « ${label} » sur ${m.ref} malgré des pièces manquantes — ${forcedReason}`, tone: "warning", companyId: m.companyId, link: { kind: "mission", id } }, "statut");
      }
      if (step === 2 || step === 5 || step === 6 || step === 7) {
        next = withNotification(next, { kind: "mission", title: `${label} — ${m.ref}`, message: `${placeName(m.origin)} → ${placeName(m.destination)}. Mise à jour par ${by}.`, companyId: m.companyId, link: { kind: "mission", id } });
      }
      return next;
    });
  },
  setMissionDelayed(id: string, delayed: boolean) {
    update((s) => ({ ...s, missions: s.missions.map((m) => (m.id === id ? { ...m, delayed } : m)) }));
  },

  // Chargements
  saveLoad(l: Load) {
    update((s) => ({ ...s, loads: upsert(s.loads, l) }));
  },

  // Incidents
  reportIncident(input: Omit<Incident, "id" | "ref">) {
    update((s) => {
      const incident: Incident = { ...input, id: uid("inc"), ref: nextRef("INC", s.incidents.map((i) => i.ref), 300) };
      const m = s.missions.find((x) => x.id === input.missionId);
      let next: AppData = { ...s, incidents: [incident, ...s.incidents] };
      const markDelayed = input.type === "retard" || (input.delayMinutes ?? 0) > 0;
      if (m && markDelayed && m.step < 6) {
        next = { ...next, missions: next.missions.map((x) => (x.id === m.id ? { ...x, delayed: true } : x)) };
      }
      const isDelay = input.type === "retard";
      next = withActivity(next, { actor: input.reportedBy, text: `a déclaré ${isDelay ? "un retard" : "un incident"} — ${m?.ref ?? ""}`, tone: isDelay ? "warning" : "danger", companyId: m?.companyId, link: { kind: "incident", id: incident.id } });
      next = withNotification(next, {
        kind: isDelay ? "retard" : "incident",
        title: `${isDelay ? "Retard déclaré" : "Incident signalé"} — ${m?.ref ?? incident.ref}`,
        message: input.description.slice(0, 120),
        companyId: m?.companyId,
        link: { kind: "incident", id: incident.id },
      });
      return next;
    });
  },
  saveIncident(i: Incident) {
    update((s) => ({ ...s, incidents: upsert(s.incidents, i) }));
  },
  setIncidentStatus(id: string, status: IncidentStatus) {
    update((s) => {
      const inc = s.incidents.find((i) => i.id === id);
      if (!inc) return s;
      let next: AppData = { ...s, incidents: s.incidents.map((i) => (i.id === id ? { ...i, status } : i)) };
      if (status === "resolu") {
        // lève le drapeau de retard s'il n'y a plus d'incident ouvert sur la mission
        const stillOpen = next.incidents.some((i) => i.missionId === inc.missionId && i.status !== "resolu" && (i.type === "retard" || (i.delayMinutes ?? 0) > 0));
        if (!stillOpen) next = { ...next, missions: next.missions.map((m) => (m.id === inc.missionId ? { ...m, delayed: false } : m)) };
      }
      const m = s.missions.find((x) => x.id === inc.missionId);
      return withActivity(next, { actor: actorOf(s), text: `a passé l'incident ${inc.ref} au statut « ${status === "resolu" ? "Résolu" : status === "en_cours" ? "En cours de traitement" : "Nouveau"} »`, tone: status === "resolu" ? "success" : "info", companyId: m?.companyId, link: { kind: "incident", id } });
    });
  },
  deleteIncident(id: string) {
    update((s) => {
      const inc = s.incidents.find((i) => i.id === id);
      if (!inc) return s;
      const incidents = s.incidents.filter((i) => i.id !== id);
      const stillLate = incidents.some((i) => i.missionId === inc.missionId && i.status !== "resolu" && (i.type === "retard" || (i.delayMinutes ?? 0) > 0));
      const next: AppData = { ...s, incidents, missions: s.missions.map((m) => (m.id === inc.missionId && !stillLate ? { ...m, delayed: false } : m)) };
      const m = s.missions.find((x) => x.id === inc.missionId);
      return withActivity(next, { actor: actorOf(s), text: `a supprimé l'incident ${inc.ref}`, tone: "warning", companyId: m?.companyId, link: m ? { kind: "mission", id: m.id } : undefined }, "modification");
    });
  },

  // Documents de transit
  addDocument(missionId: string, type: DocType) {
    update((s) => {
      const m = s.missions.find((x) => x.id === missionId);
      if (!m) return s;
      const doc = newDocument(uid("doc"), missionId, type, m, nowIso());
      const next = { ...s, documents: [...s.documents, doc] };
      return withActivity(next, { actor: actorOf(s), text: `a ajouté la pièce « ${DOC_TYPES[type].label} » à ${m.ref}`, tone: "info", companyId: m.companyId, link: { kind: "mission", id: missionId } });
    });
  },
  /** Retire une pièce non bloquante de la checklist (une pièce bloquante se contourne par « Forcer », avec justification). */
  removeDocument(id: string) {
    update((s) => {
      const doc = s.documents.find((d) => d.id === id);
      const m = doc && s.missions.find((x) => x.id === doc.missionId);
      if (!doc || !m || doc.blocksStep !== null) return s;
      const next: AppData = { ...s, documents: s.documents.filter((d) => d.id !== id) };
      return withActivity(next, { actor: actorOf(s), text: `a retiré la pièce « ${DOC_TYPES[doc.type].label} » de la checklist — ${m.ref}`, tone: "warning", companyId: m.companyId, link: { kind: "mission", id: m.id } });
    });
  },
  /** Dépôt d'une nouvelle version. Le contenu du fichier n'est pas conservé dans le prototype. */
  uploadDocument(id: string, file: { fileName: string; sizeKb: number }, by: string, opts?: { validate?: boolean }) {
    update((s) => {
      const doc = s.documents.find((d) => d.id === id);
      const m = doc && s.missions.find((x) => x.id === doc.missionId);
      if (!doc || !m) return s;
      const at = nowIso();
      const validate = !!opts?.validate;
      const updated: MissionDocument = { ...doc, status: validate ? "valide" : "recu", note: undefined, versions: [...doc.versions, { at, by, ...file }], updatedAt: at };
      const label = DOC_TYPES[doc.type].label;
      let next: AppData = { ...s, documents: s.documents.map((d) => (d.id === id ? updated : d)) };
      next = withActivity(next, { actor: by, text: `a déposé${validate ? " et validé" : ""} « ${label} »${doc.versions.length ? ` (version ${doc.versions.length + 1})` : ""} — ${m.ref}`, tone: validate ? "success" : "info", companyId: m.companyId, link: { kind: "mission", id: m.id } });
      if (validate) return next;
      return withNotification(next, { kind: "document", title: `Pièce reçue — ${label} — ${m.ref}`, message: `Déposée par ${by}. À vérifier par l'exploitation.`, companyId: m.companyId, link: { kind: "mission", id: m.id } });
    });
  },
  setDocumentStatus(id: string, status: DocStatus, note?: string) {
    update((s) => {
      const doc = s.documents.find((d) => d.id === id);
      const m = doc && s.missions.find((x) => x.id === doc.missionId);
      if (!doc || !m || doc.status === status) return s;
      const updated: MissionDocument = { ...doc, status, note: status === "a_corriger" ? note : undefined, updatedAt: nowIso() };
      const label = DOC_TYPES[doc.type].label;
      let next: AppData = { ...s, documents: s.documents.map((d) => (d.id === id ? updated : d)) };
      next = withActivity(next, {
        actor: actorOf(s),
        text: `a passé « ${label} » au statut « ${DOC_STATUS[status].label} » — ${m.ref}${note ? ` (${note})` : ""}`,
        tone: status === "valide" ? "success" : status === "a_corriger" ? "warning" : "info",
        companyId: m.companyId,
        link: { kind: "mission", id: m.id },
      });
      if (status === "a_corriger") {
        next = withNotification(next, { kind: "document", title: `Pièce à corriger — ${label} — ${m.ref}`, message: note ?? "Une correction est demandée.", companyId: m.companyId, link: { kind: "mission", id: m.id } });
        if (m.carrierId && (doc.responsible === "transporteur" || doc.responsible === "chauffeur")) {
          next = withNotification(next, { kind: "document", title: `Pièce à corriger — ${label} — ${m.ref}`, message: note ?? "Une correction est demandée.", carrierId: m.carrierId, link: { kind: "mission", id: m.id } });
        }
      }
      return next;
    });
  },
  /**
   * Le chauffeur ou le transporteur est bloqué par des pièces : l'exploitation est prévenue.
   * Automatique une seule fois par pièce ; `force` pour un signalement manuel (« Prévenir l'exploitation »).
   */
  reportBlocked(missionId: string, docIds: string[], by: string, force = false) {
    update((s) => {
      const m = s.missions.find((x) => x.id === missionId);
      const docs = s.documents.filter((d) => docIds.includes(d.id) && (force || !d.blockedNotifiedAt));
      if (!m || docs.length === 0) return s;
      const at = nowIso();
      const labels = docs.map((d) => `${DOC_TYPES[d.type].label} (${DOC_STATUS[d.status].label.toLowerCase()})`).join(", ");
      let next: AppData = { ...s, documents: s.documents.map((d) => (docs.some((x) => x.id === d.id) ? { ...d, blockedNotifiedAt: at } : d)) };
      next = withActivity(next, { actor: by, text: `est bloqué sur ${m.ref} en attente de : ${labels}`, tone: "warning", companyId: m.companyId, link: { kind: "mission", id: m.id } });
      return withNotification(next, { kind: "document", title: `${force ? "Demande d'aide" : "Blocage"} — ${m.ref}`, message: `${by} attend : ${labels}. Vérifiez ou déposez ces pièces pour débloquer la mission.`, companyId: m.companyId, link: { kind: "mission", id: m.id } });
    });
  },
  setDocumentSharing(id: string, sharedWith: DocAudience[]) {
    update((s) => {
      const doc = s.documents.find((d) => d.id === id);
      const m = doc && s.missions.find((x) => x.id === doc.missionId);
      if (!doc || !m) return s;
      const next: AppData = { ...s, documents: s.documents.map((d) => (d.id === id ? { ...d, sharedWith } : d)) };
      const who = sharedWith.length ? sharedWith.join(" et ") : "personne (interne)";
      return withActivity(next, { actor: actorOf(s), text: `a partagé « ${DOC_TYPES[doc.type].label} » avec ${who} — ${m.ref}`, tone: "info", companyId: m.companyId, link: { kind: "mission", id: m.id } }, "partage");
    });
  },
  /** Relance du responsable de la pièce (notification simulée). */
  requestDocument(id: string) {
    update((s) => {
      const doc = s.documents.find((d) => d.id === id);
      const m = doc && s.missions.find((x) => x.id === doc.missionId);
      if (!doc || !m) return s;
      const at = nowIso();
      const label = DOC_TYPES[doc.type].label;
      let next: AppData = { ...s, documents: s.documents.map((d) => (d.id === id ? { ...d, requestedAt: at } : d)) };
      if (m.carrierId && (doc.responsible === "transporteur" || doc.responsible === "chauffeur")) {
        next = withNotification(next, { kind: "document", title: `Pièce attendue — ${label} — ${m.ref}`, message: `Merci de déposer cette pièce depuis votre espace.`, carrierId: m.carrierId, link: { kind: "mission", id: m.id } });
      }
      return withActivity(next, { actor: actorOf(s), text: `a relancé la pièce « ${label} » — ${m.ref}`, tone: "info", companyId: m.companyId, link: { kind: "mission", id: m.id } });
    });
  },

  // Demandes de transport (transitaire ↔ transporteurs partenaires)
  createTransportRequest(missionId: string, carrierIds: string[], deadline: string, instructions: string, by: string) {
    update((s) => {
      const m = s.missions.find((x) => x.id === missionId);
      if (!m || carrierIds.length === 0) return s;
      const at = nowIso();
      const request: TransportRequest = {
        id: uid("rq"),
        ref: nextRef("DT", s.requests.map((r) => r.ref), 100),
        missionId,
        companyId: m.companyId,
        createdAt: at,
        createdBy: by,
        deadline,
        instructions: instructions || undefined,
        status: "ouverte",
        responses: carrierIds.map((carrierId) => ({ carrierId, status: "envoyee" })),
      };
      // une nouvelle demande remplace celle encore ouverte sur la mission (les transporteurs sont prévenus)
      const replaced = s.requests.filter((r) => r.missionId === missionId && r.status === "ouverte");
      const requests = s.requests.map((r) => (replaced.includes(r) ? { ...r, status: "annulee" as const, closedAt: at } : r));
      let next: AppData = { ...s, requests: [request, ...requests] };
      for (const r of replaced) {
        for (const x of r.responses.filter((y) => y.status !== "refusee")) {
          next = withNotification(next, { kind: "transport", title: `Demande annulée — ${r.ref}`, message: "Le donneur d'ordre a remplacé cette demande.", carrierId: x.carrierId, link: { kind: "mission", id: missionId } });
        }
      }
      const names = carrierIds.map((id) => s.carriers.find((c) => c.id === id)?.name ?? id).join(", ");
      next = withActivity(next, { actor: by, text: `a envoyé la demande ${request.ref} (${m.ref}) à ${names}`, tone: "info", companyId: m.companyId, link: { kind: "mission", id: missionId } });
      for (const carrierId of carrierIds) {
        next = withNotification(next, { kind: "transport", title: `Nouvelle demande de transport — ${request.ref}`, message: `${placeName(m.origin)} → ${placeName(m.destination)}. Réponse attendue avant le ${formatDateTime(deadline)}.`, carrierId, link: { kind: "mission", id: missionId } });
      }
      return next;
    });
  },
  markRequestSeen(requestId: string, carrierId: string) {
    update((s) => {
      const r = s.requests.find((x) => x.id === requestId);
      const resp = r?.responses.find((x) => x.carrierId === carrierId);
      if (!r || !resp || resp.status !== "envoyee") return s;
      const at = nowIso();
      return { ...s, requests: s.requests.map((x) => (x.id === requestId ? { ...x, responses: x.responses.map((y) => (y.carrierId === carrierId ? { ...y, status: "vue" as const, seenAt: at } : y)) } : x)) };
    });
  },
  respondToRequest(requestId: string, carrierId: string, answer: { accept: true; proposal: CarrierAssignment } | { accept: false; reason: string }) {
    update((s) => {
      const r = s.requests.find((x) => x.id === requestId);
      const m = r && s.missions.find((x) => x.id === r.missionId);
      const carrier = s.carriers.find((c) => c.id === carrierId);
      if (!r || !m || !carrier || r.status !== "ouverte") return s;
      const at = nowIso();
      const responses = r.responses.map((y) =>
        y.carrierId !== carrierId
          ? y
          : answer.accept
            ? { ...y, status: "acceptee" as const, seenAt: y.seenAt ?? at, answeredAt: at, proposal: answer.proposal, reason: undefined }
            : { ...y, status: "refusee" as const, seenAt: y.seenAt ?? at, answeredAt: at, reason: answer.reason, proposal: undefined },
      );
      let next: AppData = { ...s, requests: s.requests.map((x) => (x.id === requestId ? { ...x, responses } : x)) };
      const text = answer.accept ? `a accepté la demande ${r.ref} (${answer.proposal.plate} · ${answer.proposal.driverName})` : `a refusé la demande ${r.ref} — ${answer.reason}`;
      next = withActivity(next, { actor: carrier.name, text, tone: answer.accept ? "success" : "warning", companyId: m.companyId, link: { kind: "mission", id: m.id } });
      return withNotification(next, {
        kind: "transport",
        title: `${answer.accept ? "Acceptation" : "Refus"} — ${carrier.name} — ${r.ref}`,
        message: answer.accept ? `Propose ${answer.proposal.plate} avec ${answer.proposal.driverName}. À confirmer.` : answer.reason,
        companyId: m.companyId,
        link: { kind: "mission", id: m.id },
      });
    });
  },
  /** Confirme le transporteur retenu : la mission lui est confiée et l'ordre de mission est émis. */
  confirmCarrier(requestId: string, carrierId: string, by: string) {
    update((s) => {
      const r = s.requests.find((x) => x.id === requestId);
      const m = r && s.missions.find((x) => x.id === r.missionId);
      const resp = r?.responses.find((x) => x.carrierId === carrierId);
      const carrier = s.carriers.find((c) => c.id === carrierId);
      // seule une acceptation sur une demande ouverte, avant le départ, peut être confirmée
      if (!r || !m || !resp?.proposal || !carrier || r.status !== "ouverte" || resp.status !== "acceptee" || m.step >= 2) return s;
      const at = nowIso();
      const proposal = resp.proposal;
      // la mission confiée passe en « attente de chargement » : le transporteur peut la faire avancer
      const launched = m.step === 0;
      let next: AppData = {
        ...s,
        requests: s.requests.map((x) => (x.id === requestId ? { ...x, status: "confirmee" as const, confirmedCarrierId: carrierId, closedAt: at } : x)),
        missions: s.missions.map((x) =>
          x.id === m.id
            ? { ...x, carrierId, carrierAssignment: proposal, truckId: null, driverId: null, step: launched ? (1 as const) : x.step, history: launched ? [...x.history, { step: 1 as const, at, by, note: `Confiée à ${carrier.name}` }] : x.history }
            : x,
        ),
        documents: s.documents.map((d) =>
          d.missionId === m.id && d.type === "ordre_mission" && d.status !== "valide"
            ? {
                ...d,
                status: "valide" as const,
                updatedAt: at,
                sharedWith: d.sharedWith.includes("transporteur") ? d.sharedWith : [...d.sharedWith, "transporteur" as const],
                versions: [...d.versions, { at, by, fileName: `Ordre_mission_${m.ref}.pdf`, sizeKb: 96 }],
              }
            : d,
        ),
      };
      next = withActivity(next, { actor: by, text: `a confié ${m.ref} à ${carrier.name} (${proposal.plate}) — ordre de mission émis`, tone: "success", companyId: m.companyId, link: { kind: "mission", id: m.id } });
      next = withNotification(next, { kind: "transport", title: `Mission confirmée — ${m.ref}`, message: `Ordre de mission disponible. ${placeName(m.origin)} → ${placeName(m.destination)}, départ ${formatDateTime(m.plannedDeparture)}.`, carrierId, link: { kind: "mission", id: m.id } });
      for (const other of r.responses.filter((x) => x.carrierId !== carrierId && x.status !== "refusee")) {
        next = withNotification(next, { kind: "transport", title: `Demande clôturée — ${r.ref}`, message: "Un autre transporteur a été retenu. Merci pour votre réponse.", carrierId: other.carrierId, link: { kind: "mission", id: m.id } });
      }
      return next;
    });
  },
  cancelRequest(requestId: string, by: string) {
    update((s) => {
      const r = s.requests.find((x) => x.id === requestId);
      if (!r || r.status !== "ouverte") return s;
      let next: AppData = { ...s, requests: s.requests.map((x) => (x.id === requestId ? { ...x, status: "annulee" as const, closedAt: nowIso() } : x)) };
      for (const x of r.responses.filter((y) => y.status !== "refusee")) {
        next = withNotification(next, { kind: "transport", title: `Demande annulée — ${r.ref}`, message: "Le donneur d'ordre a annulé cette demande.", carrierId: x.carrierId, link: { kind: "mission", id: r.missionId } });
      }
      return withActivity(next, { actor: by, text: `a annulé la demande ${r.ref}`, tone: "info", companyId: r.companyId, link: { kind: "mission", id: r.missionId } });
    });
  },
  /** Remplacement de camion ou de chauffeur par le transporteur : toujours notifié et tracé. */
  changeCarrierAssignment(missionId: string, assignment: CarrierAssignment, reason: string, by: string) {
    update((s) => {
      const m = s.missions.find((x) => x.id === missionId);
      if (!m || !m.carrierAssignment) return s;
      const before = m.carrierAssignment;
      const changes = [
        before.plate !== assignment.plate && `camion ${before.plate} → ${assignment.plate}`,
        before.driverName !== assignment.driverName && `chauffeur ${before.driverName} → ${assignment.driverName}`,
        before.driverName === assignment.driverName && before.driverPhone !== assignment.driverPhone && "téléphone du chauffeur mis à jour",
      ]
        .filter(Boolean)
        .join(", ");
      if (!changes) return s;
      let next: AppData = { ...s, missions: s.missions.map((x) => (x.id === missionId ? { ...x, carrierAssignment: assignment } : x)) };
      next = withActivity(next, { actor: by, text: `a modifié l'affectation de ${m.ref} : ${changes} — ${reason}`, tone: "warning", companyId: m.companyId, link: { kind: "mission", id: missionId } });
      return withNotification(next, { kind: "transport", title: `Changement d'affectation — ${m.ref}`, message: `${changes}. Motif : ${reason}`, companyId: m.companyId, link: { kind: "mission", id: missionId } });
    });
  },

  // Factures et paiements (suivi uniquement : aucun fonds ne transite par la plateforme)
  saveInvoice(inv: Invoice) {
    update((s) => {
      const m = s.missions.find((x) => x.id === inv.missionId);
      const before = s.invoices.find((x) => x.id === inv.id);
      const isNew = !before;
      // un débours est un frais déjà réglé : son paiement suit le montant
      const saved: Invoice = inv.flow === "debours" && inv.payments.length === 1 ? { ...inv, payments: [{ ...inv.payments[0], amount: inv.amount, at: inv.issuedAt }], updatedAt: nowIso() } : { ...inv, updatedAt: nowIso() };
      let next: AppData = { ...s, invoices: upsert(s.invoices, saved) };
      // numéro de facture client modifié : les débours rattachés suivent
      if (before && before.flow === "client" && before.ref !== inv.ref) {
        next = { ...next, invoices: next.invoices.map((x) => (x.rebilledOn === before.ref && x.missionId === inv.missionId ? { ...x, rebilledOn: inv.ref } : x)) };
      }
      return withActivity(next, { actor: actorOf(s), text: `${isNew ? "a enregistré" : "a modifié"} ${INVOICE_FLOWS[inv.flow].label.toLowerCase()} ${inv.ref} (${formatMoney(inv.amount, inv.currency)}) — ${m?.ref ?? ""}`, tone: "info", companyId: m?.companyId, link: m ? { kind: "mission", id: m.id } : undefined });
    });
  },
  newInvoiceDraft(s: AppData, flow: Invoice["flow"]): Pick<Invoice, "id" | "ref"> {
    const prefix = flow === "client" ? "FA" : flow === "transporteur" ? "FT" : "DB";
    return { id: uid("inv"), ref: nextRef(prefix, s.invoices.filter((i) => i.ref.startsWith(prefix)).map((i) => i.ref), 400) };
  },
  /** Enregistre un paiement reçu ou effectué ; le statut passe à « partiellement payée » ou « payée ». */
  recordPayment(id: string, payment: Omit<Payment, "id">) {
    update((s) => {
      const inv = s.invoices.find((x) => x.id === id);
      const m = inv && s.missions.find((x) => x.id === inv.missionId);
      if (!inv || payment.amount <= 0) return s;
      const payments = [...inv.payments, { ...payment, id: uid("pay") }];
      const paid = payments.reduce((t, p) => t + p.amount, 0);
      // un paiement ne lève pas une contestation : seul l'utilisateur la lève
      const status: InvoiceStatus = inv.flow === "debours" || inv.status === "contestee" ? inv.status : paid >= inv.amount ? "payee" : "partielle";
      let next: AppData = { ...s, invoices: s.invoices.map((x) => (x.id === id ? { ...x, payments, status, updatedAt: nowIso() } : x)) };
      const verb = inv.flow === "client" ? "a enregistré un encaissement" : "a enregistré un paiement";
      next = withActivity(next, { actor: payment.by, text: `${verb} de ${formatMoney(payment.amount, inv.currency)} sur ${inv.ref}${status === "payee" ? " — soldée" : ""}`, tone: status === "payee" ? "success" : "info", companyId: m?.companyId, link: m ? { kind: "mission", id: m.id } : undefined });
      if (inv.flow === "transporteur" && inv.counterpartyId) {
        next = withNotification(next, { kind: "facture", title: `Paiement enregistré — ${inv.ref}`, message: `${formatMoney(payment.amount, inv.currency)} (${PAYMENT_MODES[payment.mode]}).`, carrierId: inv.counterpartyId, link: m ? { kind: "mission", id: m.id } : undefined });
      }
      return next;
    });
  },
  setInvoiceStatus(id: string, status: InvoiceStatus, note?: string) {
    update((s) => {
      const inv = s.invoices.find((x) => x.id === id);
      const m = inv && s.missions.find((x) => x.id === inv.missionId);
      if (!inv || inv.status === status) return s;
      let next: AppData = { ...s, invoices: s.invoices.map((x) => (x.id === id ? { ...x, status, note: status === "contestee" || status === "annulee" ? note : x.note, updatedAt: nowIso() } : x)) };
      // facture client annulée : ses débours redeviennent « à refacturer »
      if (status === "annulee" && inv.flow === "client") {
        next = { ...next, invoices: next.invoices.map((x) => (x.flow === "debours" && x.missionId === inv.missionId && x.rebilledOn === inv.ref ? { ...x, rebilledOn: null } : x)) };
      }
      next = withActivity(next, { actor: actorOf(s), text: `a passé ${inv.ref} au statut « ${INVOICE_STATUS[status].label} »${note ? ` — ${note}` : ""}`, tone: status === "contestee" ? "warning" : "info", companyId: m?.companyId, link: m ? { kind: "mission", id: m.id } : undefined });
      if (status === "contestee") {
        next = withNotification(next, { kind: "facture", title: `Facture contestée — ${inv.ref}`, message: note ?? "", companyId: m?.companyId, link: m ? { kind: "mission", id: m.id } : undefined });
      }
      return next;
    });
  },
  /** Débours refacturé au client sur une facture donnée (ou annulation de ce rattachement). */
  setDeboursRebilled(id: string, invoiceRef: string | null) {
    update((s) => {
      const inv = s.invoices.find((x) => x.id === id);
      const m = inv && s.missions.find((x) => x.id === inv.missionId);
      if (!inv || inv.flow !== "debours") return s;
      const next: AppData = { ...s, invoices: s.invoices.map((x) => (x.id === id ? { ...x, rebilledOn: invoiceRef, updatedAt: nowIso() } : x)) };
      return withActivity(next, { actor: actorOf(s), text: invoiceRef ? `a refacturé le débours ${inv.ref} sur ${invoiceRef}` : `a retiré la refacturation du débours ${inv.ref}`, tone: "info", companyId: m?.companyId, link: m ? { kind: "mission", id: m.id } : undefined });
    });
  },
  attachInvoiceFile(id: string, file: { fileName: string; sizeKb: number }) {
    update((s) => ({ ...s, invoices: s.invoices.map((x) => (x.id === id ? { ...x, attachment: { ...file, at: nowIso() }, updatedAt: nowIso() } : x)) }));
  },
  deleteInvoice(id: string) {
    update((s) => {
      const inv = s.invoices.find((x) => x.id === id);
      const m = inv && s.missions.find((x) => x.id === inv.missionId);
      if (!inv) return s;
      const next: AppData = { ...s, invoices: s.invoices.filter((x) => x.id !== id) };
      return withActivity(next, { actor: actorOf(s), text: `a supprimé le brouillon ${inv.ref}`, tone: "warning", companyId: m?.companyId, link: m ? { kind: "mission", id: m.id } : undefined }, "facture");
    });
  },

  // Partage avec le client
  createClientShare(missionId: string, email: string, by: string) {
    update((s) => {
      const m = s.missions.find((x) => x.id === missionId);
      if (!m) return s;
      const at = nowIso();
      const share: ClientShare = {
        token: newToken(),
        createdAt: at,
        // valable jusqu'à 30 jours après l'arrivée prévue
        expiresAt: new Date(Math.max(Date.parse(m.plannedArrival), demoNowMs()) + 30 * 24 * 3600 * 1000).toISOString(),
        revoked: false,
        showPlate: false,
        showDriver: false,
        notifyEmail: email,
        notifySteps: [4, 6],
        sentEmails: [],
      };
      const next: AppData = { ...s, missions: s.missions.map((x) => (x.id === missionId ? { ...x, clientShare: share } : x)) };
      return withActivity(next, { actor: by, text: `a créé un lien de suivi client pour ${m.ref}`, tone: "info", companyId: m.companyId, link: { kind: "mission", id: missionId } });
    });
  },
  updateClientShare(missionId: string, patch: Partial<Omit<ClientShare, "token" | "createdAt" | "sentEmails">>) {
    update((s) => {
      const m = s.missions.find((x) => x.id === missionId);
      if (!m?.clientShare) return s;
      const share = m.clientShare;
      const noteAt = "publicNote" in patch && patch.publicNote !== share.publicNote ? { publicNoteAt: nowIso() } : {};
      let next: AppData = { ...s, missions: s.missions.map((x) => (x.id === missionId ? { ...x, clientShare: { ...share, ...patch, ...noteAt } } : x)) };
      // ce que voit le client est tracé (données personnelles du chauffeur notamment)
      const changes = [
        patch.showDriver !== undefined && patch.showDriver !== share.showDriver && (patch.showDriver ? "affiche le chauffeur" : "masque le chauffeur"),
        patch.showPlate !== undefined && patch.showPlate !== share.showPlate && (patch.showPlate ? "affiche l'immatriculation" : "masque l'immatriculation"),
        "publicNote" in patch && patch.publicNote !== share.publicNote && (patch.publicNote ? "publie un message" : "retire le message"),
      ].filter(Boolean);
      if (changes.length) next = withActivity(next, { actor: actorOf(s), text: `lien de suivi client de ${m.ref} : ${changes.join(", ")}`, tone: "info", companyId: m.companyId, link: { kind: "mission", id: m.id } }, "partage");
      return next;
    });
  },
  /** Révoque le lien et en génère un nouveau à la demande (l'ancien cesse de fonctionner). */
  revokeClientShare(missionId: string, by: string) {
    update((s) => {
      const m = s.missions.find((x) => x.id === missionId);
      if (!m?.clientShare) return s;
      const next: AppData = { ...s, missions: s.missions.map((x) => (x.id === missionId && x.clientShare ? { ...x, clientShare: { ...x.clientShare, revoked: true } } : x)) };
      return withActivity(next, { actor: by, text: `a désactivé le lien de suivi client de ${m.ref}`, tone: "warning", companyId: m.companyId, link: { kind: "mission", id: missionId } });
    });
  },
  regenerateClientShare(missionId: string, by: string) {
    update((s) => {
      const m = s.missions.find((x) => x.id === missionId);
      if (!m?.clientShare) return s;
      const next: AppData = { ...s, missions: s.missions.map((x) => (x.id === missionId && x.clientShare ? { ...x, clientShare: { ...x.clientShare, token: newToken(), revoked: false, createdAt: nowIso(), expiresAt: new Date(Math.max(Date.parse(x.clientShare.expiresAt), demoNowMs() + 30 * 24 * 3600 * 1000)).toISOString() } } : x)) };
      return withActivity(next, { actor: by, text: `a généré un nouveau lien de suivi client pour ${m.ref} (l'ancien ne fonctionne plus)`, tone: "info", companyId: m.companyId, link: { kind: "mission", id: missionId } });
    });
  },

  // Fil d'échanges par mission
  postMessage(missionId: string, author: string, role: MessageRole, text: string) {
    update((s) => {
      const m = s.missions.find((x) => x.id === missionId);
      if (!m || !text.trim()) return s;
      const msg = { id: uid("msg"), missionId, at: nowIso(), author, role, text: text.trim() };
      const next: AppData = { ...s, messages: [...s.messages, msg] };
      const preview = msg.text.slice(0, 120);
      // notifie l'autre partie du fil
      if (role === "exploitation") {
        return m.carrierId ? withNotification(next, { kind: "transport", title: `Message — ${m.ref}`, message: `${author} : ${preview}`, carrierId: m.carrierId, link: { kind: "mission", id: missionId } }) : next;
      }
      return withNotification(next, { kind: "transport", title: `Message — ${m.ref}`, message: `${author} : ${preview}`, companyId: m.companyId, link: { kind: "mission", id: missionId } });
    });
  },

  // Utilisateurs de l'espace entreprise (simulation de connexion et de droits)
  login(userId: string) {
    update((s) => {
      const u = s.users.find((x) => x.id === userId);
      if (!u) return s;
      const at = nowIso();
      const next: AppData = { ...s, prefs: { ...s.prefs, userId, companyId: u.companyId }, users: s.users.map((x) => (x.id === userId ? { ...x, lastLoginAt: at } : x)) };
      return withAudit(next, { actor: u.name, role: ROLES[u.role].label, companyId: u.companyId, action: "connexion", text: u.active ? `s'est connecté (${u.twoFactor ? "double authentification" : "mot de passe seul"})` : "tentative de connexion refusée : compte désactivé" });
    });
  },
  saveUser(user: CompanyUser) {
    update((s) => {
      const isNew = !s.users.some((x) => x.id === user.id);
      const next: AppData = { ...s, users: upsert(s.users, user) };
      return withAudit(next, { actor: actorOf(s), companyId: user.companyId, action: "droits", text: isNew ? `a invité ${user.name} (${user.email}) — rôle ${ROLES[user.role].label}` : `a modifié le compte de ${user.name}` });
    });
  },
  newUserId: () => uid("usr"),
  setUserRole(id: string, role: CompanyRole) {
    update((s) => {
      const u = s.users.find((x) => x.id === id);
      if (!u || u.role === role) return s;
      const next: AppData = { ...s, users: s.users.map((x) => (x.id === id ? { ...x, role } : x)) };
      return withAudit(next, { actor: actorOf(s), companyId: u.companyId, action: "droits", text: `a changé le rôle de ${u.name} : ${ROLES[u.role].label} → ${ROLES[role].label}` });
    });
  },
  /** Désactivation : l'accès est retiré immédiatement. */
  setUserActive(id: string, active: boolean) {
    update((s) => {
      const u = s.users.find((x) => x.id === id);
      if (!u || u.active === active) return s;
      const next: AppData = { ...s, users: s.users.map((x) => (x.id === id ? { ...x, active } : x)) };
      return withAudit(next, { actor: actorOf(s), companyId: u.companyId, action: "droits", text: active ? `a réactivé le compte de ${u.name}` : `a désactivé le compte de ${u.name} — accès retiré immédiatement` });
    });
  },
  setUserTwoFactor(id: string, twoFactor: boolean) {
    update((s) => {
      const u = s.users.find((x) => x.id === id);
      if (!u || u.twoFactor === twoFactor) return s;
      const next: AppData = { ...s, users: s.users.map((x) => (x.id === id ? { ...x, twoFactor } : x)) };
      return withAudit(next, { actor: actorOf(s), companyId: u.companyId, action: "droits", text: `a ${twoFactor ? "activé" : "désactivé"} la double authentification de ${u.name}` });
    });
  },
  logAudit(action: AuditAction, text: string, companyId?: string) {
    update((s) => withAudit(s, { actor: actorOf(s), companyId, action, text }));
  },

  // Notifications
  markNotificationRead(id: string, read = true) {
    update((s) => ({ ...s, notifications: s.notifications.map((n) => (n.id === id ? { ...n, read } : n)) }));
  },
  /** Côté administration (companyId null) : toutes les notifications, sauf celles destinées aux transporteurs. */
  markAllNotificationsRead(companyId: string | null) {
    update((s) => ({ ...s, notifications: s.notifications.map((n) => ((companyId ? n.companyId === companyId : !n.carrierId) ? { ...n, read: true } : n)) }));
  },
  markCarrierNotificationsRead(carrierId: string) {
    update((s) => ({ ...s, notifications: s.notifications.map((n) => (n.carrierId === carrierId ? { ...n, read: true } : n)) }));
  },
  deleteNotification(id: string) {
    update((s) => ({ ...s, notifications: s.notifications.filter((n) => n.id !== id) }));
  },

  // Paramètres & préférences
  saveSettings(settings: Settings) {
    update((s) => ({ ...s, settings }));
  },
  setPrefs(prefs: Partial<Prefs>) {
    update((s) => ({ ...s, prefs: { ...s.prefs, ...prefs } }));
  },
};

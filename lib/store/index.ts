"use client";

import { useSyncExternalStore } from "react";
import { createSeed, DATA_VERSION } from "@/lib/data/seed";
import { OPERATION_STEPS } from "@/lib/constants";
import { placeName } from "@/lib/data/geo";
import { driverName, isActiveMission, uid } from "@/lib/utils";
import type {
  ActivityItem,
  AppData,
  AppNotification,
  Carrier,
  Company,
  Driver,
  Incident,
  IncidentStatus,
  Load,
  Mission,
  OperationStep,
  Prefs,
  Settings,
  Truck,
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
/** Nom affiché dans l'activité et l'historique pour les actions en cours. */
export function actorOf(s: AppData): string {
  return currentActor ?? s.settings.userName;
}

// ── Helpers internes ─────────────────────────────────────────
const nowIso = () => new Date().toISOString();

function withActivity(s: AppData, item: Omit<ActivityItem, "id" | "at">): AppData {
  return { ...s, activity: [{ ...item, id: uid("act"), at: nowIso() }, ...s.activity].slice(0, 60) };
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
  reset() {
    commit(createSeed());
  },

  // Entreprises
  saveCompany(c: Company) {
    update((s) => {
      const isNew = !s.companies.some((x) => x.id === c.id);
      const next = { ...s, companies: upsert(s.companies, c) };
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
    update((s) => ({ ...s, carriers: upsert(s.carriers, c) }));
  },
  deleteCarrier(id: string) {
    update((s) => ({
      ...s,
      carriers: s.carriers.filter((c) => c.id !== id),
      missions: s.missions.map((m) => (m.carrierId === id ? { ...m, carrierId: null } : m)),
    }));
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
    update((s) => ({ ...s, trucks: s.trucks.map((t) => (t.id === id ? { ...t, status } : t)) }));
  },
  deleteTruck(id: string) {
    update((s) => ({
      ...s,
      trucks: s.trucks.filter((t) => t.id !== id),
      drivers: s.drivers.map((d) => (d.truckId === id ? { ...d, truckId: null } : d)),
      missions: s.missions.map((m) => (m.truckId === id && m.step < 6 ? { ...m, truckId: null } : m)),
    }));
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
    update((s) => ({
      ...s,
      drivers: s.drivers.filter((d) => d.id !== id),
      trucks: s.trucks.map((t) => (t.driverId === id ? { ...t, driverId: null } : t)),
      missions: s.missions.map((m) => (m.driverId === id && m.step < 6 ? { ...m, driverId: null } : m)),
    }));
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
      const next = { ...s, missions: s.missions.map((x) => (x.id === id ? { ...x, truckId, driverId } : x)) };
      const t = s.trucks.find((x) => x.id === truckId);
      const d = s.drivers.find((x) => x.id === driverId);
      return withActivity(next, { actor: actorOf(s), text: `a affecté ${t?.plate ?? "aucun camion"} / ${driverName(d)} à la mission ${m.ref}`, tone: "info", companyId: m.companyId, link: { kind: "mission", id } });
    });
  },
  deleteMission(id: string) {
    update((s) => ({
      ...s,
      missions: s.missions.filter((m) => m.id !== id),
      loads: s.loads.filter((l) => l.missionId !== id),
      incidents: s.incidents.filter((i) => i.missionId !== id),
    }));
  },
  setMissionStep(id: string, step: OperationStep, by: string, note?: string) {
    update((s) => {
      const m = s.missions.find((x) => x.id === id);
      if (!m || step === m.step) return s;
      const at = nowIso();
      let history = m.history.filter((h) => h.step <= step);
      for (let st = m.step + 1; st <= step; st++) {
        history = [...history, { step: st as OperationStep, at, by, note: st === step ? note : undefined }];
      }
      const delayed = step >= 6 ? false : m.delayed;
      const updated: Mission = { ...m, step, history, delayed };
      const label = OPERATION_STEPS[step].label;
      let next: AppData = { ...s, missions: s.missions.map((x) => (x.id === id ? updated : x)) };
      next = withActivity(next, { actor: by, text: `a mis à jour ${m.ref} : ${label}`, tone: step >= 6 ? "success" : "info", companyId: m.companyId, link: { kind: "mission", id } });
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
    update((s) => ({ ...s, incidents: s.incidents.filter((i) => i.id !== id) }));
  },

  // Notifications
  markNotificationRead(id: string, read = true) {
    update((s) => ({ ...s, notifications: s.notifications.map((n) => (n.id === id ? { ...n, read } : n)) }));
  },
  markAllNotificationsRead(companyId: string | null) {
    update((s) => ({ ...s, notifications: s.notifications.map((n) => (!companyId || n.companyId === companyId ? { ...n, read: true } : n)) }));
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

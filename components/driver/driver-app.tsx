"use client";

import { useLayoutEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bell,
  Box,
  Building2,
  CalendarClock,
  Check,
  ChevronRight,
  Clock,
  FileText,
  Flag,
  History,
  Home,
  ListChecks,
  MapPin,
  Navigation,
  Phone,
  PlayCircle,
  RotateCcw,
  Scale,
  Star,
  Truck as TruckIcon,
  User,
  Wrench,
} from "lucide-react";
import { actions, setActor, useAppData } from "@/lib/store";
import { DEMO_NOW, GOODS_TYPES, INCIDENT_TYPES, OPERATION_STEPS, TRUCK_TYPES } from "@/lib/constants";
import { placeById, placeName, routeDistanceKm } from "@/lib/data/geo";
import { cn, driverName, formatDate, formatDateShort, formatDateTime, formatNumber, formatTime, missionProgress } from "@/lib/utils";
import type { IncidentType, Mission, OperationStep, Severity } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";
import { DriverAvatar, SafeImage } from "@/components/ui/media";
import { ConfirmDialog, Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { DjiboutiMap } from "@/components/maps";
import { OperationTimeline } from "@/components/operations/timeline";
import { Logo } from "@/components/layout/logo";

type Screen = { name: "home" } | { name: "missions" } | { name: "history" } | { name: "profile" } | { name: "mission"; id: string };

/** Action principale proposée au chauffeur selon l'étape courante. */
const DRIVER_ACTIONS: Partial<Record<OperationStep, { label: string; next: OperationStep; icon: typeof PlayCircle; hint: string }>> = {
  0: { label: "Accepter la mission", next: 1, icon: Check, hint: "Confirmez la prise en charge de la mission." },
  1: { label: "Démarrer la mission", next: 2, icon: PlayCircle, hint: "Vous êtes sur le lieu de chargement." },
  2: { label: "Chargement terminé", next: 3, icon: Box, hint: "La marchandise est chargée et sécurisée." },
  3: { label: "Démarrer le transport", next: 4, icon: Navigation, hint: "Vous prenez la route vers la destination." },
  4: { label: "Arrivé à destination", next: 5, icon: MapPin, hint: "Vous êtes arrivé chez le destinataire." },
  5: { label: "Confirmer la livraison", next: 6, icon: Flag, hint: "La marchandise a été remise au client." },
};

function useDriverContext() {
  const data = useAppData();
  const driver = data.drivers.find((d) => d.id === data.prefs.driverId) ?? data.drivers[0];
  const truck = data.trucks.find((t) => t.id === driver?.truckId);
  const company = data.companies.find((c) => c.id === driver?.companyId);
  const missions = data.missions.filter((m) => m.driverId === driver?.id);
  const active = missions.find((m) => m.step >= 2 && m.step <= 5);
  const upcoming = missions.filter((m) => m.step <= 1).sort((a, b) => a.plannedDeparture.localeCompare(b.plannedDeparture));
  const done = missions.filter((m) => m.step >= 6).sort((a, b) => b.plannedDeparture.localeCompare(a.plannedDeparture));
  const current = active ?? upcoming[0];
  return { data, driver, truck, company, missions, current, upcoming, done };
}

// ── Éléments visuels ─────────────────────────────────────────
function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function RouteLine({ m, light }: { m: Mission; light?: boolean }) {
  return (
    <div className="flex items-stretch gap-3">
      <div className="flex flex-col items-center py-1">
        <span className={cn("size-2.5 rounded-full border-2", light ? "border-white" : "border-brand-600")} />
        <span className={cn("my-1 w-0.5 flex-1", light ? "bg-white/40" : "bg-slate-200")} />
        <span className={cn("size-2.5 rounded-full", light ? "bg-white" : "bg-success-600")} />
      </div>
      <div className="flex-1 space-y-3">
        <div>
          <p className={cn("text-[11px]", light ? "text-white/60" : "text-slate-400")}>Départ · {formatTime(m.plannedDeparture)}</p>
          <p className="text-sm font-semibold">{placeById(m.origin)?.name}</p>
        </div>
        <div>
          <p className={cn("text-[11px]", light ? "text-white/60" : "text-slate-400")}>Arrivée prévue · {formatTime(m.plannedArrival)}</p>
          <p className="text-sm font-semibold">{placeById(m.destination)?.name}</p>
        </div>
      </div>
    </div>
  );
}

function MissionCard({ m, onOpen }: { m: Mission; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-card active:scale-[0.99]">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-semibold text-slate-500">{m.ref}</span>
        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", m.step >= 6 ? "bg-success-50 text-success-700" : m.delayed ? "bg-amber-50 text-amber-700" : m.step >= 2 ? "bg-brand-50 text-brand-700" : "bg-slate-100 text-slate-600")}>
          {OPERATION_STEPS[m.step].short}
        </span>
      </div>
      <p className="mt-2 flex items-center gap-1.5 font-semibold">
        {placeName(m.origin)} <ArrowRight className="size-4 text-slate-400" /> {placeName(m.destination)}
      </p>
      <p className="mt-0.5 text-xs text-slate-500">
        {formatDateShort(m.plannedDeparture)} · {formatTime(m.plannedDeparture)} · {routeDistanceKm(m.origin, m.destination)} km
      </p>
    </button>
  );
}

// ── Écrans ───────────────────────────────────────────────────
function HomeScreen({ go, onDelay, onIncident }: { go: (s: Screen) => void; onDelay: (id: string) => void; onIncident: (id: string) => void }) {
  const { driver, truck, company, current, upcoming, done } = useDriverContext();
  const { toast } = useToast();
  if (!driver) return null;
  const action = current ? DRIVER_ACTIONS[current.step] : undefined;
  // action en un geste depuis l'accueil ; la livraison passe par la fiche (confirmation requise)
  const quickAction = () => {
    if (!current) return;
    if (!action || action.next === 6) return go({ name: "mission", id: current.id });
    actions.setMissionStep(current.id, action.next, driverName(driver));
    toast(OPERATION_STEPS[action.next].label, { message: `${current.ref} — statut transmis à l'exploitation` });
  };

  return (
    <div className="space-y-5">
      <div className="relative -mx-4 -mt-4 overflow-hidden bg-navy-900 px-4 pt-5 pb-20 text-white">
        <SafeImage src="/images/truck-semi-3.jpg" alt="" className="absolute inset-0 opacity-25" sizes="480px" fallback="image" />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-900/60 to-navy-900" />
        <div className="relative flex items-center gap-3">
          <DriverAvatar driver={driver} size="md" ring />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-white/60">Bonjour,</p>
            <p className="truncate text-lg font-semibold">{driverName(driver)}</p>
            <p className="truncate text-xs text-white/60">{company?.name}</p>
          </div>
          <button onClick={() => go({ name: "missions" })} className="relative rounded-full bg-white/10 p-2.5" aria-label={`${upcoming.length} mission(s) à venir`}>
            <Bell className="size-5" />
            {upcoming.length > 0 && <span className="absolute -top-0.5 -right-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold ring-2 ring-navy-900">{upcoming.length}</span>}
          </button>
        </div>
        <p className="relative mt-4 text-xs text-white/60">{formatDate(DEMO_NOW)}</p>
      </div>

      {/* Mission actuelle */}
      <div className="-mt-20">
        {current ? (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-700 p-5 text-white shadow-pop">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold">{current.step >= 2 ? "Mission en cours" : "Prochaine mission"}</span>
              <span className="font-mono text-xs text-white/70">{current.ref}</span>
            </div>
            <div className="mt-4">
              <RouteLine m={current} light />
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-[11px] text-white/70">
                <span>{OPERATION_STEPS[current.step].label}</span>
                <span>{missionProgress(current.step)} %</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/20">
                <div className={cn("h-full rounded-full transition-all duration-700", current.delayed ? "bg-amber-400" : "bg-white")} style={{ width: `${missionProgress(current.step)}%` }} />
              </div>
              {current.delayed && <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-200"><Clock className="size-3.5" /> Retard signalé sur cette mission</p>}
            </div>
            <div className="mt-5 grid grid-cols-[1fr_auto] gap-2">
              <button onClick={quickAction} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-white font-semibold text-brand-700 active:scale-[0.98]">
                {action ? <action.icon className="size-5" /> : <FileText className="size-5" />}
                {action ? action.label : "Voir la mission"}
              </button>
              <button onClick={() => go({ name: "mission", id: current.id })} className="flex size-12 items-center justify-center rounded-xl bg-white/15" aria-label="Détails de la mission">
                <ChevronRight className="size-5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl bg-white p-6 text-center shadow-pop">
            <span className="mx-auto inline-flex size-12 items-center justify-center rounded-2xl bg-success-50 text-success-600">
              <Check className="size-6" />
            </span>
            <p className="mt-3 font-semibold">Aucune mission en attente</p>
            <p className="mt-1 text-sm text-slate-500">Vous serez notifié dès qu&apos;une mission vous sera attribuée.</p>
          </div>
        )}
      </div>

      {/* Actions rapides */}
      {current && current.step < 6 && (
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => onDelay(current.id)} className="flex flex-col items-center gap-1.5 rounded-2xl border border-amber-200 bg-amber-50 py-3.5 text-amber-700 active:scale-[0.97]">
            <Clock className="size-6" />
            <span className="text-xs font-semibold">Signaler un retard</span>
          </button>
          <button onClick={() => onIncident(current.id)} className="flex flex-col items-center gap-1.5 rounded-2xl border border-red-200 bg-red-50 py-3.5 text-red-600 active:scale-[0.97]">
            <AlertTriangle className="size-6" />
            <span className="text-xs font-semibold">Déclarer un incident</span>
          </button>
          <a href="tel:+25377000000" onClick={(e) => { e.preventDefault(); toast("Appel de l'exploitation (simulation)", { message: company?.phone, tone: "info" }); }} className="flex flex-col items-center gap-1.5 rounded-2xl border border-slate-200 bg-white py-3.5 text-slate-700 active:scale-[0.97]">
            <Phone className="size-6" />
            <span className="text-xs font-semibold">Appeler l&apos;exploitation</span>
          </a>
        </div>
      )}

      {/* Camion */}
      {truck && (
        <Section title="Mon camion">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
            <SafeImage src={truck.image} alt={`${truck.brand} ${truck.model}`} className="h-36" sizes="480px" />
            <div className="grid grid-cols-3 divide-x divide-slate-100 p-3 text-center">
              <div>
                <p className="font-mono text-sm font-semibold">{truck.plate}</p>
                <p className="text-[11px] text-slate-500">Immatriculation</p>
              </div>
              <div>
                <p className="text-sm font-semibold">{truck.capacityT} t</p>
                <p className="text-[11px] text-slate-500">Capacité</p>
              </div>
              <div>
                <p className="text-sm font-semibold">{formatNumber(truck.mileageKm)}</p>
                <p className="text-[11px] text-slate-500">km</p>
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Terminées", value: done.length, icon: Check },
          { label: "À venir", value: upcoming.length, icon: CalendarClock },
          { label: "Note", value: driver.rating.toFixed(1), icon: Star },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-3 text-center">
            <s.icon className="mx-auto size-4 text-slate-400" />
            <p className="mt-1 text-lg font-semibold tabular-nums">{s.value}</p>
            <p className="text-[11px] text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {upcoming.filter((m) => m.id !== current?.id).length > 0 && (
        <Section title="Missions à venir" action={<button onClick={() => go({ name: "missions" })} className="text-xs font-semibold text-brand-600">Tout voir</button>}>
          <div className="space-y-2">
            {upcoming
              .filter((m) => m.id !== current?.id)
              .slice(0, 2)
              .map((m) => (
                <MissionCard key={m.id} m={m} onOpen={() => go({ name: "mission", id: m.id })} />
              ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function MissionScreen({ id, go, onDelay, onIncident }: { id: string; go: (s: Screen) => void; onDelay: (id: string) => void; onIncident: (id: string) => void }) {
  const { data, driver } = useDriverContext();
  const { toast } = useToast();
  const [confirmDelivery, setConfirmDelivery] = useState(false);
  const m = data.missions.find((x) => x.id === id);
  if (!m || !driver) return <p className="p-6 text-center text-sm text-slate-500">Mission introuvable.</p>;
  const truck = data.trucks.find((t) => t.id === m.truckId);
  const client = data.companies.find((c) => c.id === m.clientId);
  const load = data.loads.find((l) => l.missionId === m.id);
  const action = DRIVER_ACTIONS[m.step];
  const otherActive = data.missions.find((x) => x.driverId === driver.id && x.id !== m.id && x.step >= 2 && x.step <= 5);

  const runAction = () => {
    if (!action) return;
    if (action.next === 2 && otherActive) {
      toast("Une mission est déjà en cours", { message: `Terminez d'abord ${otherActive.ref}.`, tone: "warning" });
      return;
    }
    if (action.next === 6) {
      setConfirmDelivery(true);
      return;
    }
    actions.setMissionStep(m.id, action.next, driverName(driver));
    toast(OPERATION_STEPS[action.next].label, { message: `${m.ref} — statut transmis à l'exploitation` });
  };

  return (
    <div className="space-y-4 pb-28">
      <div className="flex items-center gap-3">
        <button onClick={() => go({ name: "home" })} className="inline-flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-white" aria-label="Retour">
          <ArrowLeft className="size-5" />
        </button>
        <div>
          <p className="font-mono text-xs text-slate-500">{m.ref}</p>
          <p className="font-semibold">
            {placeName(m.origin)} → {placeName(m.destination)}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <DjiboutiMap missions={[m]} trucks={truck ? [truck] : []} selectedId={m.id} height={200} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            Étape {m.step + 1}/8 · <strong className="text-ink">{OPERATION_STEPS[m.step].label}</strong>
          </span>
          <span className="tabular-nums">{missionProgress(m.step)} %</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className={cn("h-full rounded-full transition-all duration-700", m.step >= 6 ? "bg-success-600" : m.delayed ? "bg-amber-500" : "bg-brand-600")} style={{ width: `${missionProgress(m.step)}%` }} />
        </div>
        <div className="mt-4">
          <RouteLine m={m} />
        </div>
        <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
          Distance indicative {routeDistanceKm(m.origin, m.destination)} km · départ prévu le {formatDateShort(m.plannedDeparture)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <TruckIcon className="size-4 text-slate-400" />
          <p className="mt-1 font-mono text-sm font-semibold">{truck?.plate ?? "—"}</p>
          <p className="text-[11px] text-slate-500">{truck ? `${truck.brand} ${truck.model}` : "Camion non affecté"}</p>
          {truck && <p className="text-[11px] text-slate-500">{TRUCK_TYPES[truck.type]}</p>}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <Building2 className="size-4 text-slate-400" />
          <p className="mt-1 truncate text-sm font-semibold">{client?.name}</p>
          <p className="text-[11px] text-slate-500">Client destinataire</p>
          <p className="text-[11px] text-slate-500">{client?.phone}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Box className="size-4 text-slate-400" /> Chargement
        </p>
        <p className="mt-1.5 text-sm text-slate-700">{m.description}</p>
        <p className="mt-0.5 text-xs text-slate-500">{GOODS_TYPES[m.goodsType]}</p>
        {load && (
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-slate-50 py-2">
              <Scale className="mx-auto size-3.5 text-slate-400" />
              <p className="mt-0.5 text-sm font-semibold">{load.weightT} t</p>
            </div>
            <div className="rounded-xl bg-slate-50 py-2">
              <Box className="mx-auto size-3.5 text-slate-400" />
              <p className="mt-0.5 text-sm font-semibold">{load.volumeM3} m³</p>
            </div>
            <div className="rounded-xl bg-slate-50 py-2">
              <ListChecks className="mx-auto size-3.5 text-slate-400" />
              <p className="mt-0.5 text-sm font-semibold">{formatNumber(load.packages)} colis</p>
            </div>
          </div>
        )}
        {load?.hazardous && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">⚠ Marchandise dangereuse — respectez les consignes ADR.</p>}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="mb-3 text-sm font-semibold">Progression de la mission</p>
        <OperationTimeline mission={m} compact />
      </div>

      {m.step < 6 && (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" icon={Clock} className="h-12 border-amber-200 text-amber-700" onClick={() => onDelay(m.id)}>
            Signaler un retard
          </Button>
          <Button variant="secondary" icon={AlertTriangle} className="h-12 border-red-200 text-red-600" onClick={() => onIncident(m.id)}>
            Déclarer un incident
          </Button>
        </div>
      )}

      {/* Barre d'action fixe */}
      <div className="fixed inset-x-0 bottom-[68px] z-30 mx-auto max-w-md px-4 pb-3 lg:absolute lg:bottom-[68px]">
        {action ? (
          <button onClick={runAction} className={cn("flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-semibold text-white shadow-pop transition active:scale-[0.98]", action.next >= 6 ? "bg-success-600" : "bg-brand-600")}>
            <action.icon className="size-5" /> {action.label}
          </button>
        ) : (
          <div className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-success-50 text-sm font-semibold text-success-700">
            <Check className="size-5" /> {m.step === 6 ? "Livrée — en attente de clôture par l'exploitation" : "Mission clôturée"}
          </div>
        )}
        {action && <p className="mt-1.5 text-center text-[11px] text-slate-500">{action.hint}</p>}
      </div>
      <ConfirmDialog
        open={confirmDelivery}
        onClose={() => setConfirmDelivery(false)}
        tone="primary"
        title="Confirmer la livraison ?"
        message={`Vous confirmez la remise de la marchandise à ${client?.name ?? "au client"}. L'exploitation sera notifiée.`}
        confirmLabel="Confirmer la livraison"
        onConfirm={() => {
          actions.setMissionStep(m.id, 6, driverName(driver), "Livraison confirmée par le chauffeur");
          toast("Livraison effectuée 🎉", { message: `${m.ref} — merci, bonne route !` });
        }}
      />
    </div>
  );
}

function MissionsScreen({ go }: { go: (s: Screen) => void }) {
  const { missions } = useDriverContext();
  const active = missions.filter((m) => m.step < 6).sort((a, b) => b.step - a.step || a.plannedDeparture.localeCompare(b.plannedDeparture));
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Mes missions</h1>
      {active.length === 0 && <p className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500">Aucune mission attribuée.</p>}
      <div className="space-y-2">
        {active.map((m) => (
          <MissionCard key={m.id} m={m} onOpen={() => go({ name: "mission", id: m.id })} />
        ))}
      </div>
    </div>
  );
}

function HistoryScreen({ go }: { go: (s: Screen) => void }) {
  const { done } = useDriverContext();
  const km = done.reduce((s, m) => s + routeDistanceKm(m.origin, m.destination), 0);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Historique</h1>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-navy-900 p-4 text-white">
          <p className="text-2xl font-semibold tabular-nums">{done.length}</p>
          <p className="text-xs text-white/60">missions réalisées</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-card">
          <p className="text-2xl font-semibold tabular-nums">{formatNumber(km)}</p>
          <p className="text-xs text-slate-500">km parcourus</p>
        </div>
      </div>
      <div className="space-y-2">
        {done.map((m) => (
          <button key={m.id} onClick={() => go({ name: "mission", id: m.id })} className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-success-50 text-success-600">
              <Check className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {placeName(m.origin)} → {placeName(m.destination)}
              </p>
              <p className="text-xs text-slate-500">
                {m.ref} · {formatDateTime(m.history[m.history.length - 1]?.at ?? m.plannedArrival)}
              </p>
            </div>
            <ChevronRight className="size-4 text-slate-300" />
          </button>
        ))}
        {done.length === 0 && <p className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500">Aucune mission terminée pour le moment.</p>}
      </div>
    </div>
  );
}

function ProfileScreen() {
  const { data, driver, truck, company } = useDriverContext();
  const { toast } = useToast();
  const [reset, setReset] = useState(false);
  if (!driver) return null;
  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-white p-5 text-center shadow-card">
        <div className="flex justify-center">
          <DriverAvatar driver={driver} size="xl" />
        </div>
        <p className="mt-3 text-lg font-semibold">{driverName(driver)}</p>
        <p className="text-sm text-slate-500">{company?.name}</p>
        <p className="mt-1 flex items-center justify-center gap-1 text-sm text-slate-600">
          <Star className="size-4 fill-amber-400 text-amber-400" /> {driver.rating.toFixed(1)} · {driver.experienceYears} ans d&apos;expérience
        </p>
      </div>
      <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white px-4">
        {[
          ["Téléphone", driver.phone],
          ["N° de permis", driver.licenseNumber],
          ["Catégorie", driver.licenseCategory],
          ["Expiration du permis", formatDate(driver.licenseExpiry)],
          ["Camion affecté", truck?.plate ?? "—"],
        ].map(([l, v]) => (
          <div key={l} className="flex justify-between py-3 text-sm">
            <span className="text-slate-500">{l}</span>
            <span className="font-medium">{v}</span>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-dashed border-brand-200 bg-brand-50/50 p-4">
        <p className="text-xs font-semibold tracking-wider text-brand-700 uppercase">Démonstration</p>
        <label className="mt-2 block text-sm text-slate-600">
          Simuler l&apos;application d&apos;un autre chauffeur
          <select
            value={driver.id}
            onChange={(e) => {
              actions.setPrefs({ driverId: e.target.value });
              toast("Chauffeur changé", { message: driverName(data.drivers.find((d) => d.id === e.target.value)), tone: "info" });
            }}
            className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
          >
            {data.drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {driverName(d)} — {data.missions.filter((m) => m.driverId === d.id && m.step < 6).length} mission(s)
              </option>
            ))}
          </select>
        </label>
        <Button variant="secondary" icon={RotateCcw} className="mt-3 w-full" onClick={() => setReset(true)}>
          Réinitialiser la démonstration
        </Button>
      </div>
      <Link href="/login" className="block rounded-2xl border border-slate-200 bg-white py-3 text-center text-sm font-medium text-red-600">
        Se déconnecter
      </Link>
      <ConfirmDialog
        open={reset}
        onClose={() => setReset(false)}
        title="Réinitialiser la démonstration ?"
        message="Les statuts de missions et déclarations reviendront à leur état initial."
        confirmLabel="Réinitialiser"
        onConfirm={() => {
          actions.reset();
          toast("Démonstration réinitialisée");
        }}
      />
    </div>
  );
}

// ── Déclarations (feuilles mobiles) ──────────────────────────
const DELAY_REASONS = ["Embouteillage", "Contrôle douanier / frontière", "Attente au chargement", "Contrôle routier", "Conditions météo", "Autre"];
const INCIDENT_CHOICES: { type: IncidentType; icon: typeof Wrench }[] = [
  { type: "panne", icon: Wrench },
  { type: "accident", icon: AlertTriangle },
  { type: "chargement", icon: Box },
  { type: "administratif", icon: FileText },
  { type: "autre", icon: AlertTriangle },
];

function DelaySheet({ missionId, onClose }: { missionId: string; onClose: () => void }) {
  const { driver, data } = useDriverContext();
  const { toast } = useToast();
  const [reason, setReason] = useState(DELAY_REASONS[0]);
  const [minutes, setMinutes] = useState(30);
  const [comment, setComment] = useState("");
  const m = data.missions.find((x) => x.id === missionId);
  const send = () => {
    actions.reportIncident({
      missionId,
      type: "retard",
      description: `${reason}${comment ? ` — ${comment}` : ""}. Retard estimé : ${minutes} min.`,
      date: new Date().toISOString(),
      driverId: driver?.id ?? null,
      severity: minutes >= 120 ? "elevee" : minutes >= 60 ? "moyenne" : "faible",
      status: "nouveau",
      location: m ? `Trajet ${placeName(m.origin)} → ${placeName(m.destination)}` : "En route",
      delayMinutes: minutes,
      reportedBy: driverName(driver),
    });
    toast("Retard signalé", { message: "L'exploitation a été prévenue.", tone: "warning" });
    onClose();
  };
  return (
    <Modal open onClose={onClose} title="Signaler un retard" description={m?.ref} footer={<Button variant="primary" className="h-12 w-full" onClick={send}>Envoyer</Button>}>
      <p className="mb-2 text-xs font-medium text-slate-600">Motif</p>
      <div className="flex flex-wrap gap-2">
        {DELAY_REASONS.map((r) => (
          <button key={r} onClick={() => setReason(r)} className={cn("rounded-full border px-3.5 py-2 text-sm", reason === r ? "border-amber-500 bg-amber-50 font-medium text-amber-700" : "border-slate-200 text-slate-600")}>
            {r}
          </button>
        ))}
      </div>
      <p className="mt-5 mb-2 text-xs font-medium text-slate-600">Retard estimé</p>
      <div className="grid grid-cols-4 gap-2">
        {[15, 30, 60, 120].map((n) => (
          <button key={n} onClick={() => setMinutes(n)} className={cn("rounded-xl border py-3 text-sm font-semibold", minutes === n ? "border-brand-600 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600")}>
            {n < 60 ? `${n} min` : `${n / 60} h`}
          </button>
        ))}
      </div>
      <p className="mt-5 mb-2 text-xs font-medium text-slate-600">Commentaire (facultatif)</p>
      <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Précisez la situation…" />
    </Modal>
  );
}

function IncidentSheet({ missionId, onClose }: { missionId: string; onClose: () => void }) {
  const { driver, data } = useDriverContext();
  const { toast } = useToast();
  const [type, setType] = useState<IncidentType>("panne");
  const [severity, setSeverity] = useState<Severity>("moyenne");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState(false);
  const m = data.missions.find((x) => x.id === missionId);
  const send = () => {
    if (!description.trim()) {
      setError(true);
      return;
    }
    actions.reportIncident({
      missionId,
      type,
      description: description.trim(),
      date: new Date().toISOString(),
      driverId: driver?.id ?? null,
      severity,
      status: "nouveau",
      location: location.trim() || (m ? `Trajet ${placeName(m.origin)} → ${placeName(m.destination)}` : "En route"),
      reportedBy: driverName(driver),
    });
    toast("Incident déclaré", { message: "Un responsable va vous contacter.", tone: "error" });
    onClose();
  };
  return (
    <Modal open onClose={onClose} title="Déclarer un incident" description={m?.ref} footer={<Button variant="danger" className="h-12 w-full" onClick={send}>Envoyer la déclaration</Button>}>
      <p className="mb-2 text-xs font-medium text-slate-600">Type d&apos;incident</p>
      <div className="grid grid-cols-2 gap-2">
        {INCIDENT_CHOICES.map((c) => (
          <button key={c.type} onClick={() => setType(c.type)} className={cn("flex items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm", type === c.type ? "border-red-400 bg-red-50 font-medium text-red-700" : "border-slate-200 text-slate-600")}>
            <c.icon className="size-4 shrink-0" /> {INCIDENT_TYPES[c.type]}
          </button>
        ))}
      </div>
      <p className="mt-5 mb-2 text-xs font-medium text-slate-600">Gravité</p>
      <div className="grid grid-cols-4 gap-2">
        {(["faible", "moyenne", "elevee", "critique"] as Severity[]).map((s) => (
          <button key={s} onClick={() => setSeverity(s)} className={cn("rounded-xl border py-2.5 text-xs font-semibold", severity === s ? (s === "critique" ? "border-red-500 bg-red-500 text-white" : s === "elevee" ? "border-amber-500 bg-amber-50 text-amber-700" : "border-brand-600 bg-brand-50 text-brand-700") : "border-slate-200 text-slate-600")}>
            {{ faible: "Faible", moyenne: "Moyenne", elevee: "Élevée", critique: "Critique" }[s]}
          </button>
        ))}
      </div>
      <p className="mt-5 mb-2 text-xs font-medium text-slate-600">Description *</p>
      <Textarea value={description} invalid={error} onChange={(e) => { setDescription(e.target.value); setError(false); }} placeholder="Décrivez ce qui s'est passé…" />
      {error && <p className="mt-1 text-xs text-red-500">Une description est requise.</p>}
      <p className="mt-4 mb-2 text-xs font-medium text-slate-600">Localisation</p>
      <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ex. RN1, 10 km après PK12" className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-brand-500 focus:outline-none" />
    </Modal>
  );
}

// ── Application ──────────────────────────────────────────────
export function DriverApp() {
  const [screen, setScreen] = useState<Screen>({ name: "home" });
  const [delayFor, setDelayFor] = useState<string | null>(null);
  const [incidentFor, setIncidentFor] = useState<string | null>(null);
  const { driver, current } = useDriverContext();
  const actorName = driver ? driverName(driver) : null;
  // les mises à jour faites ici sont attribuées au chauffeur
  useLayoutEffect(() => setActor(actorName), [actorName]);

  const tabs: { name: Screen["name"]; label: string; icon: typeof Home }[] = [
    { name: "home", label: "Accueil", icon: Home },
    { name: "missions", label: "Missions", icon: ListChecks },
    { name: "history", label: "Historique", icon: History },
    { name: "profile", label: "Profil", icon: User },
  ];
  const go = (s: Screen) => {
    setScreen(s);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="min-h-screen bg-slate-200/70 lg:flex lg:items-center lg:justify-center lg:gap-12 lg:p-8">
      {/* Panneau de présentation (ordinateur) */}
      <aside className="hidden max-w-sm lg:block">
        <Logo subtitle="Espace chauffeur" />
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-navy-900">Une application pensée pour la route.</h1>
        <p className="mt-3 text-slate-600">Interface mobile-first : grands boutons, informations essentielles, mises à jour de statut en un geste.</p>
        <ol className="mt-6 space-y-3 text-sm text-slate-700">
          {["Ouvrez la mission en cours", "Consultez l'itinéraire et le chargement", "Démarrez la mission", "Actualisez chaque étape", "Confirmez la livraison"].map((s, i) => (
            <li key={s} className="flex items-center gap-3">
              <span className="inline-flex size-7 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
        {current && (
          <button onClick={() => go({ name: "mission", id: current.id })} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-navy-800">
            <PlayCircle className="size-4" /> Lancer le parcours de démonstration
          </button>
        )}
        <div className="mt-8 flex gap-4 text-sm">
          <Link href="/dashboard" className="font-medium text-brand-600 hover:underline">
            Administration
          </Link>
          <Link href="/entreprise" className="font-medium text-brand-600 hover:underline">
            Espace entreprise
          </Link>
        </div>
      </aside>

      {/* Téléphone */}
      <div className="relative mx-auto min-h-screen w-full max-w-md bg-canvas lg:h-[860px] lg:min-h-0 lg:overflow-hidden lg:rounded-[44px] lg:border-[10px] lg:border-navy-900 lg:shadow-2xl">
        <div className="scroll-thin h-full overflow-y-auto">
          <div className="px-4 pt-4 pb-28">
            {screen.name === "home" && <HomeScreen go={go} onDelay={setDelayFor} onIncident={setIncidentFor} />}
            {screen.name === "mission" && <MissionScreen id={screen.id} go={go} onDelay={setDelayFor} onIncident={setIncidentFor} />}
            {screen.name === "missions" && <MissionsScreen go={go} />}
            {screen.name === "history" && <HistoryScreen go={go} />}
            {screen.name === "profile" && <ProfileScreen />}
          </div>
        </div>
        <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-md border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:absolute" aria-label="Navigation chauffeur">
          {tabs.map((t) => {
            const active = screen.name === t.name || (t.name === "missions" && screen.name === "mission");
            return (
              <button key={t.name} onClick={() => go({ name: t.name } as Screen)} className={cn("flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium", active ? "text-brand-600" : "text-slate-400")} aria-current={active ? "page" : undefined}>
                <t.icon className="size-5" />
                {t.label}
              </button>
            );
          })}
        </nav>
      </div>
      {delayFor && driver && <DelaySheet missionId={delayFor} onClose={() => setDelayFor(null)} />}
      {incidentFor && driver && <IncidentSheet missionId={incidentFor} onClose={() => setIncidentFor(null)} />}
    </div>
  );
}

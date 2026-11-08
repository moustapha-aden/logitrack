"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CalendarClock,
  ChevronRight,
  CircleDollarSign,
  Clock,
  FlaskConical,
  MapPin,
  Package,
  Pencil,
  Ruler,
  Scale,
  Trash2,
  UserCheck,
} from "lucide-react";
import { actions } from "@/lib/store";
import { useData } from "@/lib/store/selectors";
import { GOODS_TYPES, INCIDENT_STATUS, INCIDENT_TYPES, LOAD_STATUS, MISSION_STATUS, OPERATION_STEPS, SEVERITY, TRUCK_TYPES } from "@/lib/constants";
import { placeById, placeName, routeDistanceKm } from "@/lib/data/geo";
import { driverName, formatDate, formatDateTime, formatDjf, formatNumber, loadStatusFromStep, missionProgress, missionStatus } from "@/lib/utils";
import type { IncidentStatus, OperationStep } from "@/types";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { CompanyLogo, DriverAvatar, SafeImage } from "@/components/ui/media";
import { ConfirmDialog } from "@/components/ui/modal";
import { InfoRow, ProgressBar } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { AssignModal } from "@/components/forms/assign-form";
import { IncidentFormModal } from "@/components/forms/incident-form";
import { MissionFormModal } from "@/components/forms/mission-form";
import { OperationTimeline } from "@/components/operations/timeline";
import { useDetail } from "./detail-provider";
import { DetailSection, EntityLink, MiniStat, NotFound } from "./parts";

function RouteSummary({ origin, destination }: { origin: string; destination: string }) {
  const o = placeById(origin);
  const d = placeById(destination);
  return (
    <div className="flex items-stretch gap-3">
      <div className="flex flex-col items-center py-1">
        <span className="size-3 rounded-full border-2 border-brand-600 bg-white" />
        <span className="my-1 w-0.5 flex-1 bg-gradient-to-b from-brand-600 to-success-600" />
        <span className="size-3 rounded-full bg-success-600" />
      </div>
      <div className="flex flex-1 flex-col justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">Départ</p>
          <p className="text-sm font-semibold">{o?.name ?? origin}</p>
          <p className="text-xs text-slate-500">{o?.region}</p>
        </div>
        <div>
          <p className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">Destination</p>
          <p className="text-sm font-semibold">{d?.name ?? destination}</p>
          <p className="text-xs text-slate-500">{d?.region}</p>
        </div>
      </div>
      <div className="self-center rounded-xl bg-slate-50 px-3 py-2 text-center">
        <p className="text-lg font-semibold tabular-nums">{routeDistanceKm(origin, destination)}</p>
        <p className="text-[11px] text-slate-500">km indicatifs</p>
      </div>
    </div>
  );
}

// ── Mission ──────────────────────────────────────────────────
export function MissionDetail({ id }: { id: string }) {
  const { all, lookups, scope } = useData();
  const { open, close } = useDetail();
  const { toast } = useToast();
  const [edit, setEdit] = useState(false);
  const [assign, setAssign] = useState(false);
  const [incident, setIncident] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const m = lookups.mission(id);
  if (!m) return <NotFound />;

  const company = lookups.company(m.companyId);
  const client = lookups.company(m.clientId);
  const truck = lookups.truck(m.truckId);
  const driver = lookups.driver(m.driverId);
  const carrier = lookups.carrier(m.carrierId);
  const load = lookups.loadOfMission(m.id);
  const incidents = all.incidents.filter((i) => i.missionId === m.id);
  const status = missionStatus(m);
  const next = m.step < 7 ? OPERATION_STEPS[m.step + 1] : null;
  const actor = scope ? `Exploitation ${company?.initials ?? ""}` : all.settings.userName;
  const needsAssignment = !m.truckId || !m.driverId;

  const advance = (step: OperationStep) => {
    if (step >= 2 && needsAssignment) {
      toast("Affectation requise", { message: "Affectez un camion et un chauffeur avant de démarrer la mission.", tone: "warning" });
      setAssign(true);
      return;
    }
    actions.setMissionStep(m.id, step, actor);
    toast("Statut mis à jour", { message: `${m.ref} : ${OPERATION_STEPS[step].label}` });
  };

  return (
    <div className="space-y-4 px-5 pt-14 pb-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-semibold text-slate-500">{m.ref}</span>
            <StatusBadge map={MISSION_STATUS} value={status} />
            {needsAssignment && <Badge tone="red">À affecter</Badge>}
          </div>
          <h2 className="mt-1.5 flex flex-wrap items-center gap-2 text-xl font-semibold">
            {placeName(m.origin)} <ArrowRight className="size-5 text-slate-400" /> {placeName(m.destination)}
          </h2>
          <p className="text-sm text-slate-500">{GOODS_TYPES[m.goodsType]}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" icon={Pencil} onClick={() => setEdit(true)}>
            Modifier
          </Button>
          <Button variant="secondary" size="sm" icon={UserCheck} onClick={() => setAssign(true)} disabled={m.step >= 6}>
            Affecter
          </Button>
          <Button variant="ghost" size="sm" icon={Trash2} className="text-red-600 hover:bg-red-50" onClick={() => setConfirm(true)}>
            Supprimer
          </Button>
        </div>
      </div>

      {/* Pilotage de l'avancement */}
      <div className="rounded-2xl bg-navy-900 p-5 text-white">
        <div className="flex items-center justify-between text-xs text-white/60">
          <span>
            Étape {m.step + 1} / 8 · {OPERATION_STEPS[m.step].label}
          </span>
          <span className="tabular-nums">{missionProgress(m.step)} %</span>
        </div>
        <ProgressBar value={missionProgress(m.step)} tone={m.delayed ? "orange" : m.step >= 6 ? "green" : "blue"} className="mt-2 bg-white/10" />
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          {next ? (
            <Button variant={next.step >= 6 ? "success" : "primary"} iconRight={ChevronRight} className="flex-1" onClick={() => advance(next.step)}>
              Passer à : {next.label}
            </Button>
          ) : (
            <div className="flex-1 rounded-lg bg-white/10 px-3 py-2.5 text-center text-sm">Mission clôturée ✓</div>
          )}
          <div className="sm:w-56">
            <Select value={m.step} onChange={(e) => advance(Number(e.target.value) as OperationStep)} aria-label="Définir l'étape" className="border-white/10 bg-white/10 text-white [&>option]:text-ink">
              {OPERATION_STEPS.map((s) => (
                <option key={s.step} value={s.step}>
                  {s.step + 1}. {s.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
        {m.step < 6 && (
          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" variant="ghost" icon={AlertTriangle} className="text-amber-300 hover:bg-white/10 hover:text-amber-200" onClick={() => setIncident(true)}>
              Déclarer un incident
            </Button>
            <Button
              size="sm"
              variant="ghost"
              icon={Clock}
              className="text-white/80 hover:bg-white/10 hover:text-white"
              onClick={() => {
                actions.setMissionDelayed(m.id, !m.delayed);
                toast(m.delayed ? "Retard levé" : "Mission marquée en retard", { message: m.ref, tone: m.delayed ? "success" : "warning" });
              }}
            >
              {m.delayed ? "Lever le retard" : "Marquer en retard"}
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <DetailSection title="Itinéraire">
          <RouteSummary origin={m.origin} destination={m.destination} />
          <div className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
            <InfoRow icon={CalendarClock} label="Départ prévu" value={formatDateTime(m.plannedDeparture)} />
            <InfoRow icon={CalendarClock} label="Arrivée prévue" value={formatDateTime(m.plannedArrival)} />
            <InfoRow icon={CircleDollarSign} label="Tarif" value={formatDjf(m.priceDjf)} />
          </div>
        </DetailSection>
        <DetailSection title="Suivi des opérations">
          <OperationTimeline mission={m} compact />
        </DetailSection>
      </div>

      <DetailSection title="Acteurs">
        <div className="grid gap-2 sm:grid-cols-2">
          <EntityLink onClick={() => company && open({ kind: "company", id: company.id })} leading={<CompanyLogo company={company} />} label={company?.name ?? "—"} sub="Entreprise" />
          <EntityLink onClick={() => client && open({ kind: "company", id: client.id })} leading={<CompanyLogo company={client} />} label={client?.name ?? "—"} sub="Client" />
          {truck ? (
            <EntityLink onClick={() => open({ kind: "truck", id: truck.id })} leading={<SafeImage src={truck.image} alt={truck.plate} className="h-10 w-14 shrink-0 rounded-lg" sizes="56px" />} label={<span className="font-mono">{truck.plate}</span>} sub={`${TRUCK_TYPES[truck.type]} · ${truck.capacityT} t`} />
          ) : (
            <EntityLink onClick={() => setAssign(true)} label="Camion non affecté" sub="Cliquer pour affecter" />
          )}
          {driver ? (
            <EntityLink onClick={() => open({ kind: "driver", id: driver.id })} leading={<DriverAvatar driver={driver} />} label={driverName(driver)} sub={`Chauffeur · ${driver.phone}`} />
          ) : (
            <EntityLink onClick={() => setAssign(true)} label="Chauffeur non affecté" sub="Cliquer pour affecter" />
          )}
          {carrier && <EntityLink onClick={() => open({ kind: "carrier", id: carrier.id })} label={carrier.name} sub="Transporteur partenaire" />}
        </div>
      </DetailSection>

      <DetailSection title="Chargement" action={load && <StatusBadge map={LOAD_STATUS} value={loadStatusFromStep(m.step)} />}>
        <p className="mb-3 text-sm text-slate-700">{m.description}</p>
        {load && (
          <button onClick={() => open({ kind: "load", id: load.id })} className="grid w-full grid-cols-2 gap-2 text-left sm:grid-cols-4">
            <MiniStat label="Poids" value={`${load.weightT} t`} />
            <MiniStat label="Volume" value={`${load.volumeM3} m³`} />
            <MiniStat label="Colis" value={formatNumber(load.packages)} />
            <MiniStat label="Réf. chargement" value={<span className="font-mono text-xs">{load.ref}</span>} />
          </button>
        )}
      </DetailSection>

      <DetailSection title={`Incidents (${incidents.length})`} action={m.step < 6 && <Button size="sm" variant="ghost" icon={AlertTriangle} onClick={() => setIncident(true)}>Déclarer</Button>}>
        <div className="space-y-2">
          {incidents.map((i) => (
            <EntityLink key={i.id} onClick={() => open({ kind: "incident", id: i.id })} label={`${INCIDENT_TYPES[i.type]} · ${i.ref}`} sub={i.description} leading={<StatusBadge map={SEVERITY} value={i.severity} />} />
          ))}
          {incidents.length === 0 && <p className="text-sm text-slate-500">Aucun incident déclaré sur cette mission.</p>}
        </div>
      </DetailSection>

      <MissionFormModal open={edit} onClose={() => setEdit(false)} mission={m} />
      <AssignModal open={assign} onClose={() => setAssign(false)} mission={m} />
      <IncidentFormModal open={incident} onClose={() => setIncident(false)} missionId={m.id} reportedBy={actor} />
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Supprimer cette mission ?"
        message={`La mission ${m.ref}, son chargement et ses incidents associés seront supprimés.`}
        confirmLabel="Supprimer"
        onConfirm={() => {
          actions.deleteMission(m.id);
          toast("Mission supprimée", { message: m.ref, tone: "info" });
          close();
        }}
      />
    </div>
  );
}

// ── Chargement ───────────────────────────────────────────────
export function LoadDetail({ id }: { id: string }) {
  const { all, lookups } = useData();
  const { open } = useDetail();
  const l = all.loads.find((x) => x.id === id);
  if (!l) return <NotFound />;
  const m = lookups.mission(l.missionId);
  const client = lookups.company(m?.clientId);
  const status = loadStatusFromStep(m?.step ?? 0);

  return (
    <div>
      <div className="relative h-40">
        <SafeImage src={m?.goodsType === "conteneurs" ? "/images/port-terminal.jpg" : "/images/parc-camions-corridor.jpg"} alt="" className="absolute inset-0" sizes="700px" fallback="image" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/85 to-navy-950/10" />
        <div className="absolute bottom-4 left-5 text-white sm:left-6">
          <StatusBadge map={LOAD_STATUS} value={status} />
          <h2 className="mt-2 text-xl font-semibold">{l.nature}</h2>
          <p className="font-mono text-sm text-white/70">{l.ref}</p>
        </div>
      </div>
      <div className="space-y-4 px-5 py-5 sm:px-6">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <MiniStat label="Poids" value={`${l.weightT} t`} />
          <MiniStat label="Volume" value={`${l.volumeM3} m³`} />
          <MiniStat label="Colis" value={formatNumber(l.packages)} />
          <MiniStat label="Valeur déclarée" value={<span className="text-sm">{formatDjf(l.declaredValueDjf)}</span>} />
        </div>
        <DetailSection title="Caractéristiques">
          <div className="divide-y divide-slate-100">
            <InfoRow icon={Package} label="Nature" value={l.nature} />
            <InfoRow icon={Boxes} label="Type de marchandise" value={m ? GOODS_TYPES[m.goodsType] : "—"} />
            <InfoRow icon={Scale} label="Poids brut" value={`${l.weightT} tonnes`} />
            <InfoRow icon={Ruler} label="Volume" value={`${l.volumeM3} m³`} />
            {l.containerNo && <InfoRow icon={Boxes} label="N° de conteneur" value={<span className="font-mono text-xs">{l.containerNo}</span>} />}
            <InfoRow icon={FlaskConical} label="Marchandise dangereuse" value={l.hazardous ? <Badge tone="red">Oui — ADR</Badge> : "Non"} />
          </div>
        </DetailSection>
        <DetailSection title="Origine et destination">
          {m && <RouteSummary origin={m.origin} destination={m.destination} />}
        </DetailSection>
        <div className="grid gap-4 sm:grid-cols-2">
          <DetailSection title="Mission associée">{m && <EntityLink onClick={() => open({ kind: "mission", id: m.id })} label={m.ref} sub={`${placeName(m.origin)} → ${placeName(m.destination)}`} />}</DetailSection>
          <DetailSection title="Client">{client && <EntityLink onClick={() => open({ kind: "company", id: client.id })} leading={<CompanyLogo company={client} />} label={client.name} />}</DetailSection>
        </div>
      </div>
    </div>
  );
}

// ── Incident ─────────────────────────────────────────────────
export function IncidentDetail({ id }: { id: string }) {
  const { all, lookups } = useData();
  const { open, close } = useDetail();
  const { toast } = useToast();
  const [confirm, setConfirm] = useState(false);
  const i = all.incidents.find((x) => x.id === id);
  if (!i) return <NotFound />;
  const m = lookups.mission(i.missionId);
  const driver = lookups.driver(i.driverId);
  const statuses: IncidentStatus[] = ["nouveau", "en_cours", "resolu"];

  return (
    <div className="space-y-4 px-5 pt-14 pb-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-4">
          <span className={`inline-flex size-12 items-center justify-center rounded-2xl ${i.severity === "critique" ? "bg-red-50 text-red-500" : i.severity === "elevee" ? "bg-amber-50 text-amber-500" : "bg-brand-50 text-brand-600"}`}>
            <AlertTriangle className="size-6" />
          </span>
          <div>
            <div className="flex flex-wrap gap-1.5">
              <StatusBadge map={INCIDENT_STATUS} value={i.status} />
              <StatusBadge map={SEVERITY} value={i.severity} />
            </div>
            <h2 className="mt-1.5 text-xl font-semibold">{INCIDENT_TYPES[i.type]}</h2>
            <p className="font-mono text-sm text-slate-500">{i.ref}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" icon={Trash2} className="text-red-600 hover:bg-red-50" onClick={() => setConfirm(true)}>
          Supprimer
        </Button>
      </div>

      <DetailSection title="Statut de résolution">
        <div className="grid grid-cols-3 gap-2">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => {
                actions.setIncidentStatus(i.id, s);
                toast("Statut de l'incident mis à jour", { message: `${i.ref} : ${INCIDENT_STATUS[s].label}`, tone: s === "resolu" ? "success" : "info" });
              }}
              className={`rounded-xl border px-2 py-2.5 text-xs font-medium transition sm:text-sm ${i.status === s ? (s === "resolu" ? "border-success-600 bg-success-50 text-success-700" : s === "en_cours" ? "border-amber-500 bg-amber-50 text-amber-700" : "border-red-400 bg-red-50 text-red-700") : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
            >
              {INCIDENT_STATUS[s].label}
            </button>
          ))}
        </div>
      </DetailSection>

      <DetailSection title="Description">
        <p className="text-sm leading-relaxed text-slate-700">{i.description}</p>
        <div className="mt-3 divide-y divide-slate-100 border-t border-slate-100">
          <InfoRow icon={CalendarClock} label="Date" value={`${formatDate(i.date)} · ${formatDateTime(i.date).split("·")[1]}`} />
          <InfoRow icon={MapPin} label="Localisation" value={i.location} />
          {i.delayMinutes ? <InfoRow icon={Clock} label="Retard estimé" value={`${Math.floor(i.delayMinutes / 60)} h ${String(i.delayMinutes % 60).padStart(2, "0")}`} /> : null}
          <InfoRow icon={UserCheck} label="Déclaré par" value={i.reportedBy} />
        </div>
      </DetailSection>

      <div className="grid gap-4 sm:grid-cols-2">
        <DetailSection title="Mission concernée">{m ? <EntityLink onClick={() => open({ kind: "mission", id: m.id })} label={m.ref} sub={`${placeName(m.origin)} → ${placeName(m.destination)}`} /> : <p className="text-sm text-slate-500">—</p>}</DetailSection>
        <DetailSection title="Chauffeur">{driver ? <EntityLink onClick={() => open({ kind: "driver", id: driver.id })} leading={<DriverAvatar driver={driver} />} label={driverName(driver)} sub={driver.phone} /> : <p className="text-sm text-slate-500">—</p>}</DetailSection>
      </div>
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Supprimer cet incident ?"
        message={`L'incident ${i.ref} sera définitivement supprimé de l'historique.`}
        confirmLabel="Supprimer"
        onConfirm={() => {
          actions.deleteIncident(i.id);
          toast("Incident supprimé", { message: i.ref, tone: "info" });
          close();
        }}
      />
    </div>
  );
}

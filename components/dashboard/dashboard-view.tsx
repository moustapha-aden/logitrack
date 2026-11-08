"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BellRing,
  Building2,
  CheckCircle2,
  Clock,
  IdCard,
  Plus,
  Route,
  Truck,
  Wrench,
} from "lucide-react";
import { useData } from "@/lib/store/selectors";
import { DEMO_NOW, INCIDENT_TYPES, MISSION_STATUS, SEVERITY, TRUCK_STATUS } from "@/lib/constants";
import { dailySeries, monthlySeries, scopeShare } from "@/lib/data/analytics";
import { placeName } from "@/lib/data/geo";
import { cn, driverName, formatDate, formatDateTime, isActiveMission, missionStatus } from "@/lib/utils";
import type { TruckStatus } from "@/types";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, StatCard } from "@/components/ui/card";
import { CompanyLogo, DriverAvatar, SafeImage } from "@/components/ui/media";
import { Segmented } from "@/components/ui/misc";
import { AreaTrend, Donut, SERIES } from "@/components/charts";
import { useDetail } from "@/components/details/detail-provider";
import { StepProgress } from "@/components/operations/timeline";
import { MissionFormModal } from "@/components/forms/mission-form";
import { IncidentFormModal } from "@/components/forms/incident-form";

export function DashboardView() {
  const data = useData();
  const { scope, all, missions, trucks, drivers, incidents, activity, lookups } = data;
  const { open } = useDetail();
  const router = useRouter();
  const [period, setPeriod] = useState<"30j" | "12m">("30j");
  const [createMission, setCreateMission] = useState(false);
  const [declare, setDeclare] = useState(false);
  const base = scope ? "/entreprise" : "";
  const company = lookups.company(scope);

  const active = missions.filter(isActiveMission);
  const done = missions.filter((m) => m.step >= 6);
  const delayed = missions.filter((m) => m.delayed && m.step < 6);
  const openIncidents = incidents.filter((i) => i.status !== "resolu");
  const activeDrivers = drivers.filter((d) => d.availability === "disponible" || d.availability === "en_mission");
  const share = scopeShare(all, missions);
  const series = period === "30j" ? dailySeries(missions, share) : monthlySeries(all.monthly, share);

  const statusCounts = (["planifiee", "en_cours", "en_retard", "terminee"] as const).map((s) => ({
    name: MISSION_STATUS[s].label,
    value: missions.filter((m) => missionStatus(m) === s).length,
    color: { planifiee: SERIES.gray, en_cours: SERIES.blue, en_retard: SERIES.amber, terminee: SERIES.green }[s],
  }));

  const lastUpdate = (m: (typeof missions)[number]) => m.history[m.history.length - 1]?.at ?? m.createdAt;
  const latest = [...missions].sort((a, b) => lastUpdate(b).localeCompare(lastUpdate(a))).slice(0, 6);
  const unassigned = missions.filter((m) => m.step < 6 && (!m.truckId || !m.driverId));
  const blockedTrucks = trucks.filter((t) => t.status === "immobilise" || t.status === "maintenance");
  const alerts = [
    ...openIncidents
      .filter((i) => i.severity === "critique" || i.severity === "elevee")
      .map((i) => ({ id: i.id, tone: i.severity === "critique" ? "red" : "orange", icon: AlertTriangle, title: `${INCIDENT_TYPES[i.type]} — ${lookups.mission(i.missionId)?.ref ?? ""}`, sub: i.location, onClick: () => open({ kind: "incident", id: i.id }) })),
    ...delayed.map((m) => ({ id: m.id, tone: "orange", icon: Clock, title: `Retard — ${m.ref}`, sub: `${placeName(m.origin)} → ${placeName(m.destination)}`, onClick: () => open({ kind: "mission", id: m.id }) })),
    ...unassigned.map((m) => ({ id: `u-${m.id}`, tone: "blue", icon: Route, title: `Mission à affecter — ${m.ref}`, sub: `Départ ${formatDateTime(m.plannedDeparture)}`, onClick: () => open({ kind: "mission", id: m.id }) })),
    ...blockedTrucks.map((t) => ({ id: t.id, tone: t.status === "immobilise" ? "red" : "neutral", icon: Wrench, title: `${t.plate} ${TRUCK_STATUS[t.status].label.toLowerCase()}`, sub: `${t.brand} ${t.model}`, onClick: () => open({ kind: "truck", id: t.id }) })),
  ].slice(0, 7);

  const fleetStatus = (Object.keys(TRUCK_STATUS) as TruckStatus[]).map((s) => ({ s, n: trucks.filter((t) => t.status === s).length }));
  const fleetColors: Record<TruckStatus, string> = { disponible: "bg-success-600", en_mission: "bg-brand-600", maintenance: "bg-amber-500", immobilise: "bg-red-500" };
  const toneDot: Record<string, string> = { red: "bg-red-50 text-red-500", orange: "bg-amber-50 text-amber-600", blue: "bg-brand-50 text-brand-600", neutral: "bg-slate-100 text-slate-500" };

  return (
    <div className="space-y-6">
      {/* Bandeau d'accueil */}
      <div className="relative overflow-hidden rounded-3xl bg-navy-900 text-white">
        <SafeImage src={scope ? "/images/truck-container-1.jpg" : "/images/port-terminal.jpg"} alt="" className="absolute inset-0 opacity-35" sizes="1200px" priority fallback="image" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-900 via-navy-900/85 to-navy-900/20" />
        <div className="relative flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-semibold tracking-wider text-brand-500 uppercase">{formatDate(DEMO_NOW)} · Djibouti</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{scope ? company?.name : "Vue d'ensemble de la plateforme"}</h1>
            <p className="mt-2 text-sm text-white/70">
              {active.length} missions en cours, {delayed.length} en retard et {openIncidents.length} incidents ouverts.{" "}
              {scope ? "Pilotez votre flotte et vos opérations en temps réel." : "Supervisez l'ensemble des acteurs du transport routier."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button icon={Plus} onClick={() => setCreateMission(true)}>
              Créer une mission
            </Button>
            <Button variant="secondary" icon={AlertTriangle} onClick={() => setDeclare(true)} className="border-white/20 bg-white/10 text-white hover:bg-white/20">
              Déclarer un incident
            </Button>
          </div>
        </div>
      </div>

      {/* KPI */}
      <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3 lg:gap-4", scope ? "xl:grid-cols-6" : "xl:grid-cols-7")}>
        {!scope && <StatCard label="Entreprises" value={all.companies.filter((c) => c.status === "actif").length} icon={Building2} tone="navy" hint={`${all.companies.length} inscrites`} onClick={() => router.push("/entreprises")} />}
        <StatCard label="Camions" value={trucks.length} icon={Truck} tone="blue" hint={`${trucks.filter((t) => t.status === "disponible").length} disponibles`} onClick={() => router.push(`${base}/camions`)} />
        <StatCard label="Chauffeurs actifs" value={activeDrivers.length} icon={IdCard} tone="violet" hint={`sur ${drivers.length} chauffeurs`} onClick={() => router.push(scope ? "/entreprise/chauffeurs" : "/chauffeurs")} />
        <StatCard label="Missions en cours" value={active.length} icon={Activity} tone="blue" hint="en chargement ou transit" onClick={() => router.push(scope ? "/entreprise/suivi" : "/operations")} />
        <StatCard label="Missions terminées" value={done.length} icon={CheckCircle2} tone="green" hint={`${missions.filter((m) => m.step === 6).length} à clôturer`} onClick={() => router.push(`${base}/missions`)} />
        <StatCard label="Missions en retard" value={delayed.length} icon={Clock} tone="orange" hint={active.length ? `${Math.round((delayed.filter((m) => m.step >= 2).length / active.length) * 100)} % des missions en cours` : undefined} onClick={() => router.push(scope ? "/entreprise/suivi" : "/operations")} />
        <StatCard label="Incidents ouverts" value={openIncidents.length} icon={AlertTriangle} tone="red" hint={`${incidents.length} déclarés au total`} onClick={() => router.push(`${base}/incidents`)} />
      </div>

      {/* Graphiques */}
      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Opérations par période"
            subtitle={period === "30j" ? "Missions démarrées par jour — 30 derniers jours" : "Missions par mois — 12 derniers mois"}
            action={
              <Segmented
                size="sm"
                value={period}
                onChange={setPeriod}
                options={[
                  { value: "30j", label: "30 jours" },
                  { value: "12m", label: "12 mois" },
                ]}
              />
            }
          />
          <div className="px-3 pb-4">
            <AreaTrend
              data={series}
              xKey="label"
              series={[
                { key: "missions", name: "Missions", color: SERIES.blue },
                { key: "retards", name: "Retards", color: SERIES.amber },
              ]}
            />
          </div>
        </Card>
        <Card>
          <CardHeader title="Répartition des missions" subtitle="Par statut, toutes périodes" />
          <div className="px-5 pb-5">
            <Donut data={statusCounts} centerLabel="missions" />
          </div>
        </Card>
      </div>

      {/* Dernières missions + alertes */}
      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Missions récemment mises à jour"
            subtitle="Dernières évolutions du suivi des opérations"
            action={
              <Link href={`${base}/missions`} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700">
                Toutes les missions <ArrowRight className="size-3.5" />
              </Link>
            }
          />
          <div className="divide-y divide-slate-100 px-2 pb-2">
            {latest.map((m) => {
              const driver = lookups.driver(m.driverId);
              const truck = lookups.truck(m.truckId);
              return (
                <button key={m.id} onClick={() => open({ kind: "mission", id: m.id })} className="grid w-full grid-cols-[1fr_auto] items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-slate-50 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_130px_auto]">
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-semibold text-slate-500">{m.ref}</p>
                    <p className="truncate text-sm font-medium text-ink">
                      {placeName(m.origin)} → {placeName(m.destination)}
                    </p>
                  </div>
                  <div className="hidden min-w-0 items-center gap-2.5 sm:flex">
                    <DriverAvatar driver={driver} size="xs" />
                    <div className="min-w-0">
                      <p className="truncate text-sm text-ink">{driverName(driver)}</p>
                      <p className="truncate font-mono text-xs text-slate-500">{truck?.plate ?? "—"}</p>
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <StepProgress step={m.step} delayed={m.delayed} />
                    <p className="mt-1 truncate text-[11px] text-slate-400">MAJ {formatDateTime(lastUpdate(m))}</p>
                  </div>
                  <StatusBadge map={MISSION_STATUS} value={missionStatus(m)} />
                </button>
              );
            })}
          </div>
        </Card>
        <Card>
          <CardHeader title="Alertes importantes" subtitle={`${alerts.length} éléments nécessitent votre attention`} icon={BellRing} />
          <div className="space-y-1 px-3 pb-4">
            {alerts.map((a) => (
              <button key={a.id} onClick={a.onClick} className="flex w-full items-start gap-3 rounded-xl px-2 py-2.5 text-left transition hover:bg-slate-50">
                <span className={cn("inline-flex size-8 shrink-0 items-center justify-center rounded-lg", toneDot[a.tone])}>
                  <a.icon className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-ink">{a.title}</span>
                  <span className="block truncate text-xs text-slate-500">{a.sub}</span>
                </span>
              </button>
            ))}
            {alerts.length === 0 && <p className="px-2 py-8 text-center text-sm text-slate-500">Aucune alerte. Tout est sous contrôle ✓</p>}
          </div>
        </Card>
      </div>

      {/* Flotte + activité */}
      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Aperçu de la flotte"
            subtitle={`${trucks.length} véhicules · ${trucks.length ? Math.round((trucks.filter((t) => t.status === "en_mission").length / trucks.length) * 100) : 0} % en mission actuellement`}
            action={
              <Link href={`${base}/camions`} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700">
                Gérer la flotte <ArrowRight className="size-3.5" />
              </Link>
            }
          />
          <div className="px-5">
            <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full">
              {fleetStatus.map(({ s, n }) => n > 0 && <span key={s} className={fleetColors[s]} style={{ width: `${(n / Math.max(1, trucks.length)) * 100}%` }} title={`${TRUCK_STATUS[s].label} : ${n}`} />)}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {fleetStatus.map(({ s, n }) => (
                <div key={s} className="flex items-center gap-2 text-sm">
                  <span className={cn("size-2.5 rounded-full", fleetColors[s])} />
                  <span className="text-slate-600">{TRUCK_STATUS[s].label}</span>
                  <span className="ml-auto font-semibold tabular-nums">{n}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="scroll-thin flex gap-3 overflow-x-auto px-5 pt-5 pb-5">
            {trucks
              .filter((t) => t.status === "en_mission")
              .concat(trucks.filter((t) => t.status !== "en_mission"))
              .slice(0, 8)
              .map((t) => {
                const owner = lookups.company(t.companyId);
                return (
                  <button key={t.id} onClick={() => open({ kind: "truck", id: t.id })} className="group w-52 shrink-0 overflow-hidden rounded-xl border border-slate-200 text-left transition hover:-translate-y-0.5 hover:shadow-pop">
                    <div className="relative">
                      <SafeImage src={t.image} alt={`${t.brand} ${t.model}`} className="h-28 transition duration-300 group-hover:scale-[1.03]" sizes="208px" />
                      <span className="absolute top-2 left-2">
                        <StatusBadge map={TRUCK_STATUS} value={t.status} className="bg-white/95" />
                      </span>
                    </div>
                    <div className="p-3">
                      <p className="font-mono text-sm font-semibold">{t.plate}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-slate-500">
                        {!scope && <CompanyLogo company={owner} size="xs" />}
                        {t.brand} {t.model}
                      </p>
                    </div>
                  </button>
                );
              })}
          </div>
        </Card>
        <Card>
          <CardHeader title="Activité récente" subtitle="Dernières actions sur la plateforme" />
          <ol className="relative space-y-4 px-5 pb-5">
            {activity.slice(0, 7).map((a) => (
              <li key={a.id} className="relative flex gap-3">
                <span className={cn("mt-1.5 size-2 shrink-0 rounded-full ring-4", a.tone === "success" ? "bg-success-600 ring-success-50" : a.tone === "warning" ? "bg-amber-500 ring-amber-50" : a.tone === "danger" ? "bg-red-500 ring-red-50" : "bg-brand-600 ring-brand-50")} />
                <button onClick={() => a.link && open(a.link)} className="min-w-0 text-left">
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold text-ink">{a.actor}</span> {a.text}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">{formatDateTime(a.at)}</p>
                </button>
              </li>
            ))}
            {activity.length === 0 && <p className="text-sm text-slate-500">Aucune activité récente.</p>}
          </ol>
        </Card>
      </div>

      {openIncidents.length > 0 && (
        <Card>
          <CardHeader title="Incidents ouverts" subtitle="Déclarations en attente de résolution" icon={AlertTriangle} />
          <div className="grid gap-3 px-5 pb-5 sm:grid-cols-2 xl:grid-cols-4">
            {openIncidents.slice(0, 4).map((i) => (
              <button key={i.id} onClick={() => open({ kind: "incident", id: i.id })} className="rounded-xl border border-slate-200 p-3 text-left transition hover:border-slate-300 hover:shadow-card">
                <div className="flex items-center justify-between">
                  <StatusBadge map={SEVERITY} value={i.severity} />
                  <span className="font-mono text-[11px] text-slate-400">{i.ref}</span>
                </div>
                <p className="mt-2 text-sm font-semibold">{INCIDENT_TYPES[i.type]}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{i.description}</p>
              </button>
            ))}
          </div>
        </Card>
      )}

      <MissionFormModal open={createMission} onClose={() => setCreateMission(false)} />
      <IncidentFormModal open={declare} onClose={() => setDeclare(false)} />
    </div>
  );
}

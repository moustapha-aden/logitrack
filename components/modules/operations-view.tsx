"use client";

import { useRef, useState } from "react";
import { AlertTriangle, ArrowRight, ChevronRight, Eye, MapPinned, Radio, RotateCcw } from "lucide-react";
import { actions, useAppData } from "@/lib/store";
import { useData } from "@/lib/store/selectors";
import { MISSION_STATUS, OPERATION_STEPS } from "@/lib/constants";
import { placeName } from "@/lib/data/geo";
import { cn, driverName, formatDateTime, includesText, missionStatus } from "@/lib/utils";
import type { Mission, OperationStep } from "@/types";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { DriverAvatar } from "@/components/ui/media";
import { EmptyState, PageHeader, SearchInput, Segmented, Toolbar } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { DataTable, type Column } from "@/components/tables/data-table";
import { DjiboutiMap } from "@/components/maps";
import { AssignModal } from "@/components/forms/assign-form";
import { IncidentFormModal } from "@/components/forms/incident-form";
import { useDetail } from "@/components/details/detail-provider";
import { OperationTimeline, StepProgress } from "@/components/operations/timeline";

type Filter = "actives" | "planifiees" | "terminees" | "toutes";

export function OperationsView() {
  const { missions, trucks, lookups, scope } = useData();
  const raw = useAppData();
  const { open } = useDetail();
  const { toast } = useToast();
  const [filter, setFilter] = useState<Filter>("actives");
  const [stepFilter, setStepFilter] = useState<OperationStep | null>(null);
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [assign, setAssign] = useState<Mission | undefined>();
  const [incident, setIncident] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // sur mobile/tablette, le panneau est sous le tableau : on y amène l'utilisateur
  const selectFromList = (id: string) => {
    setSelectedId(id);
    if (window.innerWidth < 1280) panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const byFilter = missions.filter((m) => {
    if (filter === "actives") return m.step >= 2 && m.step <= 5;
    if (filter === "planifiees") return m.step <= 1;
    if (filter === "terminees") return m.step >= 6;
    return true;
  });
  const list = byFilter
    .filter((m) => stepFilter === null || m.step === stepFilter)
    .filter((m) => includesText([m.ref, placeName(m.origin), placeName(m.destination), lookups.truck(m.truckId)?.plate, driverName(lookups.driver(m.driverId))], q))
    .sort((a, b) => Number(b.delayed) - Number(a.delayed) || b.step - a.step);
  const selected = lookups.mission(selectedId) ?? list[0];
  const actor = scope ? `Exploitation ${lookups.company(scope)?.initials ?? ""}` : raw.settings.userName;

  const lastUpdate = (m: Mission) => m.history[m.history.length - 1]?.at ?? m.createdAt;

  const setStep = (m: Mission, step: OperationStep) => {
    if (step >= 2 && (!m.truckId || !m.driverId)) {
      toast("Affectation requise", { message: "Affectez un camion et un chauffeur avant de démarrer.", tone: "warning" });
      setAssign(m);
      return;
    }
    actions.setMissionStep(m.id, step, actor);
    toast("Suivi mis à jour", { message: `${m.ref} : ${OPERATION_STEPS[step].label}` });
  };

  const columns: Column<Mission>[] = [
    { key: "ref", header: "Mission", cell: (m) => <span className="font-mono text-xs font-semibold whitespace-nowrap">{m.ref}</span> },
    { key: "truck", header: "Camion", cell: (m) => <span className="font-mono text-sm whitespace-nowrap">{lookups.truck(m.truckId)?.plate ?? "—"}</span> },
    { key: "driver", header: "Chauffeur", hideBelow: "md", cell: (m) => <span className="flex items-center gap-2"><DriverAvatar driver={lookups.driver(m.driverId)} size="xs" /> <span className="truncate">{driverName(lookups.driver(m.driverId))}</span></span> },
    { key: "from", header: "Départ", hideBelow: "lg", cell: (m) => <span className="whitespace-nowrap">{placeName(m.origin)}</span> },
    { key: "to", header: "Destination", cell: (m) => placeName(m.destination) },
    { key: "update", header: "Dernière mise à jour", hideBelow: "md", cell: (m) => <span className="text-xs whitespace-nowrap text-slate-500 tabular-nums">{formatDateTime(lastUpdate(m))}</span> },
    { key: "step", header: "Statut actuel", cell: (m) => <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", m.delayed && m.step < 6 ? "bg-amber-50 text-amber-700" : m.step >= 6 ? "bg-success-50 text-success-700" : m.step >= 2 ? "bg-brand-50 text-brand-700" : "bg-slate-100 text-slate-600")}>{OPERATION_STEPS[m.step].label}</span> },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Exploitation"
        title="Suivi des opérations"
        description="Suivi manuel des missions étape par étape (version 1). Les mises à jour sont horodatées et notifiées."
        actions={
          <span className="inline-flex items-center gap-2 rounded-full bg-success-50 px-3 py-1.5 text-xs font-medium text-success-700">
            <Radio className="size-3.5 animate-pulse" /> Suivi manuel actif
          </span>
        }
      />

      {/* Pipeline des 8 étapes */}
      <div className="scroll-thin mb-6 flex gap-2 overflow-x-auto pb-1">
        {OPERATION_STEPS.map((s) => {
          const n = missions.filter((m) => m.step === s.step).length;
          const active = stepFilter === s.step;
          return (
            <button
              key={s.step}
              onClick={() => {
                setStepFilter(active ? null : s.step);
                setFilter("toutes");
              }}
              className={cn("min-w-[132px] flex-1 rounded-2xl border bg-white p-3 text-left shadow-card transition", active ? "border-brand-600 ring-2 ring-brand-600/15" : "border-slate-200/80 hover:border-slate-300")}
            >
              <div className="flex items-center justify-between">
                <span className={cn("inline-flex size-6 items-center justify-center rounded-full text-[11px] font-semibold", s.step >= 6 ? "bg-success-50 text-success-700" : s.step >= 2 ? "bg-brand-50 text-brand-700" : "bg-slate-100 text-slate-500")}>{s.step + 1}</span>
                <span className="text-xl font-semibold tabular-nums">{n}</span>
              </div>
              <p className="mt-2 text-xs leading-tight font-medium text-slate-600">{s.label}</p>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px] xl:gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader title="Carte des opérations" subtitle="Principales zones logistiques de Djibouti et corridors routiers" icon={MapPinned} />
            <div className="px-3 pb-3">
              <DjiboutiMap missions={list.length ? list : byFilter} trucks={trucks} selectedId={selected?.id} onSelect={setSelectedId} />
            </div>
          </Card>
          <Card>
            <Toolbar>
              <Segmented
                size="sm"
                value={filter}
                onChange={(v) => {
                  setFilter(v);
                  setStepFilter(null);
                }}
                options={[
                  { value: "actives", label: "En cours", count: missions.filter((m) => m.step >= 2 && m.step <= 5).length },
                  { value: "planifiees", label: "Planifiées", count: missions.filter((m) => m.step <= 1).length },
                  { value: "terminees", label: "Terminées", count: missions.filter((m) => m.step >= 6).length },
                  { value: "toutes", label: "Toutes", count: missions.length },
                ]}
              />
              <SearchInput value={q} onChange={setQ} placeholder="Mission, camion, chauffeur…" className="sm:ml-auto sm:w-64" />
              {stepFilter !== null && (
                <Button variant="ghost" size="sm" icon={RotateCcw} onClick={() => setStepFilter(null)}>
                  Étape : {OPERATION_STEPS[stepFilter].short}
                </Button>
              )}
            </Toolbar>
            <DataTable columns={columns} rows={list} onRowClick={(m) => selectFromList(m.id)} pageSize={8} emptyTitle="Aucune opération" />
          </Card>
        </div>

        {/* Panneau de la mission sélectionnée */}
        <div ref={panelRef} className="scroll-mt-20 xl:sticky xl:top-24 xl:self-start">
          {selected ? (
            <Card className="overflow-hidden">
              <div className="border-b border-slate-100 bg-gradient-to-br from-brand-50 to-white p-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold text-slate-500">{selected.ref}</span>
                  <StatusBadge map={MISSION_STATUS} value={missionStatus(selected)} />
                </div>
                <p className="mt-2 flex items-center gap-2 text-lg font-semibold">
                  {placeName(selected.origin)} <ArrowRight className="size-4 text-slate-400" /> {placeName(selected.destination)}
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <DriverAvatar driver={lookups.driver(selected.driverId)} />
                  <div className="min-w-0 text-sm">
                    <p className="truncate font-medium">{driverName(lookups.driver(selected.driverId))}</p>
                    <p className="font-mono text-xs text-slate-500">{lookups.truck(selected.truckId)?.plate ?? "Camion à affecter"}</p>
                  </div>
                  <Button variant="ghost" size="sm" icon={Eye} className="ml-auto" onClick={() => open({ kind: "mission", id: selected.id })}>
                    Fiche
                  </Button>
                </div>
                <div className="mt-4">
                  <StepProgress step={selected.step} delayed={selected.delayed} />
                </div>
              </div>
              <div className="space-y-2 border-b border-slate-100 p-4">
                {selected.step < 7 ? (
                  <Button variant={selected.step + 1 >= 6 ? "success" : "primary"} iconRight={ChevronRight} className="w-full" onClick={() => setStep(selected, (selected.step + 1) as OperationStep)}>
                    {OPERATION_STEPS[selected.step + 1].label}
                  </Button>
                ) : (
                  <p className="rounded-lg bg-success-50 py-2.5 text-center text-sm font-medium text-success-700">Mission clôturée</p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="secondary" size="sm" icon={RotateCcw} disabled={selected.step === 0} onClick={() => setStep(selected, (selected.step - 1) as OperationStep)}>
                    Annuler l&apos;étape
                  </Button>
                  <Button variant="secondary" size="sm" icon={AlertTriangle} disabled={selected.step >= 6} onClick={() => setIncident(selected.id)}>
                    Incident / retard
                  </Button>
                </div>
              </div>
              <div className="scroll-thin max-h-[520px] overflow-y-auto p-5">
                <OperationTimeline mission={selected} />
              </div>
            </Card>
          ) : (
            <Card>
              <EmptyState icon={MapPinned} title="Aucune mission sélectionnée" message="Sélectionnez une mission dans la liste ou sur la carte." />
            </Card>
          )}
        </div>
      </div>
      <AssignModal open={!!assign} mission={assign} onClose={() => setAssign(undefined)} />
      <IncidentFormModal open={!!incident} missionId={incident ?? undefined} onClose={() => setIncident(null)} reportedBy={actor} />
    </div>
  );
}

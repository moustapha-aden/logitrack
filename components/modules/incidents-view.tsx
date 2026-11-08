"use client";

import { useState } from "react";
import { AlertOctagon, AlertTriangle, CheckCircle2, Clock, Eye, Loader, Plus, Timer, Trash2, Wrench } from "lucide-react";
import { actions } from "@/lib/store";
import { useData } from "@/lib/store/selectors";
import { INCIDENT_STATUS, INCIDENT_TYPES, SEVERITY } from "@/lib/constants";
import { driverName, formatDateTime, includesText } from "@/lib/utils";
import type { Incident, IncidentStatus, IncidentType, Severity } from "@/types";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, StatCard } from "@/components/ui/card";
import { ActionMenu } from "@/components/ui/dropdown";
import { DriverAvatar } from "@/components/ui/media";
import { ConfirmDialog } from "@/components/ui/modal";
import { FilterSelect, LinkButton, PageHeader, SearchInput, Segmented, Toolbar } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { DataTable, type Column } from "@/components/tables/data-table";
import { IncidentFormModal } from "@/components/forms/incident-form";
import { useDetail } from "@/components/details/detail-provider";

const typeIcon: Record<IncidentType, typeof Wrench> = { panne: Wrench, accident: AlertOctagon, retard: Clock, administratif: AlertTriangle, chargement: AlertTriangle, autre: AlertTriangle };

export function IncidentsView() {
  const { incidents, lookups, scope } = useData();
  const { open } = useDetail();
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<IncidentStatus | "all">("all");
  const [type, setType] = useState<IncidentType | "all">("all");
  const [severity, setSeverity] = useState<Severity | "all">("all");
  const [declare, setDeclare] = useState<IncidentType | null>(null);
  const [del, setDel] = useState<Incident | null>(null);

  const filtered = incidents
    .filter((i) => (type === "all" || i.type === type) && (severity === "all" || i.severity === severity) && includesText([i.ref, i.description, i.location, lookups.mission(i.missionId)?.ref, driverName(lookups.driver(i.driverId))], q))
    .sort((a, b) => b.date.localeCompare(a.date));
  const rows = status === "all" ? filtered : filtered.filter((i) => i.status === status);
  const count = (s: IncidentStatus) => filtered.filter((i) => i.status === s).length;
  const totalDelay = incidents.filter((i) => i.status !== "resolu").reduce((s, i) => s + (i.delayMinutes ?? 0), 0);

  const setIncStatus = (i: Incident, s: IncidentStatus) => {
    actions.setIncidentStatus(i.id, s);
    toast("Statut mis à jour", { message: `${i.ref} : ${INCIDENT_STATUS[s].label}`, tone: s === "resolu" ? "success" : "info" });
  };

  const columns: Column<Incident>[] = [
    {
      key: "ref",
      header: "Incident",
      cell: (i) => {
        const Icon = typeIcon[i.type];
        return (
          <div className="flex items-center gap-3">
            <span className={`inline-flex size-9 shrink-0 items-center justify-center rounded-xl ${i.severity === "critique" ? "bg-red-50 text-red-500" : i.severity === "elevee" ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-500"}`}>
              <Icon className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="font-medium text-ink">{INCIDENT_TYPES[i.type]}</p>
              <p className="font-mono text-xs text-slate-500">{i.ref}</p>
            </div>
          </div>
        );
      },
    },
    { key: "mission", header: "Mission", cell: (i) => <LinkButton className="font-mono text-xs" onClick={() => open({ kind: "mission", id: i.missionId })}>{lookups.mission(i.missionId)?.ref ?? "—"}</LinkButton> },
    { key: "desc", header: "Description", hideBelow: "lg", cell: (i) => <p className="line-clamp-2 max-w-xs text-xs text-slate-600">{i.description}</p> },
    { key: "date", header: "Date", hideBelow: "md", cell: (i) => <span className="text-xs whitespace-nowrap text-slate-600 tabular-nums">{formatDateTime(i.date)}</span> },
    { key: "driver", header: "Chauffeur", hideBelow: "xl", cell: (i) => <span className="flex items-center gap-2"><DriverAvatar driver={lookups.driver(i.driverId)} size="xs" /> <span className="truncate">{driverName(lookups.driver(i.driverId))}</span></span> },
    { key: "severity", header: "Gravité", cell: (i) => <StatusBadge map={SEVERITY} value={i.severity} /> },
    { key: "status", header: "Résolution", cell: (i) => <StatusBadge map={INCIDENT_STATUS} value={i.status} /> },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (i) => (
        <ActionMenu
          items={[
            { label: "Voir le détail", icon: Eye, onClick: () => open({ kind: "incident", id: i.id }) },
            i.status === "nouveau" && { label: "Prendre en charge", icon: Loader, onClick: () => setIncStatus(i, "en_cours") },
            i.status !== "resolu" && { label: "Marquer comme résolu", icon: CheckCircle2, onClick: () => setIncStatus(i, "resolu") },
            i.status === "resolu" && { label: "Rouvrir", icon: AlertTriangle, onClick: () => setIncStatus(i, "en_cours") },
            { label: "Supprimer", icon: Trash2, danger: true, onClick: () => setDel(i) },
          ]}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Exploitation"
        title="Incidents et retards"
        description={scope ? "Déclarez et suivez les incidents survenus sur vos missions." : "Centralisez les déclarations d'incidents et de retards, et suivez leur résolution."}
        actions={
          <>
            <Button variant="secondary" icon={Clock} onClick={() => setDeclare("retard")}>
              Signaler un retard
            </Button>
            <Button variant="danger" icon={Plus} onClick={() => setDeclare("panne")}>
              Déclarer un incident
            </Button>
          </>
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Nouveaux" value={incidents.filter((i) => i.status === "nouveau").length} icon={AlertTriangle} tone="red" onClick={() => setStatus("nouveau")} />
        <StatCard label="En cours de traitement" value={incidents.filter((i) => i.status === "en_cours").length} icon={Loader} tone="orange" onClick={() => setStatus("en_cours")} />
        <StatCard label="Résolus" value={incidents.filter((i) => i.status === "resolu").length} icon={CheckCircle2} tone="green" onClick={() => setStatus("resolu")} />
        <StatCard label="Retard cumulé (ouverts)" value={`${Math.floor(totalDelay / 60)} h ${String(totalDelay % 60).padStart(2, "0")}`} icon={Timer} tone="navy" />
      </div>
      <div className="mb-4">
        <Segmented
          value={status}
          onChange={setStatus}
          options={[
            { value: "all", label: "Tous", count: filtered.length },
            { value: "nouveau", label: "Nouveaux", count: count("nouveau") },
            { value: "en_cours", label: "En cours", count: count("en_cours") },
            { value: "resolu", label: "Résolus", count: count("resolu") },
          ]}
        />
      </div>
      <Card>
        <Toolbar>
          <SearchInput value={q} onChange={setQ} placeholder="Référence, mission, lieu, chauffeur…" className="sm:w-72" />
          <FilterSelect label="Type" value={type} onChange={setType} options={[{ value: "all", label: "Tous les types" }, ...Object.entries(INCIDENT_TYPES).map(([k, l]) => ({ value: k as IncidentType, label: l }))]} />
          <FilterSelect label="Gravité" value={severity} onChange={setSeverity} options={[{ value: "all", label: "Toutes gravités" }, ...Object.entries(SEVERITY).map(([k, m]) => ({ value: k as Severity, label: m.label }))]} />
        </Toolbar>
        <DataTable columns={columns} rows={rows} onRowClick={(i) => open({ kind: "incident", id: i.id })} emptyTitle="Aucun incident" emptyMessage="Aucun incident ne correspond à ces critères." />
      </Card>
      <IncidentFormModal open={!!declare} type={declare ?? undefined} onClose={() => setDeclare(null)} reportedBy={scope ? `Exploitation ${lookups.company(scope)?.initials ?? ""}` : undefined} />
      <ConfirmDialog
        open={!!del}
        onClose={() => setDel(null)}
        title="Supprimer cet incident ?"
        message={del ? `L'incident ${del.ref} sera supprimé définitivement.` : ""}
        confirmLabel="Supprimer"
        onConfirm={() => {
          if (!del) return;
          actions.deleteIncident(del.id);
          toast("Incident supprimé", { message: del.ref, tone: "info" });
        }}
      />
    </div>
  );
}

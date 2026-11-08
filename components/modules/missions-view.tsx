"use client";

import { useState } from "react";
import { ArrowRight, ChevronRight, Download, Eye, Pencil, Plus, UserCheck } from "lucide-react";
import { actions, useAppData } from "@/lib/store";
import { useData } from "@/lib/store/selectors";
import { GOODS_TYPES, MISSION_STATUS, OPERATION_STEPS } from "@/lib/constants";
import { placeName } from "@/lib/data/geo";
import { driverName, formatDate, formatDateShort, formatDjf, formatTime, includesText, missionStatus } from "@/lib/utils";
import type { Mission, MissionStatus } from "@/types";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ActionMenu } from "@/components/ui/dropdown";
import { Input } from "@/components/ui/form";
import { CompanyLogo, DriverAvatar } from "@/components/ui/media";
import { FilterSelect, PageHeader, SearchInput, Segmented, Toolbar } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { DataTable, type Column } from "@/components/tables/data-table";
import { AssignModal } from "@/components/forms/assign-form";
import { MissionFormModal } from "@/components/forms/mission-form";
import { useDetail } from "@/components/details/detail-provider";
import { StepProgress } from "@/components/operations/timeline";

export function MissionsView({ mode = "all" }: { mode?: "all" | "history" }) {
  const { missions, lookups, scope, all } = useData();
  const raw = useAppData();
  const { open } = useDetail();
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<MissionStatus | "all">("all");
  const [company, setCompany] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [form, setForm] = useState<{ open: boolean; mission?: Mission }>({ open: false });
  const [assign, setAssign] = useState<Mission | undefined>();

  const base = mode === "history" ? missions.filter((m) => m.step >= 6) : missions;
  const filtered = base
    .filter((m) => (company === "all" || m.companyId === company) && (!from || m.plannedDeparture.slice(0, 10) >= from) && (!to || m.plannedDeparture.slice(0, 10) <= to))
    .filter((m) => includesText([m.ref, placeName(m.origin), placeName(m.destination), m.description, lookups.company(m.clientId)?.name, lookups.truck(m.truckId)?.plate, driverName(lookups.driver(m.driverId))], q))
    .sort((a, b) => (mode === "history" ? b.plannedDeparture.localeCompare(a.plannedDeparture) : a.step === b.step ? a.plannedDeparture.localeCompare(b.plannedDeparture) : (a.step >= 6 ? 1 : 0) - (b.step >= 6 ? 1 : 0) || b.plannedDeparture.localeCompare(a.plannedDeparture)));
  const rows = tab === "all" ? filtered : filtered.filter((m) => missionStatus(m) === tab);
  const owners = all.companies.filter((c) => c.type !== "client");
  const countOf = (s: MissionStatus) => filtered.filter((m) => missionStatus(m) === s).length;
  const actor = scope ? `Exploitation ${lookups.company(scope)?.initials ?? ""}` : raw.settings.userName;

  const exportCsv = () => {
    const header = ["Référence", "Entreprise", "Client", "Départ", "Destination", "Date départ", "Camion", "Chauffeur", "Statut", "Tarif DJF"];
    const lines = rows.map((m) => [m.ref, lookups.company(m.companyId)?.name, lookups.company(m.clientId)?.name, placeName(m.origin), placeName(m.destination), formatDate(m.plannedDeparture), lookups.truck(m.truckId)?.plate ?? "", driverName(lookups.driver(m.driverId)), MISSION_STATUS[missionStatus(m)].label, m.priceDjf]);
    const csv = [header, ...lines].map((l) => l.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `logitrack-missions-${mode}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Export CSV généré", { message: `${rows.length} missions exportées` });
  };

  const advance = (m: Mission) => {
    if (m.step >= 7) return;
    const next = (m.step + 1) as Mission["step"];
    if (next >= 2 && (!m.truckId || !m.driverId)) {
      toast("Affectation requise", { message: "Affectez un camion et un chauffeur avant de démarrer.", tone: "warning" });
      setAssign(m);
      return;
    }
    actions.setMissionStep(m.id, next, actor);
    toast("Statut mis à jour", { message: `${m.ref} : ${OPERATION_STEPS[next].label}` });
  };

  const columns: Column<Mission>[] = [
    {
      key: "ref",
      header: "Mission",
      cell: (m) => (
        <div className="min-w-0">
          <p className="font-mono text-xs font-semibold text-slate-500">{m.ref}</p>
          <p className="flex items-center gap-1 font-medium whitespace-nowrap text-ink">
            {placeName(m.origin)} <ArrowRight className="size-3.5 text-slate-400" /> {placeName(m.destination)}
          </p>
          <p className="max-w-56 truncate text-xs text-slate-500">{GOODS_TYPES[m.goodsType]}</p>
        </div>
      ),
    },
    ...(!scope ? [{ key: "company", header: "Entreprise", hideBelow: "xl" as const, cell: (m: Mission) => <span className="flex items-center gap-2"><CompanyLogo company={lookups.company(m.companyId)} size="xs" /><span className="max-w-36 truncate">{lookups.company(m.companyId)?.name}</span></span> }] : []),
    { key: "client", header: "Client", hideBelow: "lg", cell: (m) => <span className="block max-w-40 truncate text-slate-700">{lookups.company(m.clientId)?.name}</span> },
    {
      key: "resources",
      header: "Camion / Chauffeur",
      hideBelow: "md",
      cell: (m) => {
        const d = lookups.driver(m.driverId);
        const t = lookups.truck(m.truckId);
        if (!t && !d) return <Badge tone="red">À affecter</Badge>;
        return (
          <span className="flex items-center gap-2">
            <DriverAvatar driver={d} size="xs" />
            <span className="min-w-0">
              <span className="block truncate text-sm">{driverName(d)}</span>
              <span className="block font-mono text-xs text-slate-500">{t?.plate ?? "camion à affecter"}</span>
            </span>
          </span>
        );
      },
    },
    { key: "date", header: "Départ prévu", cell: (m) => <span className="whitespace-nowrap"><span className="block text-sm">{formatDateShort(m.plannedDeparture)}</span><span className="text-xs text-slate-500">{formatTime(m.plannedDeparture)}</span></span> },
    { key: "progress", header: "Avancement", hideBelow: "lg", cell: (m) => <div className="w-32"><StepProgress step={m.step} delayed={m.delayed} /><p className="mt-1 truncate text-[11px] text-slate-500">{OPERATION_STEPS[m.step].label}</p></div> },
    { key: "price", header: "Tarif", hideBelow: "xl", align: "right", cell: (m) => <span className="whitespace-nowrap tabular-nums">{formatDjf(m.priceDjf)}</span> },
    { key: "status", header: "Statut", cell: (m) => <StatusBadge map={MISSION_STATUS} value={missionStatus(m)} /> },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (m) => (
        <ActionMenu
          items={[
            { label: "Voir les détails", icon: Eye, onClick: () => open({ kind: "mission", id: m.id }) },
            { label: "Modifier", icon: Pencil, onClick: () => setForm({ open: true, mission: m }) },
            m.step < 6 && { label: "Affecter camion / chauffeur", icon: UserCheck, onClick: () => setAssign(m) },
            m.step < 7 && { label: `Étape suivante : ${OPERATION_STEPS[m.step + 1]?.short}`, icon: ChevronRight, onClick: () => advance(m) },
          ]}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow={mode === "history" ? "Analyse" : "Exploitation"}
        title={mode === "history" ? "Historique des missions" : "Missions"}
        description={mode === "history" ? "Missions livrées et clôturées, avec export des données." : "Planifiez, affectez et suivez l'ensemble des missions de transport."}
        actions={
          <>
            <Button variant="secondary" icon={Download} onClick={exportCsv}>
              Exporter
            </Button>
            {mode === "all" && (
              <Button icon={Plus} onClick={() => setForm({ open: true })}>
                Créer une mission
              </Button>
            )}
          </>
        }
      />
      {mode === "all" && (
        <div className="mb-4">
          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              { value: "all", label: "Toutes", count: filtered.length },
              { value: "planifiee", label: "Planifiées", count: countOf("planifiee") },
              { value: "en_cours", label: "En cours", count: countOf("en_cours") },
              { value: "en_retard", label: "En retard", count: countOf("en_retard") },
              { value: "terminee", label: "Terminées", count: countOf("terminee") },
            ]}
          />
        </div>
      )}
      <Card>
        <Toolbar>
          <SearchInput value={q} onChange={setQ} placeholder="Référence, lieu, client, camion…" className="sm:w-72" />
          {!scope && <FilterSelect label="Entreprise" value={company} onChange={setCompany} options={[{ value: "all", label: "Toutes les entreprises" }, ...owners.map((c) => ({ value: c.id, label: c.name }))]} />}
          <div className="flex items-center gap-2">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="Date de début" className="w-auto" />
            <span className="text-xs text-slate-400">au</span>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="Date de fin" className="w-auto" />
          </div>
          {(q || from || to || company !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQ("");
                setFrom("");
                setTo("");
                setCompany("all");
              }}
            >
              Réinitialiser
            </Button>
          )}
        </Toolbar>
        <DataTable columns={columns} rows={rows} onRowClick={(m) => open({ kind: "mission", id: m.id })} emptyTitle="Aucune mission trouvée" />
      </Card>
      <MissionFormModal open={form.open} mission={form.mission} onClose={() => setForm({ open: false })} />
      <AssignModal open={!!assign} mission={assign} onClose={() => setAssign(undefined)} />
    </div>
  );
}

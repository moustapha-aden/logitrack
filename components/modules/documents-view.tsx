"use client";

import { useState } from "react";
import { BellRing, Eye, FileClock, FileText, FileWarning, Lock, ShieldCheck, XCircle } from "lucide-react";
import { actions } from "@/lib/store";
import { useData, usePermissions } from "@/lib/store/selectors";
import { DOC_CATEGORIES, DOC_PARTIES, DOC_STATUS, DOC_TYPES, OPERATION_STEPS } from "@/lib/constants";
import { formatDateTime, includesText } from "@/lib/utils";
import { isBlockingOpen, isCleared, isMissing, isOverdue, isToReview } from "@/lib/utils/documents";
import type { DocCategory, DocParty, MissionDocument } from "@/types";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Card, StatCard } from "@/components/ui/card";
import { ActionMenu, type MenuItem } from "@/components/ui/dropdown";
import { CorrectionModal, DocPrimaryActions, useDocUpload } from "@/components/documents/mission-documents";
import { FilterSelect, LinkButton, PageHeader, SearchInput, Segmented, Toolbar } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { DataTable, type Column } from "@/components/tables/data-table";
import { useDetail } from "@/components/details/detail-provider";

type Tab = "a_traiter" | "bloquantes" | "a_verifier" | "en_retard" | "all";

export function DocumentsView() {
  const { documents, lookups, scope } = useData();
  const { can, actor } = usePermissions();
  const { open } = useDetail();
  const { upload, ui } = useDocUpload(actor);
  const [correction, setCorrection] = useState<MissionDocument | null>(null);
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("a_traiter");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<DocCategory | "all">("all");
  const [party, setParty] = useState<DocParty | "all">("all");

  // Missions clôturées exclues : on ne pilote que les dossiers ouverts.
  // La preuve de livraison n'est attendue qu'à partir de l'arrivée à destination.
  const openDocs = documents.filter((d) => {
    const step = lookups.mission(d.missionId)?.step ?? 7;
    return step < 7 && !(d.type === "pod" && step < 5);
  });
  const filtered = openDocs.filter((d) => {
    const m = lookups.mission(d.missionId);
    return (category === "all" || DOC_TYPES[d.type].category === category) && (party === "all" || d.responsible === party) && includesText([DOC_TYPES[d.type].label, m?.ref, lookups.company(m?.clientId)?.name, d.versions.at(-1)?.fileName], q);
  });
  const blocksOpen = (d: MissionDocument) => isBlockingOpen(d, lookups.mission(d.missionId)?.step ?? 7);
  const byTab: Record<Tab, (d: MissionDocument) => boolean> = {
    a_traiter: (d) => isMissing(d) || isToReview(d),
    bloquantes: blocksOpen,
    a_verifier: isToReview,
    en_retard: (d) => isOverdue(d),
    all: () => true,
  };
  const rows = filtered.filter(byTab[tab]).sort((a, b) => Number(isOverdue(b)) - Number(isOverdue(a)) || (a.dueAt ?? "").localeCompare(b.dueAt ?? ""));
  const blocking = openDocs.filter(blocksOpen);

  const columns: Column<MissionDocument>[] = [
    {
      key: "doc",
      header: "Pièce",
      cell: (d) => (
        <div className="flex items-center gap-3">
          <span className={`inline-flex size-9 shrink-0 items-center justify-center rounded-xl ${isOverdue(d) || d.status === "a_corriger" ? "bg-red-50 text-red-500" : isCleared(d) ? "bg-success-50 text-success-600" : "bg-slate-100 text-slate-500"}`}>
            <FileText className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="font-medium text-ink">{DOC_TYPES[d.type].label}</p>
            <p className="text-xs text-slate-500">{DOC_CATEGORIES[DOC_TYPES[d.type].category]}</p>
          </div>
        </div>
      ),
    },
    {
      key: "mission",
      header: "Mission",
      cell: (d) => (
        <LinkButton className="font-mono text-xs" onClick={() => open({ kind: "mission", id: d.missionId })}>
          {lookups.mission(d.missionId)?.ref ?? "—"}
        </LinkButton>
      ),
    },
    { key: "client", header: "Client", hideBelow: "xl", cell: (d) => <span className="truncate text-xs text-slate-600">{lookups.company(lookups.mission(d.missionId)?.clientId)?.name ?? "—"}</span> },
    { key: "resp", header: "Responsable", hideBelow: "lg", cell: (d) => <span className="text-xs text-slate-600">{DOC_PARTIES[d.responsible]}</span> },
    {
      key: "due",
      header: "Échéance",
      hideBelow: "md",
      cell: (d) =>
        isCleared(d) || !d.dueAt ? (
          <span className="text-xs text-slate-400">—</span>
        ) : (
          <span className={`text-xs whitespace-nowrap tabular-nums ${isOverdue(d) ? "font-medium text-red-600" : "text-slate-600"}`}>{formatDateTime(d.dueAt)}</span>
        ),
    },
    {
      key: "status",
      header: "Statut",
      cell: (d) => {
        const m = lookups.mission(d.missionId);
        const blocks = m && d.blocksStep !== null && d.blocksStep > m.step && !isCleared(d);
        return (
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge map={DOC_STATUS} value={d.status} />
            {isOverdue(d) && <Badge tone="red">En retard</Badge>}
            {blocks && (
              <span className="inline-flex items-center gap-1 text-[11px] text-amber-700" title={`Bloque « ${OPERATION_STEPS[d.blocksStep!].label} »`}>
                <Lock className="size-3" /> {OPERATION_STEPS[d.blocksStep!].short}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (d) => {
        const items = [
          { label: "Ouvrir la mission", icon: Eye, onClick: () => open({ kind: "mission", id: d.missionId }) },
          can("document.upload") && d.versions.length > 0 && { label: "Déposer une nouvelle version", icon: FileText, onClick: () => upload(d, false) },
          can("document.review") && d.versions.length > 0 && d.status !== "a_corriger" && { label: "Demander une correction", icon: XCircle, onClick: () => setCorrection(d) },
          can("document.review") && isMissing(d) && {
            label: `Relancer (${DOC_PARTIES[d.responsible].toLowerCase()})`,
            icon: BellRing,
            onClick: () => {
              actions.requestDocument(d.id);
              toast("Relance enregistrée", { message: DOC_TYPES[d.type].label });
            },
          },
        ].filter(Boolean) as MenuItem[];
        // les boutons ne doivent pas ouvrir la fiche (clic sur la ligne)
        return (
          <div className="flex flex-wrap items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
            <DocPrimaryActions doc={d} canUpload={can("document.upload")} canReview={can("document.review")} onUpload={(v) => upload(d, v)} />
            <ActionMenu items={items} />
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Exploitation"
        title="Documents de transit"
        description={scope ? "Pièces attendues, reçues et à vérifier sur vos missions en cours." : "Suivi des pièces de toutes les missions ouvertes de la plateforme."}
      />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Pièces manquantes" value={openDocs.filter(isMissing).length} icon={FileClock} tone="orange" onClick={() => setTab("a_traiter")} />
        <StatCard label="En retard" value={openDocs.filter((d) => isOverdue(d)).length} icon={FileWarning} tone="red" onClick={() => setTab("en_retard")} />
        <StatCard label="À vérifier" value={openDocs.filter(isToReview).length} icon={ShieldCheck} tone="blue" onClick={() => setTab("a_verifier")} />
        <StatCard label="Pièces bloquantes" value={blocking.length} icon={Lock} tone="navy" hint="empêchent une étape à venir" onClick={() => setTab("bloquantes")} />
      </div>
      <div className="mb-4">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: "a_traiter", label: "À traiter", count: filtered.filter(byTab.a_traiter).length },
            { value: "bloquantes", label: "Bloquantes", count: filtered.filter(byTab.bloquantes).length },
            { value: "en_retard", label: "En retard", count: filtered.filter(byTab.en_retard).length },
            { value: "a_verifier", label: "À vérifier", count: filtered.filter(byTab.a_verifier).length },
            { value: "all", label: "Toutes", count: filtered.length },
          ]}
        />
      </div>
      <Card>
        <Toolbar>
          <SearchInput value={q} onChange={setQ} placeholder="Pièce, mission, client, fichier…" className="sm:w-72" />
          <FilterSelect label="Catégorie" value={category} onChange={setCategory} options={[{ value: "all", label: "Toutes catégories" }, ...Object.entries(DOC_CATEGORIES).map(([k, l]) => ({ value: k as DocCategory, label: l }))]} />
          <FilterSelect label="Responsable" value={party} onChange={setParty} options={[{ value: "all", label: "Tous responsables" }, ...Object.entries(DOC_PARTIES).map(([k, l]) => ({ value: k as DocParty, label: l }))]} />
        </Toolbar>
        <DataTable columns={columns} rows={rows} onRowClick={(d) => open({ kind: "mission", id: d.missionId })} emptyTitle="Aucune pièce" emptyMessage="Aucune pièce ne correspond à ces critères." />
      </Card>
      {ui}
      <CorrectionModal doc={correction} onClose={() => setCorrection(null)} />
    </div>
  );
}

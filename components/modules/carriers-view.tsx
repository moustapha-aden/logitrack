"use client";

import { useState } from "react";
import { Eye, Handshake, Pencil, Plus, Trash2 } from "lucide-react";
import { actions } from "@/lib/store";
import { useData } from "@/lib/store/selectors";
import { CARRIER_STATUS } from "@/lib/constants";
import { includesText, isActiveMission } from "@/lib/utils";
import type { Carrier, CarrierStatus } from "@/types";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ActionMenu } from "@/components/ui/dropdown";
import { CompanyLogo } from "@/components/ui/media";
import { ConfirmDialog } from "@/components/ui/modal";
import { FilterSelect, PageHeader, SearchInput, Toolbar } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { DataTable, type Column } from "@/components/tables/data-table";
import { CarrierFormModal } from "@/components/forms/carrier-form";
import { useDetail } from "@/components/details/detail-provider";

/** Liste des transporteurs partenaires (utilisable seule ou intégrée). */
export function CarriersTable({ embedded }: { embedded?: boolean }) {
  const { carriers, missions, lookups, scope, all } = useData();
  const { open } = useDetail();
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [company, setCompany] = useState("all");
  const [status, setStatus] = useState<CarrierStatus | "all">("all");
  const [form, setForm] = useState<{ open: boolean; carrier?: Carrier }>({ open: false });
  const [del, setDel] = useState<Carrier | null>(null);

  const rows = carriers.filter((c) => (company === "all" || c.companyId === company) && (status === "all" || c.status === status) && includesText([c.name, c.manager, c.email, c.phone, c.city], q));
  const owners = all.companies.filter((c) => c.type !== "client");

  const columns: Column<Carrier>[] = [
    {
      key: "name",
      header: "Transporteur",
      cell: (c) => (
        <div className="flex items-center gap-3">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-navy-900/5 text-navy-900">
            <Handshake className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{c.name}</p>
            <p className="text-xs text-slate-500">{c.city} · {c.fleetSize} véhicules</p>
          </div>
        </div>
      ),
    },
    { key: "manager", header: "Responsable", cell: (c) => c.manager },
    { key: "phone", header: "Téléphone", hideBelow: "md", cell: (c) => <span className="whitespace-nowrap tabular-nums">{c.phone}</span> },
    { key: "email", header: "E-mail", hideBelow: "lg", cell: (c) => <span className="text-slate-600">{c.email}</span> },
    ...(!scope
      ? [
          {
            key: "company",
            header: "Entreprise",
            hideBelow: "md" as const,
            cell: (c: Carrier) => {
              const co = lookups.company(c.companyId);
              return (
                <span className="flex items-center gap-2">
                  <CompanyLogo company={co} size="xs" />
                  <span className="truncate">{co?.name}</span>
                </span>
              );
            },
          },
        ]
      : []),
    { key: "missions", header: "Missions", align: "center", cell: (c) => {
        const ms = missions.filter((m) => m.carrierId === c.id);
        return <span className="tabular-nums"><strong>{ms.length}</strong>{ms.some(isActiveMission) && <span className="ml-1 text-xs text-brand-600">· en cours</span>}</span>;
      } },
    { key: "status", header: "Statut", cell: (c) => <StatusBadge map={CARRIER_STATUS} value={c.status} /> },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (c) => (
        <ActionMenu
          items={[
            { label: "Voir la fiche", icon: Eye, onClick: () => open({ kind: "carrier", id: c.id }) },
            { label: "Modifier", icon: Pencil, onClick: () => setForm({ open: true, carrier: c }) },
            { label: "Supprimer", icon: Trash2, danger: true, onClick: () => setDel(c) },
          ]}
        />
      ),
    },
  ];

  return (
    <>
      <Card>
        <Toolbar>
          <SearchInput value={q} onChange={setQ} placeholder="Rechercher un transporteur…" className="sm:w-72" />
          {!scope && <FilterSelect label="Entreprise" value={company} onChange={setCompany} options={[{ value: "all", label: "Toutes les entreprises" }, ...owners.map((c) => ({ value: c.id, label: c.name }))]} />}
          <FilterSelect label="Statut" value={status} onChange={setStatus} options={[{ value: "all", label: "Tous les statuts" }, ...Object.entries(CARRIER_STATUS).map(([k, m]) => ({ value: k as CarrierStatus, label: m.label }))]} />
          {embedded && (
            <Button icon={Plus} className="sm:ml-auto" onClick={() => setForm({ open: true })}>
              Ajouter un transporteur
            </Button>
          )}
        </Toolbar>
        <DataTable columns={columns} rows={rows} onRowClick={(c) => open({ kind: "carrier", id: c.id })} emptyTitle="Aucun transporteur" />
      </Card>
      <CarrierFormModal open={form.open} carrier={form.carrier} onClose={() => setForm({ open: false })} />
      <ConfirmDialog
        open={!!del}
        onClose={() => setDel(null)}
        title="Supprimer ce transporteur ?"
        message={del ? `${del.name} sera retiré de la plateforme. Les missions associées seront conservées.` : ""}
        confirmLabel="Supprimer"
        onConfirm={() => {
          if (!del) return;
          actions.deleteCarrier(del.id);
          toast("Transporteur supprimé", { message: del.name, tone: "info" });
        }}
      />
    </>
  );
}

export function CarriersView() {
  const [create, setCreate] = useState(false);
  return (
    <div>
      <PageHeader
        eyebrow="Référentiels"
        title="Transporteurs"
        description="Transporteurs partenaires et sous-traitants autorisés à opérer pour le compte des entreprises."
        actions={
          <Button icon={Plus} onClick={() => setCreate(true)}>
            Ajouter un transporteur
          </Button>
        }
      />
      <CarriersTable />
      <CarrierFormModal open={create} onClose={() => setCreate(false)} />
    </div>
  );
}

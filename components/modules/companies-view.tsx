"use client";

import { useState } from "react";
import { Building2, CheckCircle2, Eye, LayoutGrid, List, Mail, MapPin, Pencil, Phone, Plus, Power, Truck } from "lucide-react";
import { actions } from "@/lib/store";
import { useData } from "@/lib/store/selectors";
import { ACTIVE_STATUS, COMPANY_TYPES } from "@/lib/constants";
import { cn, includesText } from "@/lib/utils";
import type { Company, CompanyType } from "@/types";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, StatCard } from "@/components/ui/card";
import { ActionMenu } from "@/components/ui/dropdown";
import { CompanyLogo } from "@/components/ui/media";
import { ConfirmDialog } from "@/components/ui/modal";
import { EmptyState, FilterSelect, PageHeader, SearchInput, Toolbar } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { DataTable, type Column } from "@/components/tables/data-table";
import { CompanyFormModal } from "@/components/forms/company-form";
import { useDetail } from "@/components/details/detail-provider";

export function CompaniesView() {
  const { companies, trucks, missions } = useData();
  const { open } = useDetail();
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [type, setType] = useState<CompanyType | "all">("all");
  const [status, setStatus] = useState<"all" | "actif" | "inactif">("all");
  const [view, setView] = useState<"table" | "grid">("table");
  const [form, setForm] = useState<{ open: boolean; company?: Company }>({ open: false });
  const [toggle, setToggle] = useState<Company | null>(null);

  const truckCount = (id: string) => trucks.filter((t) => t.companyId === id).length;
  const rows = companies.filter((c) => (type === "all" || c.type === type) && (status === "all" || c.status === status) && includesText([c.name, c.manager, c.email, c.address, c.city], q));

  const columns: Column<Company>[] = [
    {
      key: "name",
      header: "Entreprise",
      cell: (c) => (
        <div className="flex items-center gap-3">
          <CompanyLogo company={c} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{c.name}</p>
            <p className="truncate text-xs text-slate-500">{c.email}</p>
          </div>
        </div>
      ),
    },
    { key: "type", header: "Type", cell: (c) => <StatusBadge map={COMPANY_TYPES} value={c.type} /> },
    { key: "manager", header: "Responsable", hideBelow: "md", cell: (c) => <span className="text-slate-700">{c.manager}</span> },
    { key: "phone", header: "Téléphone", hideBelow: "lg", cell: (c) => <span className="whitespace-nowrap text-slate-600 tabular-nums">{c.phone}</span> },
    { key: "address", header: "Adresse", hideBelow: "xl", cell: (c) => <span className="text-slate-600">{c.address}, {c.city}</span> },
    { key: "trucks", header: "Camions", align: "center", cell: (c) => <span className="font-semibold tabular-nums">{c.type === "client" ? "—" : truckCount(c.id)}</span> },
    { key: "status", header: "Statut", cell: (c) => <StatusBadge map={ACTIVE_STATUS} value={c.status} /> },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (c) => (
        <ActionMenu
          items={[
            { label: "Voir la fiche", icon: Eye, onClick: () => open({ kind: "company", id: c.id }) },
            { label: "Modifier", icon: Pencil, onClick: () => setForm({ open: true, company: c }) },
            { label: c.status === "actif" ? "Désactiver" : "Activer", icon: Power, danger: c.status === "actif", onClick: () => setToggle(c) },
          ]}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Référentiels"
        title="Entreprises"
        description="Transporteurs, transitaires, opérateurs logistiques et clients chargeurs inscrits sur la plateforme."
        actions={
          <Button icon={Plus} onClick={() => setForm({ open: true })}>
            Ajouter une entreprise
          </Button>
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Entreprises inscrites" value={companies.length} icon={Building2} tone="navy" />
        <StatCard label="Actives" value={companies.filter((c) => c.status === "actif").length} icon={CheckCircle2} tone="green" />
        <StatCard label="Transporteurs & logisticiens" value={companies.filter((c) => c.type === "transport" || c.type === "logistique").length} icon={Truck} tone="blue" />
        <StatCard label="Missions générées" value={missions.length} icon={MapPin} tone="violet" />
      </div>
      <Card>
        <Toolbar>
          <SearchInput value={q} onChange={setQ} placeholder="Rechercher une entreprise, un responsable…" className="sm:w-80" />
          <FilterSelect label="Type" value={type} onChange={setType} options={[{ value: "all", label: "Tous les types" }, ...Object.entries(COMPANY_TYPES).map(([k, m]) => ({ value: k as CompanyType, label: m.label }))]} />
          <FilterSelect label="Statut" value={status} onChange={setStatus} options={[{ value: "all", label: "Tous les statuts" }, { value: "actif", label: "Actives" }, { value: "inactif", label: "Inactives" }]} />
          <div className="flex gap-1 sm:ml-auto">
            <button onClick={() => setView("table")} className={cn("rounded-lg p-2", view === "table" ? "bg-slate-100 text-ink" : "text-slate-400 hover:text-ink")} aria-label="Vue tableau">
              <List className="size-4" />
            </button>
            <button onClick={() => setView("grid")} className={cn("rounded-lg p-2", view === "grid" ? "bg-slate-100 text-ink" : "text-slate-400 hover:text-ink")} aria-label="Vue cartes">
              <LayoutGrid className="size-4" />
            </button>
          </div>
        </Toolbar>
        {view === "table" ? (
          <DataTable columns={columns} rows={rows} onRowClick={(c) => open({ kind: "company", id: c.id })} />
        ) : rows.length === 0 ? (
          <EmptyState title="Aucune entreprise" message="Modifiez vos filtres." />
        ) : (
          <div className="grid gap-4 border-t border-slate-100 p-4 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((c) => (
              <button key={c.id} onClick={() => open({ kind: "company", id: c.id })} className="rounded-2xl border border-slate-200 p-5 text-left transition hover:-translate-y-0.5 hover:shadow-pop">
                <div className="flex items-start justify-between">
                  <CompanyLogo company={c} size="lg" />
                  <StatusBadge map={ACTIVE_STATUS} value={c.status} />
                </div>
                <p className="mt-4 font-semibold text-ink">{c.name}</p>
                <StatusBadge map={COMPANY_TYPES} value={c.type} className="mt-1.5" />
                <div className="mt-4 space-y-1.5 text-xs text-slate-500">
                  <p className="flex items-center gap-2"><Phone className="size-3.5" /> {c.phone}</p>
                  <p className="flex items-center gap-2"><Mail className="size-3.5" /> {c.email}</p>
                  <p className="flex items-center gap-2"><MapPin className="size-3.5" /> {c.address}</p>
                </div>
                {c.type !== "client" && <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500"><strong className="text-ink">{truckCount(c.id)}</strong> camions enregistrés</p>}
              </button>
            ))}
          </div>
        )}
      </Card>
      <CompanyFormModal open={form.open} company={form.company} onClose={() => setForm({ open: false })} />
      <ConfirmDialog
        open={!!toggle}
        onClose={() => setToggle(null)}
        tone={toggle?.status === "actif" ? "danger" : "primary"}
        title={toggle?.status === "actif" ? "Désactiver l'entreprise ?" : "Activer l'entreprise ?"}
        message={toggle ? `${toggle.name} ${toggle.status === "actif" ? "n'aura plus accès à son espace." : "retrouvera l'accès à son espace."}` : ""}
        confirmLabel={toggle?.status === "actif" ? "Désactiver" : "Activer"}
        onConfirm={() => {
          if (!toggle) return;
          actions.toggleCompany(toggle.id);
          toast(toggle.status === "actif" ? "Entreprise désactivée" : "Entreprise activée", { message: toggle.name, tone: toggle.status === "actif" ? "warning" : "success" });
        }}
      />
    </div>
  );
}

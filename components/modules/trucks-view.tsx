"use client";

import { useState } from "react";
import { BadgeCheck, Eye, LayoutGrid, List, Pencil, Plus, Power, Truck as TruckIcon, Weight, Wrench } from "lucide-react";
import { useData } from "@/lib/store/selectors";
import { TRUCK_STATUS, TRUCK_TYPES } from "@/lib/constants";
import { cn, driverName, formatNumber, includesText } from "@/lib/utils";
import type { Truck, TruckStatus, TruckType } from "@/types";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, StatCard } from "@/components/ui/card";
import { ActionMenu } from "@/components/ui/dropdown";
import { CompanyLogo, DriverAvatar, SafeImage } from "@/components/ui/media";
import { EmptyState, FilterSelect, PageHeader, SearchInput, Toolbar } from "@/components/ui/misc";
import { DataTable, type Column } from "@/components/tables/data-table";
import { TruckFormModal } from "@/components/forms/truck-form";
import { useDetail } from "@/components/details/detail-provider";

export function TrucksView() {
  const { trucks, lookups, scope, all } = useData();
  const { open } = useDetail();
  const [q, setQ] = useState("");
  const [company, setCompany] = useState("all");
  const [status, setStatus] = useState<TruckStatus | "all">("all");
  const [type, setType] = useState<TruckType | "all">("all");
  const [view, setView] = useState<"grid" | "table">("grid");
  const [form, setForm] = useState<{ open: boolean; truck?: Truck }>({ open: false });

  const rows = trucks.filter(
    (t) => (company === "all" || t.companyId === company) && (status === "all" || t.status === status) && (type === "all" || t.type === type) && includesText([t.plate, t.plate.replace(/-/g, ""), t.brand, t.model], q),
  );
  const owners = all.companies.filter((c) => c.type !== "client");
  const count = (s: TruckStatus) => trucks.filter((t) => t.status === s).length;
  const totalCapacity = trucks.reduce((s, t) => s + t.capacityT, 0);

  const menu = (t: Truck) => (
    <ActionMenu
      items={[
        { label: "Voir la fiche", icon: Eye, onClick: () => open({ kind: "truck", id: t.id }) },
        { label: "Modifier", icon: Pencil, onClick: () => setForm({ open: true, truck: t }) },
      ]}
    />
  );

  const columns: Column<Truck>[] = [
    {
      key: "plate",
      header: "Véhicule",
      cell: (t) => (
        <div className="flex items-center gap-3">
          <SafeImage src={t.image} alt={t.plate} className="h-11 w-16 shrink-0 rounded-lg" sizes="64px" />
          <div>
            <p className="font-mono font-semibold text-ink">{t.plate}</p>
            <p className="text-xs text-slate-500">{t.brand} {t.model}</p>
          </div>
        </div>
      ),
    },
    { key: "type", header: "Type", hideBelow: "md", cell: (t) => TRUCK_TYPES[t.type] },
    { key: "cap", header: "Capacité", align: "right", cell: (t) => <span className="tabular-nums">{t.capacityT} t</span> },
    ...(!scope ? [{ key: "company", header: "Propriétaire", hideBelow: "lg" as const, cell: (t: Truck) => <span className="flex items-center gap-2"><CompanyLogo company={lookups.company(t.companyId)} size="xs" /><span className="truncate">{lookups.company(t.companyId)?.name}</span></span> }] : []),
    {
      key: "driver",
      header: "Chauffeur",
      hideBelow: "md",
      cell: (t) => {
        const d = lookups.driver(t.driverId);
        return d ? <span className="flex items-center gap-2"><DriverAvatar driver={d} size="xs" /> {driverName(d)}</span> : <span className="text-slate-400">Non affecté</span>;
      },
    },
    { key: "status", header: "Statut", cell: (t) => <StatusBadge map={TRUCK_STATUS} value={t.status} /> },
    { key: "actions", header: "", align: "right", cell: menu },
  ];

  return (
    <div>
      <PageHeader
        eyebrow={scope ? "Mes ressources" : "Référentiels"}
        title={scope ? "Mes camions" : "Gestion de la flotte"}
        description={`${trucks.length} véhicules · capacité cumulée ${formatNumber(totalCapacity)} tonnes`}
        actions={
          <Button icon={Plus} onClick={() => setForm({ open: true })}>
            Ajouter un camion
          </Button>
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Disponibles" value={count("disponible")} icon={BadgeCheck} tone="green" onClick={() => setStatus(status === "disponible" ? "all" : "disponible")} />
        <StatCard label="En mission" value={count("en_mission")} icon={TruckIcon} tone="blue" onClick={() => setStatus(status === "en_mission" ? "all" : "en_mission")} />
        <StatCard label="En maintenance" value={count("maintenance")} icon={Wrench} tone="orange" onClick={() => setStatus(status === "maintenance" ? "all" : "maintenance")} />
        <StatCard label="Immobilisés" value={count("immobilise")} icon={Power} tone="red" onClick={() => setStatus(status === "immobilise" ? "all" : "immobilise")} />
      </div>
      <Card>
        <Toolbar>
          <SearchInput value={q} onChange={setQ} placeholder="Rechercher par immatriculation, marque…" className="sm:w-80" />
          {!scope && <FilterSelect label="Entreprise" value={company} onChange={setCompany} options={[{ value: "all", label: "Toutes les entreprises" }, ...owners.map((c) => ({ value: c.id, label: c.name }))]} />}
          <FilterSelect label="Statut" value={status} onChange={setStatus} options={[{ value: "all", label: "Tous les statuts" }, ...Object.entries(TRUCK_STATUS).map(([k, m]) => ({ value: k as TruckStatus, label: m.label }))]} />
          <FilterSelect label="Type" value={type} onChange={setType} options={[{ value: "all", label: "Tous les types" }, ...Object.entries(TRUCK_TYPES).map(([k, l]) => ({ value: k as TruckType, label: l }))]} />
          <div className="flex gap-1 sm:ml-auto">
            <button onClick={() => setView("grid")} className={cn("rounded-lg p-2", view === "grid" ? "bg-slate-100 text-ink" : "text-slate-400 hover:text-ink")} aria-label="Vue cartes">
              <LayoutGrid className="size-4" />
            </button>
            <button onClick={() => setView("table")} className={cn("rounded-lg p-2", view === "table" ? "bg-slate-100 text-ink" : "text-slate-400 hover:text-ink")} aria-label="Vue tableau">
              <List className="size-4" />
            </button>
          </div>
        </Toolbar>
        {view === "table" ? (
          <DataTable columns={columns} rows={rows} onRowClick={(t) => open({ kind: "truck", id: t.id })} emptyTitle="Aucun camion trouvé" />
        ) : rows.length === 0 ? (
          <EmptyState icon={TruckIcon} title="Aucun camion trouvé" message="Modifiez vos filtres ou ajoutez un véhicule." />
        ) : (
          <div className="grid gap-4 border-t border-slate-100 p-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {rows.map((t) => {
              const d = lookups.driver(t.driverId);
              const owner = lookups.company(t.companyId);
              return (
                <div key={t.id} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-pop">
                  <button onClick={() => open({ kind: "truck", id: t.id })} className="relative block w-full text-left">
                    <SafeImage src={t.image} alt={`${t.brand} ${t.model} — ${t.plate}`} className="aspect-[16/10] transition duration-500 group-hover:scale-[1.03]" sizes="(max-width: 640px) 100vw, 360px" />
                    <span className="absolute top-3 left-3">
                      <StatusBadge map={TRUCK_STATUS} value={t.status} className="bg-white/95 shadow-sm" />
                    </span>
                    <span className="absolute right-3 bottom-3 rounded-lg bg-navy-900/85 px-2.5 py-1 font-mono text-sm font-semibold tracking-wide text-white backdrop-blur">{t.plate}</span>
                  </button>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ink">{t.brand} {t.model}</p>
                        <p className="text-xs text-slate-500">{TRUCK_TYPES[t.type]} · {t.year}</p>
                      </div>
                      {menu(t)}
                    </div>
                    <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Weight className="size-3.5" /> {t.capacityT} t</span>
                      <span className="tabular-nums">{formatNumber(t.mileageKm)} km</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                      {d ? (
                        <span className="flex min-w-0 items-center gap-2 text-sm">
                          <DriverAvatar driver={d} size="xs" />
                          <span className="truncate">{driverName(d)}</span>
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">Aucun chauffeur</span>
                      )}
                      {!scope && <CompanyLogo company={owner} size="xs" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
      <TruckFormModal open={form.open} truck={form.truck} onClose={() => setForm({ open: false })} />
    </div>
  );
}

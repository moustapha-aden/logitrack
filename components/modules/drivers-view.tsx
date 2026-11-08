"use client";

import { useState } from "react";
import { CalendarOff, Eye, IdCard, LayoutGrid, List, Moon, Pencil, Phone, Plus, Star, UserCheck, Users } from "lucide-react";
import { useData } from "@/lib/store/selectors";
import { DRIVER_AVAILABILITY } from "@/lib/constants";
import { cn, driverName, includesText } from "@/lib/utils";
import type { Driver, DriverAvailability } from "@/types";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, StatCard } from "@/components/ui/card";
import { ActionMenu } from "@/components/ui/dropdown";
import { CompanyLogo, DriverAvatar } from "@/components/ui/media";
import { EmptyState, FilterSelect, PageHeader, SearchInput, Segmented, Toolbar } from "@/components/ui/misc";
import { DataTable, type Column } from "@/components/tables/data-table";
import { DriverFormModal } from "@/components/forms/driver-form";
import { useDetail } from "@/components/details/detail-provider";
import { CarriersTable } from "./carriers-view";

function DriversList({ onCreate }: { onCreate?: () => void }) {
  const { drivers, lookups, scope, all } = useData();
  const { open } = useDetail();
  const [q, setQ] = useState("");
  const [company, setCompany] = useState("all");
  const [availability, setAvailability] = useState<DriverAvailability | "all">("all");
  const [view, setView] = useState<"table" | "grid">("table");
  const [form, setForm] = useState<{ open: boolean; driver?: Driver }>({ open: false });
  const owners = all.companies.filter((c) => c.type !== "client");

  const rows = drivers.filter((d) => (company === "all" || d.companyId === company) && (availability === "all" || d.availability === availability) && includesText([driverName(d), d.phone, d.licenseNumber], q));

  const columns: Column<Driver>[] = [
    {
      key: "name",
      header: "Chauffeur",
      cell: (d) => (
        <div className="flex items-center gap-3">
          <DriverAvatar driver={d} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{driverName(d)}</p>
            <p className="flex items-center gap-1 text-xs text-slate-500"><Star className="size-3 fill-amber-400 text-amber-400" /> {d.rating.toFixed(1)} · {d.experienceYears} ans</p>
          </div>
        </div>
      ),
    },
    { key: "phone", header: "Téléphone", hideBelow: "md", cell: (d) => <span className="whitespace-nowrap tabular-nums">{d.phone}</span> },
    { key: "license", header: "Permis", hideBelow: "lg", cell: (d) => <span className="font-mono text-xs">{d.licenseNumber}</span> },
    { key: "cat", header: "Cat.", align: "center", cell: (d) => <Badge tone="blue" dot={false}>{d.licenseCategory}</Badge> },
    ...(!scope ? [{ key: "company", header: "Entreprise", hideBelow: "lg" as const, cell: (d: Driver) => <span className="flex items-center gap-2"><CompanyLogo company={lookups.company(d.companyId)} size="xs" /><span className="truncate">{lookups.company(d.companyId)?.name}</span></span> }] : []),
    { key: "truck", header: "Camion affecté", hideBelow: "md", cell: (d) => (lookups.truck(d.truckId) ? <span className="font-mono text-sm">{lookups.truck(d.truckId)?.plate}</span> : <span className="text-slate-400">—</span>) },
    { key: "availability", header: "Disponibilité", cell: (d) => <StatusBadge map={DRIVER_AVAILABILITY} value={d.availability} /> },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (d) => (
        <ActionMenu
          items={[
            { label: "Voir la fiche", icon: Eye, onClick: () => open({ kind: "driver", id: d.id }) },
            { label: "Modifier", icon: Pencil, onClick: () => setForm({ open: true, driver: d }) },
          ]}
        />
      ),
    },
  ];

  const count = (a: DriverAvailability) => drivers.filter((d) => d.availability === a).length;

  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Disponibles" value={count("disponible")} icon={UserCheck} tone="green" onClick={() => setAvailability(availability === "disponible" ? "all" : "disponible")} />
        <StatCard label="En mission" value={count("en_mission")} icon={Users} tone="blue" onClick={() => setAvailability(availability === "en_mission" ? "all" : "en_mission")} />
        <StatCard label="En repos" value={count("repos")} icon={Moon} tone="neutral" onClick={() => setAvailability(availability === "repos" ? "all" : "repos")} />
        <StatCard label="En congé" value={count("conge")} icon={CalendarOff} tone="violet" onClick={() => setAvailability(availability === "conge" ? "all" : "conge")} />
      </div>
      <Card>
        <Toolbar>
          <SearchInput value={q} onChange={setQ} placeholder="Nom, téléphone, n° de permis…" className="sm:w-72" />
          {!scope && <FilterSelect label="Entreprise" value={company} onChange={setCompany} options={[{ value: "all", label: "Toutes les entreprises" }, ...owners.map((c) => ({ value: c.id, label: c.name }))]} />}
          <FilterSelect label="Disponibilité" value={availability} onChange={setAvailability} options={[{ value: "all", label: "Toutes disponibilités" }, ...Object.entries(DRIVER_AVAILABILITY).map(([k, m]) => ({ value: k as DriverAvailability, label: m.label }))]} />
          <div className="flex items-center gap-1 sm:ml-auto">
            <button onClick={() => setView("table")} className={cn("rounded-lg p-2", view === "table" ? "bg-slate-100 text-ink" : "text-slate-400 hover:text-ink")} aria-label="Vue tableau">
              <List className="size-4" />
            </button>
            <button onClick={() => setView("grid")} className={cn("rounded-lg p-2", view === "grid" ? "bg-slate-100 text-ink" : "text-slate-400 hover:text-ink")} aria-label="Vue cartes">
              <LayoutGrid className="size-4" />
            </button>
            {onCreate && (
              <Button icon={Plus} className="ml-2" onClick={onCreate}>
                Ajouter
              </Button>
            )}
          </div>
        </Toolbar>
        {view === "table" ? (
          <DataTable columns={columns} rows={rows} onRowClick={(d) => open({ kind: "driver", id: d.id })} emptyTitle="Aucun chauffeur trouvé" />
        ) : rows.length === 0 ? (
          <EmptyState icon={IdCard} title="Aucun chauffeur trouvé" />
        ) : (
          <div className="grid gap-4 border-t border-slate-100 p-4 sm:grid-cols-2 xl:grid-cols-4">
            {rows.map((d) => {
              const truck = lookups.truck(d.truckId);
              return (
                <button key={d.id} onClick={() => open({ kind: "driver", id: d.id })} className="overflow-hidden rounded-2xl border border-slate-200 text-left transition hover:-translate-y-0.5 hover:shadow-pop">
                  <div className="h-14" style={{ background: `linear-gradient(120deg, ${d.avatarColor}22, ${d.avatarColor}08)` }} />
                  <div className="-mt-8 px-4 pb-4">
                    <DriverAvatar driver={d} size="lg" ring />
                    <p className="mt-2 font-semibold text-ink">{driverName(d)}</p>
                    <p className="flex items-center gap-1 text-xs text-slate-500"><Phone className="size-3" /> {d.phone}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <StatusBadge map={DRIVER_AVAILABILITY} value={d.availability} />
                      <Badge tone="blue" dot={false}>Permis {d.licenseCategory}</Badge>
                    </div>
                    <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                      Camion : <span className="font-mono font-semibold text-ink">{truck?.plate ?? "—"}</span>
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Card>
      <DriverFormModal open={form.open} driver={form.driver} onClose={() => setForm({ open: false })} />
    </>
  );
}

export function DriversView() {
  const [create, setCreate] = useState(false);
  return (
    <div>
      <PageHeader
        eyebrow="Référentiels"
        title="Chauffeurs"
        description="Effectif des chauffeurs, permis de conduire, affectations et disponibilités."
        actions={
          <Button icon={Plus} onClick={() => setCreate(true)}>
            Ajouter un chauffeur
          </Button>
        }
      />
      <DriversList />
      <DriverFormModal open={create} onClose={() => setCreate(false)} />
    </div>
  );
}

/** Espace entreprise : chauffeurs + transporteurs autorisés. */
export function CompanyPeopleView() {
  const { drivers, carriers } = useData();
  const [tab, setTab] = useState<"drivers" | "carriers">("drivers");
  const [create, setCreate] = useState(false);
  return (
    <div>
      <PageHeader eyebrow="Mes ressources" title="Chauffeurs et transporteurs" description="Gérez vos chauffeurs salariés et les transporteurs partenaires autorisés à opérer pour votre compte." />
      <div className="mb-5">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: "drivers", label: "Chauffeurs", count: drivers.length },
            { value: "carriers", label: "Transporteurs autorisés", count: carriers.length },
          ]}
        />
      </div>
      {tab === "drivers" ? <DriversList onCreate={() => setCreate(true)} /> : <CarriersTable embedded />}
      <DriverFormModal open={create} onClose={() => setCreate(false)} />
    </div>
  );
}

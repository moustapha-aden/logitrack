"use client";

import { useState } from "react";
import { ExternalLink, Eye, EyeOff, Megaphone, PhoneCall, Send, Truck as TruckIcon, XCircle } from "lucide-react";
import { actions } from "@/lib/store";
import { useData, usePermissions } from "@/lib/store/selectors";
import { DRIVER_AVAILABILITY, GOODS_TYPES, LEAD_STATUS, TRUCK_STATUS, TRUCK_TYPES } from "@/lib/constants";
import { placeName } from "@/lib/data/geo";
import { cn, driverName, formatDate, formatDateTime } from "@/lib/utils";
import type { TransportLead } from "@/types";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, StatCard } from "@/components/ui/card";
import { ActionMenu, type MenuItem } from "@/components/ui/dropdown";
import { CompanyLogo, DriverAvatar, SafeImage } from "@/components/ui/media";
import { LinkButton, PageHeader, Segmented } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { DataTable, type Column } from "@/components/tables/data-table";
import { useDetail } from "@/components/details/detail-provider";

/** Gestion de l'annuaire public : entreprise, chauffeurs et camions publiés, demandes des visiteurs. */
export function ShowcaseView() {
  const { trucks, drivers, leads, lookups, scope, all } = useData();
  const listedCompanies = (scope ? all.companies.filter((c) => c.id === scope) : all.companies.filter((c) => c.type !== "client" && c.status === "actif"));
  const { can } = usePermissions();
  const { open } = useDetail();
  const { toast } = useToast();
  const [tab, setTab] = useState<"open" | "all">("open");

  const published = trucks.filter((t) => t.published);
  const visible = published.filter((t) => t.status === "disponible" || t.status === "en_mission");
  const pending = leads.filter((l) => l.status === "nouvelle");
  const rows = leads.filter((l) => tab === "all" || l.status === "nouvelle" || l.status === "contactee").sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const setStatus = (l: TransportLead, status: TransportLead["status"]) => {
    actions.setLeadStatus(l.id, status);
    toast("Demande mise à jour", { message: `${l.ref} : ${LEAD_STATUS[status].label}`, tone: status === "convertie" ? "success" : "info" });
  };

  const columns: Column<TransportLead>[] = [
    {
      key: "who",
      header: "Visiteur",
      cell: (l) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{l.name}</p>
          <p className="truncate text-xs text-slate-500">
            {l.phone}
            {l.organisation ? ` · ${l.organisation}` : ""}
          </p>
        </div>
      ),
    },
    {
      key: "trip",
      header: "Trajet",
      cell: (l) => (
        <div className="min-w-0">
          <p className="truncate text-sm">
            {placeName(l.origin)} → {placeName(l.destination)}
          </p>
          <p className="truncate text-xs text-slate-500">
            {GOODS_TYPES[l.goodsType]} · le {formatDate(l.date)}
          </p>
        </div>
      ),
    },
    {
      key: "target",
      header: "Demande portant sur",
      hideBelow: "md",
      cell: (l) => {
        const t = lookups.truck(l.truckId);
        const d = lookups.driver(l.driverId);
        if (t)
          return (
            <LinkButton className="text-xs" onClick={() => open({ kind: "truck", id: t.id })}>
              Camion <span className="font-mono">{t.plate}</span>
            </LinkButton>
          );
        if (d)
          return (
            <LinkButton className="text-xs" onClick={() => open({ kind: "driver", id: d.id })}>
              Chauffeur {driverName(d)}
            </LinkButton>
          );
        return <span className="text-xs text-slate-600">L&apos;entreprise</span>;
      },
    },
    ...(!scope ? [{ key: "company", header: "Entreprise", hideBelow: "lg" as const, cell: (l: TransportLead) => <span className="truncate text-xs text-slate-600">{lookups.company(l.companyId)?.name}</span> }] : []),
    { key: "at", header: "Reçue", hideBelow: "lg", cell: (l) => <span className="text-xs whitespace-nowrap text-slate-500 tabular-nums">{formatDateTime(l.createdAt)}</span> },
    { key: "status", header: "Statut", cell: (l) => <StatusBadge map={LEAD_STATUS} value={l.status} /> },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (l) => {
        const items = [
          can("mission.edit") && l.status === "nouvelle" && { label: "Marquer le client rappelé", icon: PhoneCall, onClick: () => setStatus(l, "contactee") },
          can("mission.edit") && (l.status === "nouvelle" || l.status === "contactee") && { label: "Mission créée", icon: Send, onClick: () => setStatus(l, "convertie") },
          can("mission.edit") && (l.status === "nouvelle" || l.status === "contactee") && { label: "Classer sans suite", icon: XCircle, onClick: () => setStatus(l, "close") },
        ].filter(Boolean) as MenuItem[];
        return (
          <div className="flex items-center justify-end gap-1.5">
            <a href={`tel:${l.phone.replace(/\s/g, "")}`} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium hover:bg-slate-50" aria-label={`Appeler ${l.name}`}>
              <PhoneCall className="size-3.5" /> <span className="hidden sm:inline">Appeler</span>
            </a>
            {items.length > 0 && <ActionMenu items={items} />}
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Commercial"
        title="Annuaire public et demandes"
        description="Choisissez ce qui apparaît dans l'annuaire public (entreprise, camions, chauffeurs) et rappelez les visiteurs qui vous sollicitent."
        actions={
          <a href="/marketing" target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium hover:bg-slate-50">
            <ExternalLink className="size-4" /> Voir l&apos;annuaire
          </a>
        }
      />
      <div className="mb-6 grid grid-cols-1 gap-3 min-[420px]:grid-cols-3">
        <StatCard label="Demandes à rappeler" value={pending.length} icon={PhoneCall} tone="orange" onClick={() => setTab("open")} />
        <StatCard label="Camions et chauffeurs publiés" value={`${published.length} / ${drivers.filter((d) => d.published).length}`} icon={Megaphone} tone="blue" hint={`${visible.length} camions visibles actuellement`} />
        <StatCard label="Demandes reçues" value={leads.length} icon={Send} tone="navy" onClick={() => setTab("all")} />
      </div>

      <Card>
        <CardHeader title="Demandes des visiteurs" subtitle="Chaque demande arrive aussi en notification. Rappelez le client puis mettez à jour le statut." />
        <div className="px-5 pb-3">
          <Segmented
            value={tab}
            onChange={setTab}
            size="sm"
            options={[
              { value: "open", label: "À traiter", count: leads.filter((l) => l.status === "nouvelle" || l.status === "contactee").length },
              { value: "all", label: "Toutes", count: leads.length },
            ]}
          />
        </div>
        <DataTable columns={columns} rows={rows} emptyTitle="Aucune demande" emptyMessage="Les demandes envoyées depuis la vitrine apparaîtront ici." />
      </Card>

      <Card className="mt-6">
        <CardHeader title={scope ? "Votre entreprise dans l'annuaire" : "Entreprises dans l'annuaire"} subtitle="Fiche publique : nom, ville, taille de flotte, ponctualité. Jamais les tarifs ni les clients." />
        <ul className="divide-y divide-slate-100">
          {listedCompanies.map((c) => (
            <li key={c.id} className="flex flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center">
              <span className="flex min-w-0 flex-1 items-center gap-3">
                <CompanyLogo company={c} size="sm" />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{c.name}</span>
                  <span className="block truncate text-xs text-slate-500">{c.city} · {c.listed ? "présentée dans l'annuaire" : "non présentée"}</span>
                </span>
              </span>
              <Button
                size="sm"
                variant={c.listed ? "secondary" : "primary"}
                icon={c.listed ? EyeOff : Eye}
                disabled={!can("fleet.edit")}
                onClick={() => {
                  actions.setCompanyListed(c.id, !c.listed);
                  toast(c.listed ? "Retirée de l'annuaire" : "Présentée dans l'annuaire", { message: c.name });
                }}
              >
                {c.listed ? "Retirer" : "Présenter"}
              </Button>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="mt-6">
        <CardHeader title="Chauffeurs dans l'annuaire" subtitle="Publié avec l'accord du chauffeur : prénom, initiale, expérience, note et itinéraires. Jamais son téléphone." />
        <ul className="divide-y divide-slate-100">
          {drivers
            .slice()
            .sort((a, b) => Number(!!b.published) - Number(!!a.published) || b.experienceYears - a.experienceYears)
            .map((d) => (
              <li key={d.id} className="flex flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center">
                <button onClick={() => open({ kind: "driver", id: d.id })} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <DriverAvatar driver={d} size="sm" />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{driverName(d)}</span>
                    <span className="block truncate text-xs text-slate-500">
                      {d.experienceYears} ans · permis {d.licenseCategory} · note {d.rating.toFixed(1)}
                      {!scope && ` · ${lookups.company(d.companyId)?.name ?? ""}`}
                    </span>
                  </span>
                </button>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <StatusBadge map={DRIVER_AVAILABILITY} value={d.availability} />
                  <Button
                    size="sm"
                    variant={d.published ? "secondary" : "primary"}
                    icon={d.published ? EyeOff : Eye}
                    disabled={!can("fleet.edit")}
                    onClick={() => {
                      actions.setDriverPublished(d.id, !d.published);
                      toast(d.published ? "Profil retiré de l'annuaire" : "Profil publié", { message: driverName(d) });
                    }}
                  >
                    {d.published ? "Retirer" : "Publier"}
                  </Button>
                </div>
              </li>
            ))}
        </ul>
      </Card>

      <Card className="mt-6">
        <CardHeader title="Camions dans l'annuaire" subtitle="Un camion en maintenance ou immobilisé n'est jamais affiché, même s'il est publié." />
        <ul className="divide-y divide-slate-100">
          {trucks
            .slice()
            .sort((a, b) => Number(!!b.published) - Number(!!a.published) || a.plate.localeCompare(b.plate))
            .map((t) => {
              const d = lookups.driver(t.driverId);
              const shown = t.published && (t.status === "disponible" || t.status === "en_mission");
              return (
                <li key={t.id} className="flex flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center">
                  <button onClick={() => open({ kind: "truck", id: t.id })} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <SafeImage src={t.image} alt={t.plate} className="h-12 w-16 shrink-0 rounded-lg" sizes="64px" />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {t.brand} {t.model} <span className="font-mono text-xs text-slate-500">· {t.plate}</span>
                      </span>
                      <span className="block truncate text-xs text-slate-500">
                        {TRUCK_TYPES[t.type]} · {t.capacityT} t · {d ? `${driverName(d)} (${d.experienceYears} ans)` : "sans chauffeur attitré"}
                        {!scope && ` · ${lookups.company(t.companyId)?.name ?? ""}`}
                      </span>
                    </span>
                  </button>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    {!scope && <CompanyLogo company={lookups.company(t.companyId)} size="xs" />}
                    <StatusBadge map={TRUCK_STATUS} value={t.status} />
                    {t.published && !shown && <Badge tone="neutral">Masqué (indisponible)</Badge>}
                    <Button
                      size="sm"
                      variant={t.published ? "secondary" : "primary"}
                      icon={t.published ? EyeOff : Eye}
                      disabled={!can("fleet.edit")}
                      className={cn(!can("fleet.edit") && "opacity-60")}
                      onClick={() => {
                        actions.setTruckPublished(t.id, !t.published);
                        toast(t.published ? "Retiré de l'annuaire" : "Publié dans l'annuaire", { message: t.plate });
                      }}
                    >
                      {t.published ? "Retirer" : "Publier"}
                    </Button>
                  </div>
                </li>
              );
            })}
          {trucks.length === 0 && (
            <li className="px-5 py-8 text-center text-sm text-slate-500">
              <TruckIcon className="mx-auto mb-2 size-6 text-slate-300" /> Aucun camion dans la flotte.
            </li>
          )}
        </ul>
      </Card>
      <p className="mt-3 text-xs text-slate-400">Dans l&apos;annuaire, les visiteurs ne voient jamais les tarifs, les clients ni le téléphone des chauffeurs. Leurs demandes arrivent uniquement à l&apos;entreprise concernée.</p>
    </div>
  );
}

"use client";

import { useState } from "react";
import { ArrowRight, Boxes, FlaskConical, Package, Scale, Truck } from "lucide-react";
import { useData } from "@/lib/store/selectors";
import { GOODS_TYPES, LOAD_STATUS } from "@/lib/constants";
import { placeName } from "@/lib/data/geo";
import { formatNumber, includesText, loadStatusFromStep } from "@/lib/utils";
import type { GoodsType, Load, LoadStatus } from "@/types";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Card, StatCard } from "@/components/ui/card";
import { FilterSelect, LinkButton, PageHeader, SearchInput, Toolbar } from "@/components/ui/misc";
import { DataTable, type Column } from "@/components/tables/data-table";
import { useDetail } from "@/components/details/detail-provider";

export function LoadsView() {
  const { loads, lookups, scope } = useData();
  const { open } = useDetail();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<LoadStatus | "all">("all");
  const [goods, setGoods] = useState<GoodsType | "all">("all");

  const enriched = loads.map((l) => {
    const m = lookups.mission(l.missionId);
    return { ...l, m, status: loadStatusFromStep(m?.step ?? 0) };
  });
  const rows = enriched.filter((l) => (status === "all" || l.status === status) && (goods === "all" || l.m?.goodsType === goods) && includesText([l.ref, l.nature, l.containerNo, l.m?.ref, lookups.company(l.m?.clientId)?.name], q));
  type Row = (typeof enriched)[number];

  const inTransit = enriched.filter((l) => l.status === "en_transit");
  const columns: Column<Row>[] = [
    {
      key: "ref",
      header: "Chargement",
      cell: (l) => (
        <div className="flex items-center gap-3">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Package className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="font-mono text-xs font-semibold text-slate-500">{l.ref}</p>
            <p className="flex items-center gap-1.5 truncate font-medium text-ink">
              {l.nature} {l.hazardous && <Badge tone="red" dot={false}>ADR</Badge>}
            </p>
          </div>
        </div>
      ),
    },
    { key: "weight", header: "Poids", align: "right", cell: (l) => <span className="tabular-nums">{l.weightT} t</span> },
    { key: "volume", header: "Volume", align: "right", hideBelow: "md", cell: (l) => <span className="tabular-nums">{l.volumeM3} m³</span> },
    { key: "packages", header: "Colis", align: "right", hideBelow: "md", cell: (l) => <span className="tabular-nums">{formatNumber(l.packages)}</span> },
    { key: "route", header: "Origine → Destination", hideBelow: "lg", cell: (l) => l.m && <span className="flex items-center gap-1 whitespace-nowrap">{placeName(l.m.origin)} <ArrowRight className="size-3 text-slate-400" /> {placeName(l.m.destination)}</span> },
    { key: "client", header: "Client", hideBelow: "xl", cell: (l) => <span className="block max-w-40 truncate">{lookups.company(l.m?.clientId)?.name}</span> },
    { key: "mission", header: "Mission", cell: (l) => l.m && <LinkButton className="font-mono text-xs" onClick={() => open({ kind: "mission", id: l.m!.id })}>{l.m.ref}</LinkButton> },
    { key: "status", header: "Statut", cell: (l) => <StatusBadge map={LOAD_STATUS} value={l.status} /> },
  ];

  return (
    <div>
      <PageHeader eyebrow="Exploitation" title="Chargements" description={scope ? "Marchandises transportées dans le cadre de vos missions." : "Marchandises associées aux missions de transport, du port jusqu'à la livraison."} />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Chargements" value={loads.length} icon={Boxes} tone="blue" />
        <StatCard label="En transit" value={inTransit.length} icon={Truck} tone="violet" hint={`${formatNumber(Math.round(inTransit.reduce((s, l) => s + l.weightT, 0)))} t sur la route`} />
        <StatCard label="Tonnage total" value={`${formatNumber(Math.round(loads.reduce((s, l) => s + l.weightT, 0)))} t`} icon={Scale} tone="navy" />
        <StatCard label="Marchandises dangereuses" value={loads.filter((l) => l.hazardous).length} icon={FlaskConical} tone="red" />
      </div>
      <Card>
        <Toolbar>
          <SearchInput value={q} onChange={setQ} placeholder="Référence, nature, conteneur, client…" className="sm:w-80" />
          <FilterSelect label="Statut" value={status} onChange={setStatus} options={[{ value: "all", label: "Tous les statuts" }, ...Object.entries(LOAD_STATUS).map(([k, m]) => ({ value: k as LoadStatus, label: m.label }))]} />
          <FilterSelect label="Marchandise" value={goods} onChange={setGoods} options={[{ value: "all", label: "Toutes marchandises" }, ...Object.entries(GOODS_TYPES).map(([k, l]) => ({ value: k as GoodsType, label: l }))]} />
        </Toolbar>
        <DataTable<Row> columns={columns} rows={rows} onRowClick={(l: Load) => open({ kind: "load", id: l.id })} emptyTitle="Aucun chargement trouvé" />
      </Card>
    </div>
  );
}

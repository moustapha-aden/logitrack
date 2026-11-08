"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, Download, Gauge, Printer, Route } from "lucide-react";
import { useData } from "@/lib/store/selectors";
import { INCIDENT_TYPES } from "@/lib/constants";
import { monthlySeries } from "@/lib/data/analytics";
import { formatDjf, formatNumber } from "@/lib/utils";
import type { IncidentType } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, StatCard } from "@/components/ui/card";
import { CompanyLogo } from "@/components/ui/media";
import { FilterSelect, PageHeader, ProgressBar, Segmented } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { AreaTrend, BarsChart, Donut, LineTrend, SERIES } from "@/components/charts";

type Range = "3" | "6" | "12";

export function ReportsView() {
  const { all, scope, missions, incidents, trucks, lookups } = useData();
  const { toast } = useToast();
  const [range, setRange] = useState<Range>("12");
  const [company, setCompany] = useState(scope ?? "all");

  const owners = all.companies.filter((c) => c.type !== "client");
  const ownerMissions = (id: string) => all.missions.filter((m) => m.companyId === id);
  const effective = scope ?? company;
  const scopedMissions = effective === "all" ? all.missions : ownerMissions(effective);
  const share = effective === "all" ? 1 : Math.max(0.05, scopedMissions.length / all.missions.length);
  const series = monthlySeries(all.monthly, share, Number(range));

  const total = series.reduce((s, m) => s + m.missions, 0);
  const delays = series.reduce((s, m) => s + m.retards, 0);
  const incidentsCount = series.reduce((s, m) => s + m.incidents, 0);
  const onTimeRate = total ? ((total - delays) / total) * 100 : 0;
  const usage = series.reduce((s, m) => s + m.utilisation, 0) / Math.max(1, series.length);

  // Tendances : mois complets de la période vs période précédente de même durée
  const complete = series.filter((m) => !m.partial);
  const partialCount = series.length - complete.length;
  const n = complete.length;
  const prev = all.monthly.length >= partialCount + 2 * n ? monthlySeries(all.monthly, share, n, partialCount + n) : null;
  const agg = (arr: typeof series) => {
    const t = arr.reduce((s, m) => s + m.missions, 0);
    const d = arr.reduce((s, m) => s + m.retards, 0);
    return { t, d, rate: t ? ((t - d) / t) * 100 : 0 };
  };
  const cur = agg(complete);
  const before = prev ? agg(prev) : null;
  const pct = (a: number, b: number) => (b ? Math.round(((a - b) / b) * 100) : 0);
  const fmtPct = (v: number) => `${v > 0 ? "+" : ""}${v} %`;
  const trendMissions = before ? { value: fmtPct(pct(cur.t, before.t)), up: cur.t >= before.t } : undefined;
  const rateDiff = before ? Math.round((cur.rate - before.rate) * 10) / 10 : 0;
  const trendRate = before ? { value: `${rateDiff > 0 ? "+" : ""}${rateDiff.toLocaleString("fr-FR")} pt`, up: rateDiff >= 0 } : undefined;
  const trendDelays = before ? { value: fmtPct(pct(cur.d, before.d)), up: cur.d > before.d, good: cur.d <= before.d } : undefined;
  const compareHint = before ? `vs ${n} mois précédents` : "historique complet";

  // Performance par entreprise : calculée en temps réel à partir des missions du store
  const perf = owners
    .filter((c) => ownerMissions(c.id).length > 0)
    .map((c) => {
      const ms = ownerMissions(c.id);
      const late = ms.filter((m) => m.delayed || all.incidents.some((i) => i.missionId === m.id && (i.type === "retard" || (i.delayMinutes ?? 0) > 0))).length;
      const rate = Math.round((1 - late / ms.length) * 1000) / 10;
      return {
        c,
        volume: ms.length,
        done: ms.filter((m) => m.step >= 6).length,
        late,
        rate,
        revenue: ms.reduce((s, m) => s + m.priceDjf, 0),
        fleet: all.trucks.filter((t) => t.companyId === c.id).length,
      };
    })
    .sort((a, b) => b.volume - a.volume);

  const scopedIncidents = scope ? incidents : effective === "all" ? all.incidents : all.incidents.filter((i) => scopedMissions.some((m) => m.id === i.missionId));
  const typeColors: Record<IncidentType, string> = { panne: SERIES.blue, retard: SERIES.amber, accident: SERIES.red, administratif: SERIES.navy, chargement: SERIES.green, autre: SERIES.gray };
  const byType = (Object.keys(INCIDENT_TYPES) as IncidentType[])
    .map((t) => ({ name: INCIDENT_TYPES[t], value: scopedIncidents.filter((i) => i.type === t).length, color: typeColors[t] }))
    .filter((d) => d.value > 0);

  const fleetTrucks = scope ? trucks : effective === "all" ? all.trucks : all.trucks.filter((t) => t.companyId === effective);

  const exportCsv = () => {
    const header = ["Mois", "Missions", "Livrées à temps", "Retards", "Incidents", "Ponctualité %", "Utilisation flotte %"];
    const csv = [header, ...series.map((s) => [s.label, s.missions, s.livrees, s.retards, s.incidents, s.tauxPonctualite, s.utilisation])].map((l) => l.join(";")).join("\n");
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `logitrack-rapport-${range}-mois.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Rapport exporté", { message: `${series.length} mois · format CSV` });
  };

  return (
    <div>
      <PageHeader
        eyebrow="Analyse"
        title={scope ? "Statistiques" : "Rapports et statistiques"}
        description="Historique consolidé sur 12 mois (fictif) et indicateurs opérationnels calculés en temps réel. * Novembre : mois en cours."
        actions={
          <>
            <Button variant="secondary" icon={Printer} onClick={() => window.print()}>
              Imprimer
            </Button>
            <Button icon={Download} onClick={exportCsv}>
              Exporter CSV
            </Button>
          </>
        }
      />
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Segmented
          value={range}
          onChange={setRange}
          options={[
            { value: "3", label: "3 mois" },
            { value: "6", label: "6 mois" },
            { value: "12", label: "12 mois" },
          ]}
        />
        {!scope && <FilterSelect label="Entreprise" value={company} onChange={setCompany} options={[{ value: "all", label: "Toutes les entreprises" }, ...owners.map((c) => ({ value: c.id, label: c.name }))]} />}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5 [&>*:last-child]:col-span-2 lg:[&>*:last-child]:col-span-1">
        <StatCard label="Missions réalisées" value={formatNumber(total)} icon={Route} tone="blue" trend={trendMissions} hint={compareHint} />
        <StatCard label="Livraison à temps" value={`${onTimeRate.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`} icon={CheckCircle2} tone="green" trend={trendRate} hint="objectif : 92 %" />
        <StatCard label="Retards" value={formatNumber(delays)} icon={Clock} tone="orange" trend={trendDelays} />
        <StatCard label="Incidents" value={formatNumber(incidentsCount)} icon={AlertTriangle} tone="red" />
        <StatCard label="Utilisation de la flotte" value={`${Math.round(usage)} %`} icon={Gauge} tone="navy" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <Card>
          <CardHeader title="Missions par mois" subtitle="Livrées à temps et en retard" />
          <div className="px-3 pb-4">
            <BarsChart
              data={series}
              xKey="label"
              stacked
              series={[
                { key: "livrees", name: "À temps", color: SERIES.blue },
                { key: "retards", name: "En retard", color: SERIES.amber },
              ]}
            />
          </div>
        </Card>
        <Card>
          <CardHeader title="Taux de livraison à temps" subtitle="Pourcentage mensuel — objectif 92 %" />
          <div className="px-3 pb-4">
            <LineTrend data={series} xKey="label" unit="%" domain={[80, 100]} series={[{ key: "tauxPonctualite", name: "Ponctualité", color: SERIES.green }]} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Retards et incidents" subtitle="Nombre d'événements par mois" />
          <div className="px-3 pb-4">
            <BarsChart
              data={series}
              xKey="label"
              series={[
                { key: "retards", name: "Retards", color: SERIES.amber },
                { key: "incidents", name: "Incidents", color: SERIES.blue },
              ]}
            />
          </div>
        </Card>
        <Card>
          <CardHeader title="Utilisation de la flotte" subtitle="Part moyenne du temps en mission" />
          <div className="px-3 pb-4">
            <AreaTrend data={series} xKey="label" unit="%" series={[{ key: "utilisation", name: "Utilisation", color: SERIES.blue }]} />
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3 lg:gap-6">
        <Card className="lg:col-span-2">
          <CardHeader title="Performance des entreprises" subtitle="Calculée en temps réel sur les missions enregistrées dans la plateforme" />
          <div className="scroll-thin overflow-x-auto px-5 pb-5">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="text-left text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                  <th className="py-2">Entreprise</th>
                  <th className="py-2 pl-4 text-right">Missions</th>
                  <th className="py-2 pl-4 text-right">Terminées</th>
                  <th className="py-2 pl-4 text-right">Retards</th>
                  <th className="py-2 pl-4 text-right">Flotte</th>
                  <th className="w-44 py-2 pl-6">Ponctualité</th>
                  <th className="py-2 pl-4 text-right">Valeur des missions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {perf.map(({ c, volume, done, late, rate, revenue, fleet }) => (
                  <tr key={c.id} className={effective !== "all" && effective !== c.id ? "opacity-40" : ""}>
                    <td className="py-3">
                      <span className="flex items-center gap-2.5">
                        <CompanyLogo company={c} size="xs" />
                        <span className="font-medium">{c.name}</span>
                      </span>
                    </td>
                    <td className="py-3 pl-4 text-right tabular-nums">{formatNumber(volume)}</td>
                    <td className="py-3 pl-4 text-right tabular-nums">{done}</td>
                    <td className="py-3 pl-4 text-right tabular-nums">{late}</td>
                    <td className="py-3 pl-4 text-right tabular-nums">{fleet}</td>
                    <td className="py-3 pl-6">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={rate} tone={rate >= 90 ? "green" : rate >= 75 ? "orange" : "red"} />
                        <span className="w-14 shrink-0 text-right text-xs font-semibold whitespace-nowrap tabular-nums">{rate.toLocaleString("fr-FR")} %</span>
                      </div>
                    </td>
                    <td className="py-3 pl-4 text-right text-xs whitespace-nowrap tabular-nums">{formatDjf(revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card>
          <CardHeader title="Incidents par type" subtitle={`${scopedIncidents.length} déclarations enregistrées`} />
          <div className="px-5 pb-5">
            <Donut data={byType} centerLabel="incidents" height={180} vertical />
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Utilisation par véhicule" subtitle="Missions réalisées par camion (données du jeu de démonstration)" />
        <div className="px-3 pb-4">
          <BarsChart
            layout="vertical"
            height={Math.max(220, Math.min(fleetTrucks.length, 12) * 30)}
            data={fleetTrucks
              .map((t) => ({ label: t.plate, missions: (scope ? missions : all.missions).filter((m) => m.truckId === t.id).length, owner: lookups.company(t.companyId)?.initials }))
              .sort((a, b) => b.missions - a.missions)
              .slice(0, 12)}
            xKey="label"
            series={[{ key: "missions", name: "Missions", color: SERIES.blue }]}
          />
        </div>
      </Card>
    </div>
  );
}

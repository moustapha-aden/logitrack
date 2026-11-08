"use client";

import type { ReactNode } from "react";
import { ArrowRight, SearchX } from "lucide-react";
import { MISSION_STATUS } from "@/lib/constants";
import { placeName } from "@/lib/data/geo";
import { useData } from "@/lib/store/selectors";
import { cn, formatDateShort, formatTime, missionStatus } from "@/lib/utils";
import type { Mission } from "@/types";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/misc";
import { StepProgress } from "@/components/operations/timeline";
import { useDetail } from "./detail-provider";

export function DetailSection({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card", className)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

export function NotFound() {
  return <EmptyState icon={SearchX} title="Élément introuvable" message="Cet élément a peut-être été supprimé." />;
}

export function MiniStat({ label, value, tone }: { label: string; value: ReactNode; tone?: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2.5">
      <p className={cn("text-lg font-semibold tabular-nums", tone ?? "text-ink")}>{value}</p>
      <p className="text-[11px] text-slate-500">{label}</p>
    </div>
  );
}

/** Ligne compacte de mission cliquable (ouvre la fiche). */
export function MissionRow({ mission, showCompany }: { mission: Mission; showCompany?: boolean }) {
  const { open } = useDetail();
  const { lookups } = useData();
  const truck = lookups.truck(mission.truckId);
  return (
    <button onClick={() => open({ kind: "mission", id: mission.id })} className="group w-full rounded-xl border border-slate-100 p-3 text-left transition hover:border-brand-100 hover:bg-brand-50/30">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-semibold text-slate-500">{mission.ref}</span>
        <StatusBadge map={MISSION_STATUS} value={missionStatus(mission)} />
      </div>
      <p className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-ink">
        {placeName(mission.origin)} <ArrowRight className="size-3.5 text-slate-400" /> {placeName(mission.destination)}
      </p>
      <p className="mt-0.5 truncate text-xs text-slate-500">
        {formatDateShort(mission.plannedDeparture)} · {formatTime(mission.plannedDeparture)}
        {truck && ` · ${truck.plate}`}
        {showCompany && ` · ${lookups.company(mission.companyId)?.name ?? ""}`}
      </p>
      <div className="mt-2.5">
        <StepProgress step={mission.step} delayed={mission.delayed} />
      </div>
    </button>
  );
}

export function EntityLink({ label, sub, onClick, leading }: { label: ReactNode; sub?: ReactNode; onClick?: () => void; leading?: ReactNode }) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp onClick={onClick} className={cn("flex w-full items-center gap-3 rounded-xl border border-slate-100 p-2.5 text-left", onClick && "transition hover:border-brand-100 hover:bg-brand-50/30")}>
      {leading}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{label}</p>
        {sub && <p className="truncate text-xs text-slate-500">{sub}</p>}
      </div>
      {onClick && <ArrowRight className="size-4 shrink-0 text-slate-300" />}
    </Comp>
  );
}

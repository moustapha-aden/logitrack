import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import type { Tone } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { toneSoftBg } from "./badge";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("min-w-0 rounded-2xl border border-slate-200/80 bg-white shadow-card", className)}>{children}</div>;
}

export function CardHeader({ title, subtitle, action, icon: Icon, className }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode; icon?: LucideIcon; className?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-3 px-5 pt-5 pb-3", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <Icon className="size-4" aria-hidden />
          </span>
        )}
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "blue",
  hint,
  trend,
  onClick,
}: {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  tone?: Tone;
  hint?: string;
  trend?: { value: string; up: boolean; good?: boolean };
  onClick?: () => void;
}) {
  const Comp = onClick ? "button" : "div";
  const good = trend ? (trend.good ?? trend.up) : true;
  return (
    <Comp
      onClick={onClick}
      className={cn(
        "group flex w-full flex-col rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-card transition-all",
        onClick && "hover:-translate-y-0.5 hover:border-brand-100 hover:shadow-pop",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={cn("inline-flex size-10 items-center justify-center rounded-xl", toneSoftBg[tone])}>
          <Icon className="size-5" aria-hidden />
        </span>
        {trend && (
          <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", good ? "bg-success-50 text-success-700" : "bg-red-50 text-red-600")}>
            {trend.up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            {trend.value}
          </span>
        )}
      </div>
      <div className="mt-4 text-2xl font-semibold tracking-tight text-ink tabular-nums">{value}</div>
      <div className="mt-0.5 text-sm font-medium text-slate-600">{label}</div>
      {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
    </Comp>
  );
}

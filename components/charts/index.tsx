"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatNumber } from "@/lib/utils";

// Palette catégorielle validée (ordre fixe) : bleu, vert, ambre
export const SERIES = { blue: "#2563EB", green: "#0F9F83", amber: "#F59E0B", navy: "#101E35", gray: "#94A3B8", red: "#EF4444" };
const AXIS = { fontSize: 11, fill: "#94A3B8" };
const GRID = "#EEF2F7";

interface TooltipEntry {
  name?: string | number;
  value?: unknown;
  color?: string;
  dataKey?: unknown;
}

function ChartTooltip({ active, payload, label, unit = "" }: { active?: boolean; payload?: ReadonlyArray<TooltipEntry>; label?: unknown; unit?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-pop">
      {label !== undefined && <p className="mb-1 font-semibold text-ink">{String(label)}</p>}
      {payload.map((p) => (
        <p key={String(p.dataKey ?? p.name)} className="flex items-center gap-2 text-slate-600">
          <span className="size-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span>{p.name}</span>
          <span className="ml-auto pl-3 font-semibold text-ink tabular-nums">
            {typeof p.value === "number" ? formatNumber(p.value) : String(p.value)}
            {unit}
          </span>
        </p>
      ))}
    </div>
  );
}

function LegendText(value: string) {
  return <span className="text-xs text-slate-600">{value}</span>;
}

export interface SeriesDef {
  key: string;
  name: string;
  color: string;
}

export function AreaTrend({ data, xKey, series, height = 260, unit }: { data: object[]; xKey: string; series: SeriesDef[]; height?: number; unit?: string }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={0.18} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey={xKey} tick={AXIS} tickLine={false} axisLine={false} minTickGap={16} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip content={<ChartTooltip unit={unit} />} cursor={{ stroke: "#CBD5E1", strokeDasharray: "4 4" }} />
        {series.length > 1 && <Legend iconType="circle" iconSize={8} formatter={LegendText} wrapperStyle={{ paddingTop: 8 }} />}
        {series.map((s) => (
          <Area key={s.key} isAnimationActive={false} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2} fill={`url(#grad-${s.key})`} activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }} />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function BarsChart({ data, xKey, series, height = 260, unit, stacked, layout = "horizontal" }: { data: object[]; xKey: string; series: SeriesDef[]; height?: number; unit?: string; stacked?: boolean; layout?: "horizontal" | "vertical" }) {
  const vertical = layout === "vertical";
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout={layout} margin={{ top: 8, right: 12, left: vertical ? 8 : -18, bottom: 0 }} barGap={2}>
        <CartesianGrid stroke={GRID} vertical={vertical} horizontal={!vertical} />
        {vertical ? (
          <>
            <XAxis type="number" tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} />
            <YAxis type="category" dataKey={xKey} tick={{ ...AXIS, fill: "#475569" }} tickLine={false} axisLine={false} width={120} />
          </>
        ) : (
          <>
            <XAxis dataKey={xKey} tick={AXIS} tickLine={false} axisLine={false} />
            <YAxis tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} />
          </>
        )}
        <Tooltip content={<ChartTooltip unit={unit} />} cursor={{ fill: "#F1F5F9" }} />
        {series.length > 1 && <Legend iconType="circle" iconSize={8} formatter={LegendText} wrapperStyle={{ paddingTop: 8 }} />}
        {series.map((s) => (
          <Bar key={s.key} isAnimationActive={false} dataKey={s.key} name={s.name} fill={s.color} stackId={stacked ? "a" : undefined} radius={stacked ? 0 : vertical ? [0, 4, 4, 0] : [4, 4, 0, 0]} maxBarSize={vertical ? 18 : 28} stroke="#fff" strokeWidth={stacked ? 1 : 0} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function LineTrend({ data, xKey, series, height = 260, unit, domain }: { data: object[]; xKey: string; series: SeriesDef[]; height?: number; unit?: string; domain?: [number, number] }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey={xKey} tick={AXIS} tickLine={false} axisLine={false} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} domain={domain} unit={unit} />
        <Tooltip content={<ChartTooltip unit={unit} />} cursor={{ stroke: "#CBD5E1", strokeDasharray: "4 4" }} />
        {series.length > 1 && <Legend iconType="circle" iconSize={8} formatter={LegendText} wrapperStyle={{ paddingTop: 8 }} />}
        {series.map((s) => (
          <Line key={s.key} isAnimationActive={false} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2} dot={{ r: 3, strokeWidth: 2, stroke: "#fff", fill: s.color }} activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export interface DonutSlice {
  name: string;
  value: number;
  color: string;
}

/** Anneau avec total central et légende chiffrée (identité jamais portée par la seule couleur). */
export function Donut({ data, centerLabel, height = 200, vertical }: { data: DonutSlice[]; centerLabel: string; height?: number; vertical?: boolean }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className={vertical ? "flex flex-col items-center gap-4" : "flex flex-col items-center gap-4 sm:flex-row"}>
      <div className="relative w-full max-w-[200px]" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius="68%" outerRadius="100%" paddingAngle={2} stroke="#fff" strokeWidth={2} isAnimationActive={false}>
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold text-ink tabular-nums">{total}</span>
          <span className="text-[11px] text-slate-500">{centerLabel}</span>
        </div>
      </div>
      <ul className="w-full flex-1 space-y-2">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2.5 text-sm">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="flex-1 text-slate-600">{d.name}</span>
            <span className="font-semibold text-ink tabular-nums">{d.value}</span>
            <span className="w-10 text-right text-xs text-slate-400 tabular-nums">{total ? Math.round((d.value / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

import type { ReactNode } from "react";
import type { Meta, Tone } from "@/lib/constants";
import { cn } from "@/lib/utils";

const tones: Record<Tone, { bg: string; dot: string }> = {
  neutral: { bg: "bg-slate-100 text-slate-700 ring-slate-200", dot: "bg-slate-400" },
  blue: { bg: "bg-brand-50 text-brand-700 ring-brand-100", dot: "bg-brand-600" },
  green: { bg: "bg-success-50 text-success-700 ring-success-100", dot: "bg-success-600" },
  orange: { bg: "bg-amber-50 text-amber-700 ring-amber-200", dot: "bg-amber-500" },
  red: { bg: "bg-red-50 text-red-700 ring-red-200", dot: "bg-red-500" },
  navy: { bg: "bg-navy-900/5 text-navy-900 ring-navy-900/10", dot: "bg-navy-900" },
  violet: { bg: "bg-violet-50 text-violet-700 ring-violet-200", dot: "bg-violet-500" },
};

export function Badge({ tone = "neutral", dot = true, children, className }: { tone?: Tone; dot?: boolean; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", tones[tone].bg, className)}>
      {dot && <span className={cn("size-1.5 rounded-full", tones[tone].dot)} aria-hidden />}
      {children}
    </span>
  );
}

/** Badge à partir d'un dictionnaire de statuts (label + ton). */
export function StatusBadge<K extends string>({ map, value, className }: { map: Record<K, Meta>; value: K; className?: string }) {
  const meta = map[value];
  if (!meta) return null;
  return (
    <Badge tone={meta.tone} className={className}>
      {meta.label}
    </Badge>
  );
}

export const toneText: Record<Tone, string> = {
  neutral: "text-slate-600",
  blue: "text-brand-600",
  green: "text-success-600",
  orange: "text-amber-600",
  red: "text-red-600",
  navy: "text-navy-900",
  violet: "text-violet-600",
};

export const toneSoftBg: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-600",
  blue: "bg-brand-50 text-brand-600",
  green: "bg-success-50 text-success-600",
  orange: "bg-amber-50 text-amber-600",
  red: "bg-red-50 text-red-600",
  navy: "bg-navy-900/5 text-navy-900",
  violet: "bg-violet-50 text-violet-600",
};

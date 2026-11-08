"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Inbox, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({ title, description, actions, eyebrow }: { title: string; description?: string; actions?: ReactNode; eyebrow?: string }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-xs font-semibold tracking-wider text-brand-600 uppercase">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = "Rechercher…", className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-10 w-full rounded-lg border border-slate-200 bg-white pr-8 pl-9 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:outline-none"
      />
      {value && (
        <button onClick={() => onChange("")} className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-ink" aria-label="Effacer la recherche">
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

export function FilterSelect<T extends string>({ value, onChange, options, label, className }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; label: string; className?: string }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      aria-label={label}
      className={cn(
        "h-10 cursor-pointer rounded-lg border border-slate-200 bg-white pr-8 pl-3 text-sm text-ink focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:outline-none",
        className,
      )}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Toolbar({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-2 p-4 sm:flex-row sm:flex-wrap sm:items-center">{children}</div>;
}

export function Segmented<T extends string>({ value, onChange, options, size = "md" }: { value: T; onChange: (v: T) => void; options: { value: T; label: string; count?: number }[]; size?: "sm" | "md" }) {
  return (
    <div className="scroll-thin flex max-w-full gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-lg font-medium whitespace-nowrap transition",
            size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm",
            value === o.value ? "bg-white text-ink shadow-sm" : "text-slate-500 hover:text-ink",
          )}
        >
          {o.label}
          {o.count !== undefined && <span className={cn("rounded-full px-1.5 text-[11px] tabular-nums", value === o.value ? "bg-brand-50 text-brand-700" : "bg-slate-200/70 text-slate-500")}>{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, message, action }: { icon?: LucideIcon; title: string; message?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Icon className="size-6" />
      </span>
      <p className="mt-4 text-sm font-semibold text-ink">{title}</p>
      {message && <p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ProgressBar({ value, tone = "blue", className }: { value: number; tone?: "blue" | "green" | "orange" | "red"; className?: string }) {
  const colors = { blue: "bg-brand-600", green: "bg-success-600", orange: "bg-amber-500", red: "bg-red-500" };
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-slate-100", className)}>
      <div className={cn("h-full rounded-full transition-all duration-500", colors[tone])} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function InfoRow({ label, value, icon: Icon }: { label: string; value: ReactNode; icon?: LucideIcon }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 text-sm">
      <span className="flex items-center gap-2 text-slate-500">
        {Icon && <Icon className="size-4 text-slate-400" aria-hidden />}
        {label}
      </span>
      <span className="text-right font-medium text-ink">{value}</span>
    </div>
  );
}

export function LinkButton({ children, onClick, className }: { children: ReactNode; onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn("font-medium text-ink decoration-brand-600/40 underline-offset-2 hover:text-brand-600 hover:underline", className)}
    >
      {children}
    </button>
  );
}

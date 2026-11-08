import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("size-9", className)} aria-hidden>
      <rect width="40" height="40" rx="11" fill="#2563EB" />
      <path d="M11 27.5c4.5 0 5.5-6.5 9-6.5s4.5 4 9 4" fill="none" stroke="#fff" strokeOpacity=".45" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M11 12v10.5a3 3 0 0 0 3 3h3" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="28.5" cy="13.5" r="3.5" fill="#0F9F83" stroke="#fff" strokeWidth="2" />
    </svg>
  );
}

export function Logo({ dark, className, subtitle }: { dark?: boolean; className?: string; subtitle?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="leading-tight">
        <span className={cn("block text-[17px] font-bold tracking-tight", dark ? "text-white" : "text-navy-900")}>
          Logi<span className="text-brand-500">Track</span>
        </span>
        {subtitle && <span className={cn("block text-[11px] font-medium", dark ? "text-white/50" : "text-slate-400")}>{subtitle}</span>}
      </span>
    </span>
  );
}

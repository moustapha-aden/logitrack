"use client";

import { useLayoutEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsUpDown, FlaskConical, X } from "lucide-react";
import { actions, setActor, useAppData } from "@/lib/store";
import { ScopeContext, useData } from "@/lib/store/selectors";
import { COMPANY_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { CompanyLogo } from "@/components/ui/media";
import { useToast } from "@/components/ui/toast";
import { DetailProvider } from "@/components/details/detail-provider";
import { Header } from "./header";
import { Logo } from "./logo";
import { ADMIN_NAV, COMPANY_NAV, type NavGroup, type NavItem } from "./nav";

type Variant = "admin" | "company";

function useBadgeCount(badge: NavItem["badge"]): number {
  const { incidents, notifications, missions } = useData();
  if (badge === "incidents") return incidents.filter((i) => i.status === "nouveau").length;
  if (badge === "notifications") return notifications.filter((n) => !n.read).length;
  if (badge === "delayed") return missions.filter((m) => m.delayed && m.step < 6).length;
  return 0;
}

function NavLink({ item, active, variant, onNavigate }: { item: NavItem; active: boolean; variant: Variant; onNavigate: () => void }) {
  const count = useBadgeCount(item.badge);
  const dark = variant === "admin";
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all",
        dark
          ? active
            ? "bg-white/10 text-white shadow-[inset_2px_0_0_0_#3b82f6]"
            : "text-slate-400 hover:bg-white/5 hover:text-white"
          : active
            ? "bg-success-50 text-success-700"
            : "text-slate-500 hover:bg-slate-100 hover:text-ink",
      )}
    >
      <item.icon className={cn("size-[18px] shrink-0", dark ? (active ? "text-brand-500" : "text-slate-500 group-hover:text-slate-300") : active ? "text-success-600" : "text-slate-400")} />
      <span className="flex-1 truncate">{item.label}</span>
      {count > 0 && (
        <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums", item.badge === "incidents" ? "bg-red-500 text-white" : item.badge === "delayed" ? "bg-amber-500 text-white" : dark ? "bg-brand-600 text-white" : "bg-brand-600 text-white")}>{count}</span>
      )}
    </Link>
  );
}

function CompanySwitcher() {
  const data = useAppData();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const current = data.companies.find((c) => c.id === data.prefs.companyId);
  const options = data.companies.filter((c) => c.type !== "client" && c.status === "actif");
  return (
    <div className="relative px-3">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-2.5 text-left shadow-card transition hover:border-slate-300" aria-label="Changer d'entreprise">
        <CompanyLogo company={current} size="sm" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-ink">{current?.name}</span>
          <span className="block text-[11px] text-slate-500">{current ? COMPANY_TYPES[current.type].label : ""}</span>
        </span>
        <ChevronsUpDown className="size-4 text-slate-400" />
      </button>
      {open && (
        <div className="absolute inset-x-3 top-full z-50 mt-1 animate-scale-in rounded-xl border border-slate-200 bg-white p-1.5 shadow-pop">
          <p className="px-2.5 pt-1.5 pb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">Simuler l&apos;espace de</p>
          {options.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                actions.setPrefs({ companyId: c.id });
                setOpen(false);
                toast("Espace entreprise changé", { message: c.name, tone: "info" });
              }}
              className={cn("flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-slate-50", c.id === current?.id && "bg-success-50")}
            >
              <CompanyLogo company={c} size="xs" />
              <span className="truncate">{c.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Sidebar({ variant, groups, onNavigate }: { variant: Variant; groups: NavGroup[]; onNavigate: () => void }) {
  const pathname = usePathname();
  const dark = variant === "admin";
  const isActive = (href: string) => (href === "/entreprise" || href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));

  return (
    <div className={cn("flex h-full flex-col", dark ? "bg-navy-900" : "border-r border-slate-200 bg-white")}>
      <div className="flex h-16 shrink-0 items-center px-5">
        <Link href="/" onClick={onNavigate}>
          <Logo dark={dark} subtitle={dark ? "Administration plateforme" : "Espace entreprise"} />
        </Link>
      </div>
      {variant === "company" && (
        <div className="pt-1 pb-3">
          <CompanySwitcher />
        </div>
      )}
      <nav className="scroll-thin flex-1 space-y-5 overflow-y-auto px-3 py-3" aria-label="Navigation principale">
        {groups.map((g) => (
          <div key={g.title}>
            <p className={cn("mb-1.5 px-3 text-[10px] font-semibold tracking-[0.12em] uppercase", dark ? "text-slate-500" : "text-slate-400")}>{g.title}</p>
            <div className="space-y-0.5">
              {g.items.map((it) => (
                <NavLink key={it.href} item={it} active={isActive(it.href)} variant={variant} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="p-3">
        <div className={cn("rounded-xl p-3 text-xs", dark ? "bg-white/5 text-slate-400" : "bg-slate-50 text-slate-500")}>
          <p className={cn("flex items-center gap-1.5 font-semibold", dark ? "text-slate-200" : "text-ink")}>
            <FlaskConical className="size-3.5 text-amber-500" /> Prototype de démonstration
          </p>
          <p className="mt-1 leading-relaxed">Données entièrement fictives. Aucune donnée réelle n&apos;est collectée.</p>
        </div>
      </div>
    </div>
  );
}

function ShellInner({ variant, children }: { variant: Variant; children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const data = useAppData();
  const groups = variant === "admin" ? ADMIN_NAV : COMPANY_NAV;
  const company = data.companies.find((c) => c.id === data.prefs.companyId);
  const close = () => setMobileOpen(false);
  const actorName = variant === "admin" ? data.settings.userName : `Exploitation ${company?.initials ?? ""}`;
  // auteur des actions (activité, historique) selon l'espace affiché
  useLayoutEffect(() => setActor(actorName), [actorName]);

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] lg:block">
        <Sidebar variant={variant} groups={groups} onNavigate={close} />
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-navy-950/50" onClick={close} />
          <div className="absolute inset-y-0 left-0 w-[280px] animate-slide-up shadow-pop">
            <Sidebar variant={variant} groups={groups} onNavigate={close} />
            <button onClick={close} className="absolute top-4 -right-12 rounded-full bg-white p-2 text-slate-600 shadow" aria-label="Fermer le menu">
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}
      <div className="lg:pl-[264px]">
        <Header
          onMenu={() => setMobileOpen(true)}
          userName={variant === "admin" ? data.settings.userName : (company?.manager ?? "")}
          userRole={variant === "admin" ? "Administrateur plateforme" : `Responsable · ${company?.initials ?? ""}`}
          userColor={variant === "admin" ? "#101E35" : (company?.color ?? "#0F9F83")}
          notificationsHref={variant === "admin" ? "/notifications" : "/entreprise/notifications"}
          variant={variant}
        />
        <main className="mx-auto w-full max-w-[1440px] animate-fade-in px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

export function AppShell({ variant, children }: { variant: Variant; children: ReactNode }) {
  const data = useAppData();
  const scope = variant === "company" ? data.prefs.companyId : null;
  return (
    <ScopeContext.Provider value={scope}>
      <DetailProvider>
        <ShellInner variant={variant}>{children}</ShellInner>
      </DetailProvider>
    </ScopeContext.Provider>
  );
}

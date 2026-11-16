"use client";

import { useLayoutEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsUpDown, FlaskConical, ShieldOff, X } from "lucide-react";
import { actions, setActor, setActorRole, useAppData } from "@/lib/store";
import { ScopeContext, useData, usePermissions } from "@/lib/store/selectors";
import { COMPANY_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { CompanyLogo } from "@/components/ui/media";
import { useToast } from "@/components/ui/toast";
import { DetailProvider } from "@/components/details/detail-provider";
import { Header } from "./header";
import { Logo } from "./logo";
import { ADMIN_NAV, COMPANY_NAV, type NavGroup, type NavItem } from "./nav";
import { isBlockingOpen, isOverdue } from "@/lib/utils/documents";
import { isOverdueInvoice } from "@/lib/utils/invoices";

type Variant = "admin" | "company";

function useBadgeCount(badge: NavItem["badge"]): number {
  const { incidents, notifications, missions, documents, invoices } = useData();
  if (badge === "incidents") return incidents.filter((i) => i.status === "nouveau").length;
  if (badge === "notifications") return notifications.filter((n) => !n.read).length;
  if (badge === "delayed") return missions.filter((m) => m.delayed && m.step < 6).length;
  if (badge === "documents") {
    const stepOf = new Map(missions.map((m) => [m.id, m.step]));
    return documents.filter((d) => {
      const step = stepOf.get(d.missionId) ?? 7;
      return step < 7 && (isOverdue(d) || d.status === "a_corriger" || (isBlockingOpen(d, step) && d.status === "recu"));
    }).length;
  }
  if (badge === "invoices") return invoices.filter(isOverdueInvoice).length;
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
        <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums", item.badge === "incidents" || item.badge === "documents" || item.badge === "invoices" ? "bg-red-500 text-white" : item.badge === "delayed" ? "bg-amber-500 text-white" : dark ? "bg-brand-600 text-white" : "bg-brand-600 text-white")}>{count}</span>
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

/** Compte désactivé : l'accès est retiré immédiatement, même pour une session ouverte. */
function AccessRevoked({ title, message }: { title: string; message: string }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-card">
      <ShieldOff className="mx-auto size-10 text-red-400" />
      <h1 className="mt-4 text-lg font-semibold">{title}</h1>
      <p className="mt-1 text-sm text-slate-500">{message}</p>
    </div>
  );
}

function Sidebar({ variant, groups: allGroups, onNavigate }: { variant: Variant; groups: NavGroup[]; onNavigate: () => void }) {
  const pathname = usePathname();
  const { can } = usePermissions();
  // le menu n'affiche que les entrées autorisées pour le rôle courant
  const groups = allGroups.map((g) => ({ ...g, items: g.items.filter((it) => !it.perm || can(it.perm)) })).filter((g) => g.items.length > 0);
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
  const perms = usePermissions();
  const companyInactive = variant === "company" && !!company && company.status !== "actif";
  // auteur et rôle des actions (activité, historique, journal d'audit) selon l'utilisateur courant
  useLayoutEffect(() => {
    setActor(perms.actor);
    setActorRole(perms.roleLabel);
  }, [perms.actor, perms.roleLabel]);

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] lg:block">
        <Sidebar variant={variant} groups={groups} onNavigate={close} />
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-navy-950/50" onClick={close} />
          <div className="absolute inset-y-0 left-0 w-[min(280px,calc(100vw-3rem))] animate-slide-up shadow-pop">
            <Sidebar variant={variant} groups={groups} onNavigate={close} />
            <button onClick={close} className="absolute top-3 right-3 z-10 rounded-full bg-white p-2 text-slate-600 shadow" aria-label="Fermer le menu">
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}
      <div className="lg:pl-[264px]">
        <Header
          onMenu={() => setMobileOpen(true)}
          userName={variant === "admin" ? data.settings.userName : (perms.user?.name ?? company?.manager ?? "")}
          userRole={variant === "admin" ? "Administrateur plateforme" : `${perms.roleLabel} · ${company?.initials ?? ""}`}
          userColor={variant === "admin" ? "#101E35" : (company?.color ?? "#0F9F83")}
          notificationsHref={variant === "admin" ? "/notifications" : "/entreprise/notifications"}
          variant={variant}
          locked={!perms.active || companyInactive}
        />
        <main className="mx-auto w-full max-w-[1440px] animate-fade-in px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {companyInactive ? (
            <AccessRevoked title="Entreprise désactivée" message={`${company?.name ?? "Cette entreprise"} a été désactivée par l'administration de la plateforme : son espace est en lecture fermée. Choisissez une autre entreprise dans le menu de gauche.`} />
          ) : perms.active ? (
            children
          ) : (
            <AccessRevoked title="Accès retiré" message={`Le compte ${perms.user ? `de ${perms.user.name} ` : ""}a été désactivé par l'administrateur de l'entreprise. Changez d'utilisateur depuis le menu du profil (simulation).`} />
          )}
        </main>
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

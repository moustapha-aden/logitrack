"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  Building2,
  CheckCheck,
  ChevronDown,
  Home,
  IdCard,
  LogOut,
  Menu,
  Route,
  Search,
  Settings,
  ShieldCheck,
  Smartphone,
  Truck,
} from "lucide-react";
import { actions } from "@/lib/store";
import { useData } from "@/lib/store/selectors";
import { NOTIFICATION_KINDS } from "@/lib/constants";
import { placeName } from "@/lib/data/geo";
import { cn, driverName, formatDateTime, includesText, initials } from "@/lib/utils";
import type { EntityRef } from "@/types";
import { toneSoftBg } from "@/components/ui/badge";
import { useDetail } from "@/components/details/detail-provider";

function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);
  // ferme le menu quand la page est masquée par Next.js (Activity)
  useLayoutEffect(() => () => setOpen(false), []);
  return { open, setOpen, ref };
}

// ── Recherche globale ────────────────────────────────────────
function GlobalSearch() {
  const { missions, trucks, drivers, companies, incidents, lookups } = useData();
  const { open: openDetail } = useDetail();
  const { open: popOpen, setOpen: setPopOpen, ref: popRef } = usePopover();
  const [q, setQ] = useState("");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        input.current?.focus();
        setPopOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setPopOpen]);

  const results = useMemo(() => {
    if (q.trim().length < 2) return [];
    const out: { ref: EntityRef; title: string; sub: string; icon: typeof Truck; group: string }[] = [];
    missions
      .filter((m) => includesText([m.ref, placeName(m.origin), placeName(m.destination), m.description, lookups.company(m.clientId)?.name], q))
      .slice(0, 4)
      .forEach((m) => out.push({ ref: { kind: "mission", id: m.id }, title: m.ref, sub: `${placeName(m.origin)} → ${placeName(m.destination)}`, icon: Route, group: "Missions" }));
    trucks
      .filter((t) => includesText([t.plate, t.brand, t.model], q))
      .slice(0, 4)
      .forEach((t) => out.push({ ref: { kind: "truck", id: t.id }, title: t.plate, sub: `${t.brand} ${t.model}`, icon: Truck, group: "Camions" }));
    drivers
      .filter((d) => includesText([driverName(d), d.phone, d.licenseNumber], q))
      .slice(0, 4)
      .forEach((d) => out.push({ ref: { kind: "driver", id: d.id }, title: driverName(d), sub: d.phone, icon: IdCard, group: "Chauffeurs" }));
    companies
      .filter((c) => includesText([c.name, c.manager], q))
      .slice(0, 3)
      .forEach((c) => out.push({ ref: { kind: "company", id: c.id }, title: c.name, sub: c.manager, icon: Building2, group: "Entreprises" }));
    incidents
      .filter((i) => includesText([i.ref, i.description, i.location], q))
      .slice(0, 3)
      .forEach((i) => out.push({ ref: { kind: "incident", id: i.id }, title: i.ref, sub: i.description, icon: AlertTriangle, group: "Incidents" }));
    return out;
  }, [q, missions, trucks, drivers, companies, incidents, lookups]);

  const groups = [...new Set(results.map((r) => r.group))];

  return (
    <div ref={popRef} className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
      <input
        ref={input}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setPopOpen(true);
        }}
        onFocus={() => setPopOpen(true)}
        placeholder="Rechercher une mission, un camion, un chauffeur…"
        aria-label="Recherche globale"
        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pr-14 pl-9 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 focus:outline-none"
      />
      <kbd className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 sm:block">Ctrl K</kbd>
      {popOpen && q.trim().length >= 2 && (
        <div className="absolute top-12 right-0 left-0 z-50 max-h-[70vh] animate-scale-in overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-pop">
          {results.length === 0 && <p className="px-3 py-6 text-center text-sm text-slate-500">Aucun résultat pour « {q} »</p>}
          {groups.map((g) => (
            <div key={g} className="mb-1">
              <p className="px-2.5 pt-2 pb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">{g}</p>
              {results
                .filter((r) => r.group === g)
                .map((r) => (
                  <button
                    key={r.ref.id}
                    onClick={() => {
                      openDetail(r.ref);
                      setPopOpen(false);
                      setQ("");
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-slate-50"
                  >
                    <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                      <r.icon className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-ink">{r.title}</span>
                      <span className="block truncate text-xs text-slate-500">{r.sub}</span>
                    </span>
                  </button>
                ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Notifications ────────────────────────────────────────────
function NotificationsMenu({ allHref }: { allHref?: string }) {
  const { notifications, scope } = useData();
  const { open: openDetail } = useDetail();
  const { open: popOpen, setOpen: setPopOpen, ref: popRef } = usePopover();
  const unread = notifications.filter((n) => !n.read).length;
  const recent = [...notifications].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6);

  return (
    <div ref={popRef} className="relative">
      <button onClick={() => setPopOpen(!popOpen)} className="relative inline-flex size-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-ink" aria-label={`Notifications (${unread} non lues)`}>
        <Bell className="size-5" />
        {unread > 0 && <span className="absolute top-1.5 right-1.5 inline-flex min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white ring-2 ring-white">{unread}</span>}
      </button>
      {popOpen && (
        <div className="fixed inset-x-3 top-16 z-50 animate-scale-in rounded-2xl border border-slate-200 bg-white shadow-pop sm:absolute sm:inset-x-auto sm:top-12 sm:right-0 sm:w-96">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold">
              Notifications {unread > 0 && <span className="ml-1 rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-600">{unread} nouvelles</span>}
            </p>
            <button onClick={() => actions.markAllNotificationsRead(scope)} className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 disabled:opacity-40" disabled={unread === 0}>
              <CheckCheck className="size-3.5" /> Tout marquer comme lu
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto p-1.5">
            {recent.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  actions.markNotificationRead(n.id);
                  if (n.link) openDetail(n.link);
                  setPopOpen(false);
                }}
                className={cn("flex w-full gap-3 rounded-xl px-2.5 py-2.5 text-left transition hover:bg-slate-50", !n.read && "bg-brand-50/40")}
              >
                <span className={cn("mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg", toneSoftBg[NOTIFICATION_KINDS[n.kind].tone])}>
                  {n.kind === "incident" || n.kind === "retard" ? <AlertTriangle className="size-4" /> : n.kind === "flotte" ? <Truck className="size-4" /> : n.kind === "mission" ? <Route className="size-4" /> : <Bell className="size-4" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-ink">{n.title}</span>
                    {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-600" />}
                  </span>
                  <span className="mt-0.5 line-clamp-2 block text-xs text-slate-500">{n.message}</span>
                  <span className="mt-1 block text-[11px] text-slate-400">{formatDateTime(n.at)}</span>
                </span>
              </button>
            ))}
            {recent.length === 0 && <p className="px-3 py-8 text-center text-sm text-slate-500">Aucune notification.</p>}
          </div>
          {allHref && (
            <Link href={allHref} onClick={() => setPopOpen(false)} className="block border-t border-slate-100 px-4 py-2.5 text-center text-xs font-semibold text-brand-600 hover:bg-slate-50">
              Voir toutes les notifications
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

// ── Profil utilisateur ───────────────────────────────────────
function UserMenu({ name, role, color, variant }: { name: string; role: string; color: string; variant: "admin" | "company" }) {
  const { open: popOpen, setOpen: setPopOpen, ref: popRef } = usePopover();
  const router = useRouter();
  const items = [
    { label: "Administration", href: "/dashboard", icon: ShieldCheck },
    { label: "Espace entreprise", href: "/entreprise", icon: Building2 },
    { label: "Espace chauffeur", href: "/chauffeur", icon: Smartphone },
    ...(variant === "admin" ? [{ label: "Paramètres", href: "/parametres", icon: Settings }] : []),
    { label: "Page de présentation", href: "/", icon: Home },
  ];
  return (
    <div ref={popRef} className="relative">
      <button onClick={() => setPopOpen(!popOpen)} className="flex items-center gap-2.5 rounded-xl p-1 pr-2 transition hover:bg-slate-100" aria-label="Menu du profil">
        <span className="inline-flex size-8 items-center justify-center rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: color }}>
          {initials(name)}
        </span>
        <span className="hidden text-left leading-tight md:block">
          <span className="block max-w-36 truncate text-sm font-semibold text-ink">{name}</span>
          <span className="block text-[11px] text-slate-500">{role}</span>
        </span>
        <ChevronDown className="hidden size-4 text-slate-400 md:block" />
      </button>
      {popOpen && (
        <div className="absolute top-12 right-0 z-50 w-60 animate-scale-in rounded-2xl border border-slate-200 bg-white p-1.5 shadow-pop">
          <div className="border-b border-slate-100 px-3 py-2.5">
            <p className="text-sm font-semibold">{name}</p>
            <p className="text-xs text-slate-500">{role}</p>
          </div>
          <p className="px-3 pt-2.5 pb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">Changer d&apos;espace</p>
          {items.map((it) => (
            <Link key={it.href} href={it.href} onClick={() => setPopOpen(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-ink">
              <it.icon className="size-4 text-slate-400" /> {it.label}
            </Link>
          ))}
          <button
            onClick={() => {
              try {
                window.localStorage.removeItem("logitrack:session");
              } catch {
                /* ignore */
              }
              router.push("/login");
            }}
            className="mt-1 flex w-full items-center gap-2.5 rounded-lg border-t border-slate-100 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut className="size-4" /> Déconnexion
          </button>
        </div>
      )}
    </div>
  );
}

export function Header({ onMenu, userName, userRole, userColor, notificationsHref, leading, variant }: { onMenu: () => void; userName: string; userRole: string; userColor: string; notificationsHref?: string; leading?: React.ReactNode; variant: "admin" | "company" }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur-md sm:px-6">
      <button onClick={onMenu} className="inline-flex size-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Ouvrir le menu">
        <Menu className="size-5" />
      </button>
      {leading}
      <div className="hidden flex-1 sm:block">
        <GlobalSearch />
      </div>
      <div className="flex flex-1 justify-end sm:hidden">
        <MobileSearchButton />
      </div>
      <div className="flex items-center gap-1">
        <NotificationsMenu allHref={notificationsHref} />
        <UserMenu name={userName} role={userRole} color={userColor} variant={variant} />
      </div>
    </header>
  );
}

function MobileSearchButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="inline-flex size-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100" aria-label="Rechercher">
        <Search className="size-5" />
      </button>
      {open && (
        <div className="fixed inset-x-0 top-0 z-50 flex animate-slide-up items-center gap-2 border-b border-slate-200 bg-white p-3 shadow-pop">
          <GlobalSearch />
          <button onClick={() => setOpen(false)} className="shrink-0 px-2 text-sm font-medium text-slate-500">
            Fermer
          </button>
        </div>
      )}
    </>
  );
}

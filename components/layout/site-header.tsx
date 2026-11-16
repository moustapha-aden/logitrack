"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";

/** Menu du site public, identique sur toutes les pages publiques (accueil, annuaire). */
const LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/#espaces", label: "Espaces" },
  { href: "/#fonctionnalites", label: "Fonctionnalités" },
  { href: "/#suivi", label: "Suivi" },
  { href: "/marketing", label: "Annuaire des transporteurs" },
];

/**
 * En-tête du site public.
 * `overlay` : posé sur une image sombre (page d'accueil) ; sinon barre blanche fixe.
 */
export function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => (href === "/" ? pathname === "/" : !href.includes("#") && pathname.startsWith(href));

  return (
    <header className={cn("z-40", overlay ? "absolute inset-x-0 top-0" : "sticky top-0 border-b border-slate-200/80 bg-white/90 backdrop-blur-md")}>
      <div className={cn("mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 sm:px-8", overlay ? "h-20" : "h-16")}>
        <Link href="/" className="shrink-0" aria-label="LogiTrack — accueil">
          <Logo dark={overlay} />
        </Link>
        <nav className={cn("hidden items-center gap-7 text-sm lg:flex", overlay ? "text-white/80" : "text-slate-600")} aria-label="Navigation du site">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? "page" : undefined}
              className={cn("transition", overlay ? "hover:text-white" : "hover:text-ink", isActive(l.href) && (overlay ? "font-medium text-white" : "font-medium text-ink"))}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className={cn(
              "hidden h-10 items-center rounded-xl px-4 text-sm font-medium transition sm:inline-flex",
              overlay ? "bg-white/10 text-white ring-1 ring-white/20 backdrop-blur hover:bg-white/20" : "bg-navy-900 text-white hover:bg-navy-800",
            )}
          >
            Se connecter
          </Link>
          <button
            onClick={() => setOpen((x) => !x)}
            className={cn("inline-flex size-10 items-center justify-center rounded-xl lg:hidden", overlay ? "text-white hover:bg-white/10" : "text-slate-600 hover:bg-slate-100")}
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-slate-100 bg-white px-5 py-3 shadow-pop lg:hidden">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className={cn("block rounded-lg px-3 py-2.5 text-sm hover:bg-slate-50", isActive(l.href) ? "font-medium text-ink" : "text-slate-700")}>
              {l.label}
            </Link>
          ))}
          <Link href="/login" onClick={() => setOpen(false)} className="mt-2 block rounded-lg bg-navy-900 px-3 py-2.5 text-center text-sm font-medium text-white">
            Se connecter
          </Link>
        </div>
      )}
    </header>
  );
}

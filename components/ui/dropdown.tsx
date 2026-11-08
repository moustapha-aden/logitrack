"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { LucideIcon } from "lucide-react";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MenuItem {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

/** Menu contextuel rendu en portail (non tronqué par les conteneurs scrollables). */
export function ActionMenu({ items, label = "Actions", trigger }: { items: (MenuItem | null | false)[]; label?: string; trigger?: ReactNode }) {
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const list = items.filter(Boolean) as MenuItem[];

  useEffect(() => {
    if (!pos) return;
    const close = (e: Event) => {
      if (e.type === "mousedown" && (menu.current?.contains(e.target as Node) || btn.current?.contains(e.target as Node))) return;
      setPos(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPos(null);
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [pos]);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pos) return setPos(null);
    const r = btn.current?.getBoundingClientRect();
    if (!r) return;
    const estimated = list.length * 38 + 12;
    const top = r.bottom + estimated > window.innerHeight ? Math.max(8, r.top - estimated - 4) : r.bottom + 4;
    setPos({ top, right: Math.max(8, window.innerWidth - r.right) });
  };

  return (
    <>
      <button
        ref={btn}
        type="button"
        onClick={toggle}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={!!pos}
        className="inline-flex size-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-ink"
      >
        {trigger ?? <MoreHorizontal className="size-4" />}
      </button>
      {pos &&
        createPortal(
          <div ref={menu} role="menu" className="fixed z-[950] min-w-48 animate-scale-in rounded-xl border border-slate-200 bg-white p-1.5 shadow-pop" style={{ top: pos.top, right: pos.right }} onClick={(e) => e.stopPropagation()}>
            {list.map((it) => (
              <button
                key={it.label}
                role="menuitem"
                disabled={it.disabled}
                onClick={() => {
                  setPos(null);
                  it.onClick();
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition disabled:opacity-40",
                  it.danger ? "text-red-600 hover:bg-red-50" : "text-slate-700 hover:bg-slate-100 hover:text-ink",
                )}
              >
                {it.icon && <it.icon className="size-4 opacity-70" />}
                {it.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}

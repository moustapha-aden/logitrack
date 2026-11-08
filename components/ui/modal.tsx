"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

function useOverlay(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  useOverlay(open, onClose);
  if (!open) return null;
  const widths = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-5xl" };
  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 animate-fade-in bg-navy-950/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className={cn("relative flex max-h-[92vh] w-full animate-scale-in flex-col rounded-t-2xl bg-white shadow-pop sm:rounded-2xl", widths[size])}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-semibold text-ink">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-ink" aria-label="Fermer">
            <X className="size-5" />
          </button>
        </div>
        <div className="scroll-thin flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3.5 sm:rounded-b-2xl sm:px-6">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function Drawer({ open, onClose, children, width = "max-w-2xl" }: { open: boolean; onClose: () => void; children: ReactNode; width?: string }) {
  useOverlay(open, onClose);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[900]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 animate-fade-in bg-navy-950/40 backdrop-blur-[2px]" onClick={onClose} />
      <aside className={cn("absolute inset-y-0 right-0 flex w-full animate-slide-in-right flex-col bg-canvas shadow-pop", width)}>
        <button onClick={onClose} className="absolute top-3 right-3 z-20 rounded-full bg-white/90 p-2 text-slate-500 shadow-card backdrop-blur transition hover:text-ink" aria-label="Fermer la fiche">
          <X className="size-4" />
        </button>
        <div className="scroll-thin flex-1 overflow-y-auto">{children}</div>
      </aside>
    </div>,
    document.body,
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirmer",
  tone = "danger",
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  tone?: "danger" | "primary";
}) {
  useOverlay(open, onClose);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4" role="alertdialog" aria-modal="true">
      <div className="absolute inset-0 animate-fade-in bg-navy-950/50" onClick={onClose} />
      <div className="relative w-full max-w-md animate-scale-in rounded-2xl bg-white p-6 shadow-pop">
        <div className="flex gap-4">
          <span className={cn("inline-flex size-11 shrink-0 items-center justify-center rounded-full", tone === "danger" ? "bg-red-50 text-red-500" : "bg-brand-50 text-brand-600")}>
            <AlertTriangle className="size-5" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-ink">{title}</h2>
            <div className="mt-1 text-sm text-slate-500">{message}</div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "primary"}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

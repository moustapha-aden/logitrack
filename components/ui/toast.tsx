"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error" | "info" | "warning";
interface Toast {
  id: number;
  title: string;
  message?: string;
  tone: ToastTone;
}

interface ToastApi {
  toast: (title: string, opts?: { message?: string; tone?: ToastTone }) => void;
}

const ToastContext = createContext<ToastApi>({ toast: () => {} });
export const useToast = () => useContext(ToastContext);

const icons = { success: CheckCircle2, error: XCircle, info: Info, warning: AlertTriangle };
const colors = {
  success: "text-success-600",
  error: "text-red-500",
  info: "text-brand-600",
  warning: "text-amber-500",
};

let counter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const toast = useCallback<ToastApi["toast"]>(
    (title, opts) => {
      counter += 1;
      const id = counter;
      setToasts((t) => [...t.slice(-3), { id, title, message: opts?.message, tone: opts?.tone ?? "success" }]);
      window.setTimeout(() => dismiss(id), 4200);
    },
    [dismiss],
  );

  const api = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-4 left-4 z-[1200] flex flex-col items-end gap-2 sm:left-auto" aria-live="polite">
        {toasts.map((t) => {
          const Icon = icons[t.tone];
          return (
            <div key={t.id} className="pointer-events-auto flex w-full max-w-sm animate-slide-up items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-pop">
              <Icon className={cn("mt-0.5 size-5 shrink-0", colors[t.tone])} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{t.title}</p>
                {t.message && <p className="mt-0.5 text-xs text-slate-500">{t.message}</p>}
              </div>
              <button onClick={() => dismiss(t.id)} className="rounded p-0.5 text-slate-400 hover:text-ink" aria-label="Fermer la notification">
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

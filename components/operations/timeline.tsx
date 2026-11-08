"use client";

import { Check, Clock } from "lucide-react";
import { OPERATION_STEPS } from "@/lib/constants";
import { cn, formatDateTime } from "@/lib/utils";
import type { Mission } from "@/types";

/** Timeline verticale des 8 étapes du suivi des opérations. */
export function OperationTimeline({ mission, compact }: { mission: Mission; compact?: boolean }) {
  return (
    <ol className="relative">
      {OPERATION_STEPS.map((s, i) => {
        const event = mission.history.find((h) => h.step === s.step);
        const done = s.step < mission.step || (s.step === mission.step && s.step === 7);
        const current = s.step === mission.step && s.step !== 7;
        const last = i === OPERATION_STEPS.length - 1;
        return (
          <li key={s.step} className={cn("relative flex gap-3", !last && (compact ? "pb-3" : "pb-5"))}>
            {!last && <span className={cn("absolute top-7 left-[13px] h-[calc(100%-24px)] w-0.5", s.step < mission.step ? "bg-success-600" : "bg-slate-200")} aria-hidden />}
            <span
              className={cn(
                "relative z-10 inline-flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                done && "bg-success-600 text-white",
                current && (mission.delayed ? "bg-amber-500 text-white ring-4 ring-amber-100" : "bg-brand-600 text-white ring-4 ring-brand-100"),
                !done && !current && "border-2 border-slate-200 bg-white text-slate-400",
              )}
            >
              {done ? <Check className="size-3.5" strokeWidth={3} /> : current ? <Clock className="size-3.5" /> : s.step + 1}
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p className={cn("text-sm font-medium", done || current ? "text-ink" : "text-slate-400")}>{s.label}</p>
                {event && <span className="text-xs text-slate-400 tabular-nums">{formatDateTime(event.at)}</span>}
              </div>
              {event && !compact && (
                <p className="mt-0.5 text-xs text-slate-500">
                  par {event.by}
                  {event.note && <span className="mt-1 block rounded-md bg-amber-50 px-2 py-1 text-amber-700">{event.note}</span>}
                </p>
              )}
              {current && !event && <p className="text-xs text-slate-400">En attente</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Stepper horizontal compact (8 segments). */
export function StepProgress({ step, delayed }: { step: number; delayed?: boolean }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Étape ${step + 1} sur 8 : ${OPERATION_STEPS[step]?.label}`}>
      {OPERATION_STEPS.map((s) => (
        <span
          key={s.step}
          className={cn("h-1.5 flex-1 rounded-full", s.step < step || step === 7 ? "bg-success-600" : s.step === step ? (delayed ? "bg-amber-500" : "bg-brand-600") : "bg-slate-200")}
        />
      ))}
    </div>
  );
}

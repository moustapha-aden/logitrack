"use client";

import { Send } from "lucide-react";
import { actions, actorOf } from "@/lib/store";
import { useData } from "@/lib/store/selectors";
import { INCIDENT_TYPES, SEVERITY } from "@/lib/constants";
import { placeName } from "@/lib/data/geo";
import { cn, fromLocalInput, toLocalInput } from "@/lib/utils";
import type { IncidentType, Severity } from "@/types";
import { Button } from "@/components/ui/button";
import { Field, FormGrid, Input, Select, Textarea } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { required, useForm } from "./use-form";

interface Values {
  missionId: string;
  type: IncidentType;
  severity: Severity;
  description: string;
  location: string;
  delayMinutes: number;
  date: string;
}

function Inner({ onClose, missionId, type, reportedBy }: { onClose: () => void; missionId?: string; type?: IncidentType; reportedBy?: string }) {
  const { toast } = useToast();
  const { missions, lookups, all } = useData();
  const candidates = [...missions].sort((a, b) => Number(b.step >= 2 && b.step <= 5) - Number(a.step >= 2 && a.step <= 5) || a.step - b.step);
  const { values, errors, set, submit } = useForm<Values>(
    {
      missionId: missionId ?? candidates.find((m) => m.step >= 2 && m.step <= 5)?.id ?? candidates[0]?.id ?? "",
      type: type ?? "panne",
      severity: type === "retard" ? "moyenne" : "elevee",
      description: "",
      location: "",
      delayMinutes: type === "retard" ? 60 : 0,
      date: toLocalInput(new Date().toISOString()),
    },
    (v) => ({ missionId: required(v.missionId), description: required(v.description.trim(), "Décrivez la situation"), location: required(v.location.trim()) }),
  );

  const mission = lookups.mission(values.missionId);

  const save = submit((v) => {
    const m = lookups.mission(v.missionId);
    actions.reportIncident({
      missionId: v.missionId,
      type: v.type,
      severity: v.severity,
      description: v.description.trim(),
      location: v.location.trim(),
      delayMinutes: v.delayMinutes > 0 ? v.delayMinutes : undefined,
      date: fromLocalInput(v.date),
      driverId: m?.driverId ?? null,
      status: "nouveau",
      reportedBy: reportedBy ?? actorOf(all),
    });
    toast(v.type === "retard" ? "Retard déclaré" : "Incident déclaré", { message: `${m?.ref ?? ""} — les responsables ont été notifiés.`, tone: v.type === "retard" ? "warning" : "error" });
    onClose();
  });

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={type === "retard" ? "Déclarer un retard" : "Déclarer un incident"}
      description="La déclaration est transmise immédiatement à l'exploitation et à l'entreprise concernée."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="danger" icon={Send} onClick={() => save()}>
            Envoyer la déclaration
          </Button>
        </>
      }
    >
      <form onSubmit={save} className="space-y-5">
        <FormGrid>
          <Field label="Mission concernée" required error={errors.missionId} className="sm:col-span-2">
            <Select value={values.missionId} onChange={(e) => set("missionId", e.target.value)} disabled={!!missionId}>
              {candidates.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.ref} · {placeName(m.origin)} → {placeName(m.destination)} · {lookups.truck(m.truckId)?.plate ?? "sans camion"}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Type d'incident" required>
            <Select value={values.type} onChange={(e) => set("type", e.target.value as IncidentType)}>
              {Object.entries(INCIDENT_TYPES).map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Date et heure">
            <Input type="datetime-local" value={values.date} onChange={(e) => set("date", e.target.value)} />
          </Field>
        </FormGrid>
        <div>
          <p className="mb-1.5 text-xs font-medium text-slate-600">Niveau de gravité</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(Object.keys(SEVERITY) as Severity[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => set("severity", s)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm font-medium transition",
                  values.severity === s
                    ? s === "critique"
                      ? "border-red-500 bg-red-50 text-red-700"
                      : s === "elevee"
                        ? "border-amber-500 bg-amber-50 text-amber-700"
                        : "border-brand-600 bg-brand-50 text-brand-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50",
                )}
              >
                {SEVERITY[s].label}
              </button>
            ))}
          </div>
        </div>
        <FormGrid>
          <Field label="Localisation" required error={errors.location}>
            <Input value={values.location} onChange={(e) => set("location", e.target.value)} invalid={!!errors.location} placeholder={mission ? `Ex. RN1 — entre ${placeName(mission.origin)} et ${placeName(mission.destination)}` : "Lieu"} />
          </Field>
          <Field label="Retard estimé (minutes)" hint="0 si aucun impact sur l'horaire">
            <Input type="number" min={0} step={15} value={values.delayMinutes} onChange={(e) => set("delayMinutes", Number(e.target.value))} />
          </Field>
          <Field label="Description" required error={errors.description} className="sm:col-span-2">
            <Textarea value={values.description} onChange={(e) => set("description", e.target.value)} invalid={!!errors.description} placeholder="Que s'est-il passé ? Quelles mesures ont été prises ?" />
          </Field>
        </FormGrid>
      </form>
    </Modal>
  );
}

export function IncidentFormModal({ open, onClose, missionId, type, reportedBy }: { open: boolean; onClose: () => void; missionId?: string; type?: IncidentType; reportedBy?: string }) {
  return open ? <Inner onClose={onClose} missionId={missionId} type={type} reportedBy={reportedBy} /> : null;
}

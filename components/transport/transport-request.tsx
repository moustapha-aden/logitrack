"use client";

import { useState } from "react";
import { Ban, CheckCircle2, Handshake, Phone, RefreshCw, Send, Truck } from "lucide-react";
import { actions } from "@/lib/store";
import { useData } from "@/lib/store/selectors";
import { DEMO_NOW, REQUEST_STATUS, RESPONSE_STATUS } from "@/lib/constants";
import { placeName } from "@/lib/data/geo";
import { cn, formatDateTime, fromLocalInput, toLocalInput } from "@/lib/utils";
import { carrierStats, formatMinutes, latestRequest, requestStatus } from "@/lib/utils/transport";
import type { Mission } from "@/types";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { DetailSection } from "@/components/details/parts";

const H = 3600 * 1000;

// ── Création d'une demande de transport ──────────────────────
function RequestForm({ mission, by, onClose }: { mission: Mission; by: string; onClose: () => void }) {
  const { all } = useData();
  const { toast } = useToast();
  const partners = all.carriers.filter((c) => c.companyId === mission.companyId && c.status === "actif");
  const [selected, setSelected] = useState<string[]>(partners.length === 1 ? [partners[0].id] : []);
  // date limite par défaut : 6 h après l'heure de démonstration, sans dépasser le départ prévu
  const defaultDeadline = Math.min(Date.parse(DEMO_NOW) + 6 * H, Date.parse(mission.plannedDeparture) - 2 * H);
  const [deadline, setDeadline] = useState(toLocalInput(new Date(Math.max(defaultDeadline, Date.parse(DEMO_NOW) + H)).toISOString()));
  const [instructions, setInstructions] = useState("");
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const submit = () => {
    actions.createTransportRequest(mission.id, selected, fromLocalInput(deadline), instructions.trim(), by);
    toast("Demande envoyée", { message: `${selected.length} transporteur(s) notifié(s) — ${mission.ref}` });
    onClose();
  };

  return (
    <Modal
      open
      size="lg"
      onClose={onClose}
      title={`Demande de transport — ${mission.ref}`}
      description={`${placeName(mission.origin)} → ${placeName(mission.destination)} · départ prévu ${formatDateTime(mission.plannedDeparture)}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button icon={Send} disabled={selected.length === 0 || !deadline} onClick={submit}>
            Envoyer la demande
          </Button>
        </>
      }
    >
      <p className="mb-2 text-xs font-semibold tracking-wider text-slate-400 uppercase">Transporteurs partenaires</p>
      {partners.length === 0 ? (
        <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">Aucun transporteur partenaire actif pour cette entreprise.</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {partners.map((c) => {
            const st = carrierStats(all.requests, c.id);
            const on = selected.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggle(c.id)}
                aria-pressed={on}
                className={cn("rounded-xl border p-3 text-left transition", on ? "border-brand-600 bg-brand-50 ring-2 ring-brand-600/15" : "border-slate-200 hover:border-slate-300")}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{c.name}</p>
                  {on && <CheckCircle2 className="size-4 text-brand-600" />}
                </div>
                <p className="text-xs text-slate-500">
                  {c.city} · {c.fleetSize} véhicules
                </p>
                <p className="mt-1.5 text-[11px] text-slate-500">
                  Acceptation {st.acceptRate === null ? "—" : `${st.acceptRate} %`} · réponse moyenne {formatMinutes(st.avgResponseMin)}
                </p>
              </button>
            );
          })}
        </div>
      )}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Réponse attendue avant" required>
          <Input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </Field>
      </div>
      <Field label="Consignes" hint="Lieu exact d'enlèvement, contact sur site, équipement requis…" className="mt-4">
        <Textarea rows={3} value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Ex. : enlèvement porte 3, prévoir sangles, contact quai : +253…" />
      </Field>
      <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-600">
        <p>
          <strong className="text-ink">Partagé avec le transporteur :</strong> lieux et horaires, marchandise, conteneur, consignes et pièces marquées « transporteur ».
        </p>
        <p className="mt-1">
          <strong className="text-ink">Jamais partagé :</strong> le client final et le tarif de la mission.
        </p>
      </div>
    </Modal>
  );
}

export function TransportRequestModal({ open, onClose, mission, by }: { open: boolean; onClose: () => void; mission: Mission; by: string }) {
  return open ? <RequestForm mission={mission} by={by} onClose={onClose} /> : null;
}

// ── Suivi de la demande dans la fiche mission ────────────────
export function TransportRequestPanel({ mission, by, onNew, canManage = true }: { mission: Mission; by: string; onNew: () => void; canManage?: boolean }) {
  const { all, lookups } = useData();
  const { toast } = useToast();
  const r = latestRequest(all.requests, mission.id);
  if (!r) return null;
  const status = requestStatus(r);
  const canAct = status === "ouverte" && canManage;

  return (
    <DetailSection title={`Demande de transport ${r.ref}`} action={<StatusBadge map={REQUEST_STATUS} value={status} />}>
      <p className="text-xs text-slate-500">
        Envoyée le {formatDateTime(r.createdAt)} par {r.createdBy} · réponse attendue avant le {formatDateTime(r.deadline)}
      </p>
      {r.instructions && <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">{r.instructions}</p>}
      <ul className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-100">
        {r.responses.map((x) => {
          const c = lookups.carrier(x.carrierId);
          const chosen = r.confirmedCarrierId === x.carrierId;
          return (
            <li key={x.carrierId} className={cn("flex flex-wrap items-start justify-between gap-3 px-3 py-2.5", chosen && "bg-success-50/50")}>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-medium">{c?.name ?? x.carrierId}</span>
                  <StatusBadge map={RESPONSE_STATUS} value={x.status} />
                  {chosen && <span className="text-[11px] font-medium text-success-700">Retenu</span>}
                </div>
                {x.proposal && (
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <Truck className="size-3.5" /> <span className="font-mono">{x.proposal.plate}</span>
                    </span>
                    <span>{x.proposal.driverName}</span>
                    <span className="inline-flex items-center gap-1">
                      <Phone className="size-3" /> {x.proposal.driverPhone}
                    </span>
                  </p>
                )}
                {x.reason && <p className="mt-1 text-xs text-red-700">Motif : {x.reason}</p>}
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {x.answeredAt ? `Réponse le ${formatDateTime(x.answeredAt)}` : x.seenAt ? `Vue le ${formatDateTime(x.seenAt)}` : "Pas encore consultée"}
                </p>
              </div>
              {canAct && x.status === "acceptee" && (
                <Button
                  size="sm"
                  variant="success"
                  icon={Handshake}
                  onClick={() => {
                    actions.confirmCarrier(r.id, x.carrierId, by);
                    toast("Transporteur confirmé", { message: `${c?.name} — ordre de mission émis`, tone: "success" });
                  }}
                >
                  Confirmer
                </Button>
              )}
            </li>
          );
        })}
      </ul>
      {canManage && (canAct || status === "expiree" || status === "annulee") && mission.step < 6 && (
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          {canAct && (
            <Button
              size="sm"
              variant="ghost"
              icon={Ban}
              className="text-red-600 hover:bg-red-50"
              onClick={() => {
                actions.cancelRequest(r.id, by);
                toast("Demande annulée", { message: r.ref, tone: "info" });
              }}
            >
              Annuler la demande
            </Button>
          )}
          <Button size="sm" variant="secondary" icon={RefreshCw} onClick={onNew}>
            Nouvelle demande
          </Button>
        </div>
      )}
    </DetailSection>
  );
}

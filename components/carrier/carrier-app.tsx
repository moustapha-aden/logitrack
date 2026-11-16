"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Box,
  CalendarClock,
  Check,
  ChevronRight,
  Clock,
  FileText,
  Handshake,
  Inbox,
  Link2,
  Lock,
  Phone,
  RefreshCw,
  Truck,
  Upload,
  X,
} from "lucide-react";
import { actions, setActor, setActorRole, useAppData } from "@/lib/store";
import { DOC_PARTIES, DOC_STATUS, DOC_TYPES, GOODS_TYPES, OPERATION_STEPS, PAYMENT_MODES, RESPONSE_STATUS } from "@/lib/constants";
import { placeName } from "@/lib/data/geo";
import { cn, formatDate, formatDateTime, formatNumber, missionProgress } from "@/lib/utils";
import { blockerLabel, blockingDocs, isBlockingOpen, isCleared, routeDocs } from "@/lib/utils/documents";
import { awaitsAnswer, requestStatus } from "@/lib/utils/transport";
import { formatMoney, formatTotals, isOpen, isOverdueInvoice, remaining, totalsByCurrency } from "@/lib/utils/invoices";
import { InvoiceStatusBadges } from "@/components/invoices/mission-invoices";
import type { AppData, Carrier, CarrierAssignment, Mission, OperationStep, TransportRequest } from "@/types";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { EmptyState, ProgressBar, Segmented } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { IncidentFormModal } from "@/components/forms/incident-form";
import { useFilePicker } from "@/components/documents/mission-documents";
import { MissionThread } from "@/components/messages/mission-thread";
import { Logo } from "@/components/layout/logo";

type Tab = "demandes" | "missions" | "historique" | "factures" | "notifications";

/** Étapes que le transporteur peut déclarer (le lancement et la clôture restent à l'exploitation). */
const CARRIER_NEXT: Partial<Record<OperationStep, string>> = {
  1: "Démarrer le chargement",
  2: "Chargement terminé",
  3: "Départ — en transit",
  4: "Arrivé à destination",
  5: "Livraison effectuée",
};

function useCarrierContext() {
  const data = useAppData();
  const active = data.carriers.filter((c) => c.status === "actif");
  const carrier = data.carriers.find((c) => c.id === data.prefs.carrierId && c.status === "actif") ?? active[0];
  const requests = data.requests.filter((r) => carrier && r.responses.some((x) => x.carrierId === carrier.id)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  // missions confiées et confirmées : seules celles-ci sont visibles par le transporteur
  const missions = data.missions.filter((m) => carrier && m.carrierId === carrier.id && m.carrierAssignment);
  return { data, carrier, carriers: active, requests, missions };
}

// ── Formulaire camion + chauffeur (acceptation ou remplacement) ──
function AssignmentFields({ value, onChange }: { value: CarrierAssignment; onChange: (v: CarrierAssignment) => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Immatriculation du camion" required>
        <Input value={value.plate} onChange={(e) => onChange({ ...value, plate: e.target.value.toUpperCase() })} placeholder="DJ-000-XX" className="font-mono" />
      </Field>
      <Field label="Nom du chauffeur" required>
        <Input value={value.driverName} onChange={(e) => onChange({ ...value, driverName: e.target.value })} />
      </Field>
      <Field label="Téléphone du chauffeur" required className="sm:col-span-2">
        <Input value={value.driverPhone} onChange={(e) => onChange({ ...value, driverPhone: e.target.value })} placeholder="+253 77 …" />
      </Field>
    </div>
  );
}

const validAssignment = (a: CarrierAssignment) => a.plate.trim().length >= 5 && a.driverName.trim().length >= 3 && a.driverPhone.replace(/\D/g, "").length >= 8;

function AnswerModal({ request, carrier, mode, onClose }: { request: TransportRequest; carrier: Carrier; mode: "accept" | "refuse"; onClose: () => void }) {
  const { toast } = useToast();
  const [a, setA] = useState<CarrierAssignment>({ plate: "", driverName: "", driverPhone: "" });
  const [reason, setReason] = useState("");
  const ok = mode === "accept" ? validAssignment(a) : reason.trim().length >= 5;
  const submit = () => {
    if (mode === "accept") actions.respondToRequest(request.id, carrier.id, { accept: true, proposal: { plate: a.plate.trim(), driverName: a.driverName.trim(), driverPhone: a.driverPhone.trim() } });
    else actions.respondToRequest(request.id, carrier.id, { accept: false, reason: reason.trim() });
    toast(mode === "accept" ? "Acceptation envoyée" : "Refus envoyé", { message: `${request.ref} — le donneur d'ordre est notifié.`, tone: mode === "accept" ? "success" : "info" });
    onClose();
  };
  return (
    <Modal
      open
      size="md"
      onClose={onClose}
      title={mode === "accept" ? `Accepter ${request.ref}` : `Refuser ${request.ref}`}
      description={mode === "accept" ? "Indiquez le camion et le chauffeur proposés. Le donneur d'ordre confirmera." : "Le motif aide le donneur d'ordre à trouver une autre solution."}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button variant={mode === "accept" ? "success" : "danger"} disabled={!ok} onClick={submit}>
            {mode === "accept" ? "Envoyer l'acceptation" : "Envoyer le refus"}
          </Button>
        </>
      }
    >
      {mode === "accept" ? (
        <AssignmentFields value={a} onChange={setA} />
      ) : (
        <Field label="Motif du refus" required>
          <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex. : aucun plateau disponible avant le 10/11" />
        </Field>
      )}
    </Modal>
  );
}

function ChangeAssignmentModal({ mission, by, onClose }: { mission: Mission; by: string; onClose: () => void }) {
  const { toast } = useToast();
  const [a, setA] = useState<CarrierAssignment>(mission.carrierAssignment ?? { plate: "", driverName: "", driverPhone: "" });
  const [reason, setReason] = useState("");
  const before = mission.carrierAssignment;
  const changed = !!before && (before.plate !== a.plate || before.driverName !== a.driverName || before.driverPhone !== a.driverPhone);
  return (
    <Modal
      open
      onClose={onClose}
      title="Changer de camion ou de chauffeur"
      description="Le donneur d'ordre est notifié et le changement est conservé dans l'historique."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button
            disabled={!changed || !validAssignment(a) || reason.trim().length < 5}
            onClick={() => {
              actions.changeCarrierAssignment(mission.id, { plate: a.plate.trim(), driverName: a.driverName.trim(), driverPhone: a.driverPhone.trim() }, reason.trim(), by);
              toast("Affectation modifiée", { message: `${mission.ref} — donneur d'ordre notifié` });
              onClose();
            }}
          >
            Enregistrer le changement
          </Button>
        </>
      }
    >
      <AssignmentFields value={a} onChange={setA} />
      <Field label="Motif" required className="mt-4">
        <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex. : panne du camion prévu, remplacé par…" />
      </Field>
    </Modal>
  );
}

// ── Demandes reçues ──────────────────────────────────────────
function RequestCard({ request, carrier, data }: { request: TransportRequest; carrier: Carrier; data: AppData }) {
  const [answer, setAnswer] = useState<"accept" | "refuse" | null>(null);
  const m = data.missions.find((x) => x.id === request.missionId);
  const load = data.loads.find((l) => l.missionId === request.missionId);
  const company = data.companies.find((c) => c.id === request.companyId);
  const mine = request.responses.find((x) => x.carrierId === carrier.id)!;
  const status = requestStatus(request);
  const pending = awaitsAnswer(request, carrier.id);
  const lost = status === "confirmee" && request.confirmedCarrierId !== carrier.id;

  // l'ouverture de la demande vaut accusé de lecture pour le donneur d'ordre
  useEffect(() => {
    if (mine.status === "envoyee" && status === "ouverte") actions.markRequestSeen(request.id, carrier.id);
  }, [mine.status, status, request.id, carrier.id]);

  if (!m) return null;
  return (
    <article className={cn("rounded-2xl border bg-white p-4 shadow-card sm:p-5", pending ? "border-brand-200" : "border-slate-200")}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-mono text-xs text-slate-500">
            {request.ref} · {company?.name}
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-1.5 font-semibold">
            {placeName(m.origin)} <ArrowRight className="size-4 text-slate-400" /> {placeName(m.destination)}
          </p>
        </div>
        {pending ? (
          <Badge tone="orange">Réponse avant le {formatDateTime(request.deadline)}</Badge>
        ) : lost ? (
          <Badge tone="neutral">Attribuée à un autre transporteur</Badge>
        ) : status === "confirmee" && request.confirmedCarrierId === carrier.id ? (
          <Badge tone="green">Mission confirmée</Badge>
        ) : status === "expiree" && (mine.status === "envoyee" || mine.status === "vue") ? (
          <Badge tone="red">Expirée</Badge>
        ) : status === "annulee" ? (
          <Badge tone="neutral">Annulée par le donneur d&apos;ordre</Badge>
        ) : (
          <StatusBadge map={RESPONSE_STATUS} value={mine.status} />
        )}
      </div>
      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
        <p className="flex items-center gap-2 text-slate-600">
          <CalendarClock className="size-4 text-slate-400" /> Départ {formatDateTime(m.plannedDeparture)}
        </p>
        <p className="flex items-center gap-2 text-slate-600">
          <Box className="size-4 text-slate-400" /> {GOODS_TYPES[m.goodsType]}
          {load ? ` · ${load.weightT} t` : ""}
        </p>
        {load?.containerNo && <p className="font-mono text-xs text-slate-600">{load.containerNo}</p>}
      </div>
      <p className="mt-2 text-sm text-slate-700">{m.description}</p>
      {load?.hazardous && <p className="mt-2 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700">Marchandise dangereuse — véhicule et chauffeur ADR requis.</p>}
      {request.instructions && <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">{request.instructions}</p>}
      {mine.proposal && (
        <p className="mt-2 text-xs text-slate-500">
          Votre proposition : <span className="font-mono">{mine.proposal.plate}</span> · {mine.proposal.driverName}
        </p>
      )}
      {mine.reason && <p className="mt-2 text-xs text-slate-500">Votre motif de refus : {mine.reason}</p>}
      {pending && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button variant="success" icon={Check} className="h-auto min-h-10 py-2 whitespace-normal sm:flex-1" onClick={() => setAnswer("accept")}>
            Accepter et proposer un camion
          </Button>
          <Button variant="secondary" icon={X} className="text-red-600" onClick={() => setAnswer("refuse")}>
            Refuser
          </Button>
        </div>
      )}
      {answer && <AnswerModal request={request} carrier={carrier} mode={answer} onClose={() => setAnswer(null)} />}
    </article>
  );
}

// ── Fiche mission côté transporteur ──────────────────────────
function CarrierMission({ mission: m, carrier, data, onClose }: { mission: Mission; carrier: Carrier; data: AppData; onClose: () => void }) {
  const { toast } = useToast();
  const [change, setChange] = useState(false);
  const [incident, setIncident] = useState(false);
  const load = data.loads.find((l) => l.missionId === m.id);
  const company = data.companies.find((c) => c.id === m.companyId);
  const request = data.requests.find((r) => r.missionId === m.id && r.confirmedCarrierId === carrier.id);
  // pièces partagées et toutes les pièces bloquantes : le transporteur sait toujours ce qu'il attend
  const docs = routeDocs(data.documents, m.id);
  const waiting = docs.filter((d) => isBlockingOpen(d, m.step));
  const nextLabel = CARRIER_NEXT[m.step];
  const next = (m.step + 1) as OperationStep;
  const blockers = nextLabel ? blockingDocs(data.documents, m.id, m.step, next) : [];
  const { pick, element } = useFilePicker((id, file) => {
    actions.uploadDocument(id, file, carrier.name);
    toast("Pièce envoyée", { message: `${file.fileName} — à vérifier par le donneur d'ordre` });
  });

  const advance = () => {
    if (!nextLabel) return;
    if (blockers.length) {
      actions.reportBlocked(m.id, blockers.map((d) => d.id), carrier.name);
      toast("Étape bloquée par une pièce", { message: `${blockers.map(blockerLabel).join(" · ")}. Le donneur d'ordre a été prévenu.`, tone: "warning" });
      return;
    }
    actions.setMissionStep(m.id, next, carrier.name);
    toast(OPERATION_STEPS[next].label, { message: `${m.ref} — transmis au donneur d'ordre` });
  };

  return (
    <Modal open size="lg" onClose={onClose} title={`${m.ref} · ${placeName(m.origin)} → ${placeName(m.destination)}`} description={`Donneur d'ordre : ${company?.name ?? "—"} · ${company?.phone ?? ""}`}>
      {element}
      <div className="space-y-5">
        <div className="rounded-2xl bg-navy-900 p-4 text-white">
          <div className="flex items-center justify-between text-xs text-white/60">
            <span>
              Étape {m.step + 1}/8 · {OPERATION_STEPS[m.step].label}
            </span>
            <span className="tabular-nums">{missionProgress(m.step)} %</span>
          </div>
          <ProgressBar value={missionProgress(m.step)} tone={m.delayed ? "orange" : m.step >= 6 ? "green" : "blue"} className="mt-2 bg-white/10" />
          {nextLabel ? (
            <>
              <Button className="mt-3 h-auto min-h-10 w-full py-2 whitespace-normal" variant={next >= 6 ? "success" : "primary"} iconRight={ChevronRight} onClick={advance}>
                {nextLabel}
              </Button>
              {blockers.length > 0 && (
                <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-300">
                  <Lock className="mt-0.5 size-3.5 shrink-0" /> {blockers.map(blockerLabel).join(" · ")}
                </p>
              )}
            </>
          ) : (
            <p className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-center text-sm">{m.step === 0 ? "En attente du lancement par le donneur d'ordre" : m.step === 6 ? "Livrée — clôture par le donneur d'ordre" : "Mission clôturée ✓"}</p>
          )}
          {m.step >= 1 && m.step < 6 && (
            <button onClick={() => setIncident(true)} className="mt-2 inline-flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200">
              <AlertTriangle className="size-3.5" /> Signaler un incident ou un retard
            </button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-3 text-sm">
            <p className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">Horaires</p>
            <p className="mt-1">Départ {formatDateTime(m.plannedDeparture)}</p>
            <p>Arrivée {formatDateTime(m.plannedArrival)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-3 text-sm">
            <p className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">Chargement</p>
            <p className="mt-1">{m.description}</p>
            {load && (
              <p className="text-xs text-slate-500">
                {load.weightT} t · {formatNumber(load.packages)} colis{load.containerNo ? ` · ${load.containerNo}` : ""}
              </p>
            )}
          </div>
        </div>
        {request?.instructions && <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">{request.instructions}</p>}

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
          <div className="text-sm">
            <p className="flex items-center gap-2 font-mono font-semibold">
              <Truck className="size-4 text-slate-400" /> {m.carrierAssignment?.plate}
            </p>
            <p className="mt-0.5 text-slate-600">
              {m.carrierAssignment?.driverName} · <Phone className="inline size-3" /> {m.carrierAssignment?.driverPhone}
            </p>
          </div>
          {m.step < 6 && (
            <Button size="sm" variant="secondary" icon={RefreshCw} onClick={() => setChange(true)}>
              Changer camion / chauffeur
            </Button>
          )}
        </div>

        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <FileText className="size-4 text-slate-400" /> Documents de la mission
          </p>
          {waiting.length > 0 && (
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
              <span>
                {waiting.length} pièce(s) attendue(s) avant une prochaine étape.
              </span>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  actions.reportBlocked(m.id, waiting.map((d) => d.id), carrier.name, true);
                  toast("Donneur d'ordre prévenu", { message: `${waiting.length} pièce(s) sur ${m.ref}` });
                }}
              >
                Prévenir le donneur d&apos;ordre
              </Button>
            </div>
          )}
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
            {docs.map((d) => {
              const canUpload = (d.responsible === "transporteur" || d.responsible === "chauffeur") && !isCleared(d) && d.status !== "recu";
              return (
                <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-sm">
                      {isBlockingOpen(d, m.step) && <Lock className="size-3.5 shrink-0 text-amber-600" aria-label="Pièce bloquante" />}
                      {DOC_TYPES[d.type].label}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Fourni par : {DOC_PARTIES[d.responsible].toLowerCase()}
                      {d.versions.at(-1) ? ` · ${d.versions.at(-1)!.fileName}` : ""}
                    </p>
                    {d.status === "a_corriger" && d.note && <p className="mt-0.5 text-xs text-red-700">{d.note}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge map={DOC_STATUS} value={d.status} />
                    {canUpload && (
                      <Button size="sm" variant="secondary" icon={Upload} onClick={() => pick(d.id)}>
                        Déposer
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
            {docs.length === 0 && <li className="px-3 py-3 text-sm text-slate-500">Aucun document partagé pour le moment.</li>}
          </ul>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold">Échanges avec le donneur d&apos;ordre</p>
          <MissionThread missionId={m.id} messages={data.messages} author={carrier.name} role="transporteur" />
        </div>
      </div>
      {change && <ChangeAssignmentModal mission={m} by={carrier.name} onClose={() => setChange(false)} />}
      <IncidentFormModal open={incident} onClose={() => setIncident(false)} missionId={m.id} reportedBy={carrier.name} />
    </Modal>
  );
}

function MissionTile({ m, data, onOpen }: { m: Mission; data: AppData; onOpen: () => void }) {
  const blocked = CARRIER_NEXT[m.step] ? blockingDocs(data.documents, m.id, m.step, (m.step + 1) as OperationStep).length > 0 : false;
  return (
    <button onClick={onOpen} className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-card transition hover:border-slate-300">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-xs text-slate-500">{m.ref}</p>
          <p className="font-semibold">
            {placeName(m.origin)} → {placeName(m.destination)}
          </p>
        </div>
        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", m.step >= 6 ? "bg-success-50 text-success-700" : m.delayed ? "bg-amber-50 text-amber-700" : "bg-brand-50 text-brand-700")}>{OPERATION_STEPS[m.step].short}</span>
      </div>
      <ProgressBar value={missionProgress(m.step)} tone={m.delayed ? "orange" : m.step >= 6 ? "green" : "blue"} className="mt-3" />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span>
          <span className="font-mono">{m.carrierAssignment?.plate}</span> · {m.carrierAssignment?.driverName}
        </span>
        <span>Départ {formatDateTime(m.plannedDeparture)}</span>
      </div>
      {blocked && (
        <p className="mt-2 inline-flex items-center gap-1 text-xs text-amber-700">
          <Lock className="size-3" /> Pièce en attente avant l&apos;étape suivante
        </p>
      )}
    </button>
  );
}

// ── Application ──────────────────────────────────────────────
export function CarrierApp() {
  const { data, carrier, carriers, requests, missions } = useCarrierContext();
  const [tab, setTab] = useState<Tab>("demandes");
  const [openId, setOpenId] = useState<string | null>(null);
  useLayoutEffect(() => {
    setActor(carrier?.name ?? null);
    setActorRole("Transporteur partenaire");
  }, [carrier?.name]);

  if (!carrier) return <EmptyState icon={Truck} title="Aucun transporteur actif" message="Ajoutez un transporteur partenaire depuis l'administration." />;

  const pending = requests.filter((r) => awaitsAnswer(r, carrier.id));
  const active = missions.filter((m) => m.step < 6).sort((a, b) => b.step - a.step);
  const done = missions.filter((m) => m.step >= 6);
  const notifications = data.notifications.filter((n) => n.carrierId === carrier.id).sort((a, b) => b.at.localeCompare(a.at));
  const unread = notifications.filter((n) => !n.read).length;
  const opened = missions.find((m) => m.id === openId);
  // uniquement ses propres factures : jamais le montant facturé au client
  const invoices = data.invoices.filter((i) => i.flow === "transporteur" && i.counterpartyId === carrier.id).sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  const unpaid = invoices.filter(isOpen);

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/">
            <Logo subtitle="Espace transporteur" />
          </Link>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <Select value={carrier.id} onChange={(e) => actions.setPrefs({ carrierId: e.target.value })} aria-label="Transporteur simulé" className="h-9 w-full text-sm sm:w-56">
              {carriers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-4 py-3 text-sm text-slate-700">
          <Link2 className="mt-0.5 size-4 shrink-0 text-brand-600" />
          <p>
            <strong>Accès par lien sécurisé (simulation).</strong> Un petit transporteur reçoit ce lien par SMS ou WhatsApp, sans compte ni application. Il ne voit que les demandes et missions qui lui sont adressées — jamais le client final ni le tarif.
          </p>
        </div>

        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{carrier.name}</h1>
            <p className="text-sm text-slate-500">
              {carrier.manager} · {carrier.city} · {carrier.fleetSize} véhicules
            </p>
          </div>
          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              { value: "demandes", label: "Demandes", count: pending.length },
              { value: "missions", label: "En cours", count: active.length },
              { value: "historique", label: "Historique" },
              { value: "factures", label: "Factures", count: invoices.filter(isOverdueInvoice).length },
              { value: "notifications", label: "Notifications", count: unread },
            ]}
          />
        </div>

        {tab === "demandes" && (
          <div className="space-y-3">
            {requests.map((r) => (
              <RequestCard key={r.id} request={r} carrier={carrier} data={data} />
            ))}
            {requests.length === 0 && <EmptyState icon={Inbox} title="Aucune demande" message="Les demandes de transport de vos donneurs d'ordre apparaîtront ici." />}
          </div>
        )}

        {tab === "missions" && (
          <div className="grid gap-3 md:grid-cols-2">
            {active.map((m) => (
              <MissionTile key={m.id} m={m} data={data} onOpen={() => setOpenId(m.id)} />
            ))}
            {active.length === 0 && (
              <div className="md:col-span-2">
                <EmptyState icon={Handshake} title="Aucune mission en cours" message="Acceptez une demande : la mission apparaîtra ici une fois confirmée." />
              </div>
            )}
          </div>
        )}

        {tab === "historique" && (
          <div className="grid gap-3 md:grid-cols-2">
            {done.map((m) => (
              <MissionTile key={m.id} m={m} data={data} onOpen={() => setOpenId(m.id)} />
            ))}
            {done.length === 0 && (
              <div className="md:col-span-2">
                <EmptyState icon={Clock} title="Aucune mission terminée" />
              </div>
            )}
          </div>
        )}

        {tab === "factures" && (
          <div>
            <p className="mb-3 text-sm text-slate-600">
              Reste à recevoir : <strong className="text-ink">{formatTotals(totalsByCurrency(unpaid))}</strong> sur {unpaid.length} facture(s).
            </p>
            <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
              {invoices.map((inv) => {
                const m = data.missions.find((x) => x.id === inv.missionId);
                return (
                  <li key={inv.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-xs font-semibold text-slate-600">{inv.ref}</span>
                        <InvoiceStatusBadges inv={inv} />
                      </div>
                      <p className="mt-0.5 text-sm">
                        {m ? `${m.ref} · ${placeName(m.origin)} → ${placeName(m.destination)}` : inv.label}
                      </p>
                      <p className="text-xs text-slate-500">
                        Émise le {formatDate(inv.issuedAt)} · échéance {formatDate(inv.dueAt)}
                        {inv.payments.map((p) => ` · payé ${formatMoney(p.amount, inv.currency)} le ${formatDate(p.at)} (${PAYMENT_MODES[p.mode]})`).join("")}
                      </p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-sm font-semibold tabular-nums">{formatMoney(inv.amount, inv.currency)}</p>
                      {isOpen(inv) && <p className="text-[11px] text-slate-500 tabular-nums">reste {formatMoney(remaining(inv), inv.currency)}</p>}
                    </div>
                  </li>
                );
              })}
              {invoices.length === 0 && <li className="px-4 py-8 text-center text-sm text-slate-500">Aucune facture enregistrée par votre donneur d&apos;ordre.</li>}
            </ul>
            <p className="mt-2 text-[11px] text-slate-400">Statuts tenus par le donneur d&apos;ordre. Aucun paiement ne transite par LogiTrack.</p>
          </div>
        )}

        {tab === "notifications" && unread > 0 && (
          <div className="mb-2 flex justify-end">
            <Button size="sm" variant="ghost" onClick={() => actions.markCarrierNotificationsRead(carrier.id)}>
              Tout marquer comme lu
            </Button>
          </div>
        )}
        {tab === "notifications" && (
          <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
            {notifications.map((n) => (
              <li key={n.id}>
                <button
                  className={cn("flex w-full gap-3 px-4 py-3 text-left hover:bg-slate-50", !n.read && "bg-brand-50/30")}
                  onClick={() => {
                    actions.markNotificationRead(n.id);
                    const mid = n.link?.kind === "mission" ? n.link.id : null;
                    if (mid && missions.some((m) => m.id === mid)) setOpenId(mid);
                    else setTab("demandes");
                  }}
                >
                  <Bell className={cn("mt-0.5 size-4 shrink-0", n.read ? "text-slate-300" : "text-brand-600")} />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{n.title}</span>
                    <span className="block text-xs text-slate-500">{n.message}</span>
                    <span className="block text-[11px] text-slate-400">{formatDateTime(n.at)}</span>
                  </span>
                </button>
              </li>
            ))}
            {notifications.length === 0 && <li className="px-4 py-8 text-center text-sm text-slate-500">Aucune notification.</li>}
          </ul>
        )}
      </main>

      {opened && <CarrierMission mission={opened} carrier={carrier} data={data} onClose={() => setOpenId(null)} />}
    </div>
  );
}

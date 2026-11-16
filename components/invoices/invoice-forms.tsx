"use client";

import { useState } from "react";
import { actions, useAppData } from "@/lib/store";
import { CURRENCIES, DEBOURS_LABELS, DEMO_NOW, INVOICE_FLOWS, PAYMENT_MODES } from "@/lib/constants";
import { placeName } from "@/lib/data/geo";
import { fromLocalInput, toLocalInput, uid } from "@/lib/utils";
import { formatMoney, remaining } from "@/lib/utils/invoices";
import type { Currency, Invoice, InvoiceFlow, Mission, PaymentMode } from "@/types";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { demoNowIso } from "@/lib/utils/clock";

const DAY = 24 * 3600 * 1000;
const dateOnly = (iso: string) => toLocalInput(iso).slice(0, 10);
const fromDate = (d: string) => fromLocalInput(`${d}T12:00`);

// ── Création / modification ──────────────────────────────────
function InvoiceForm({ mission, flow: initialFlow, invoice, by, onClose }: { mission: Mission; flow: InvoiceFlow; invoice?: Invoice; by: string; onClose: () => void }) {
  const data = useAppData();
  const { toast } = useToast();
  const client = data.companies.find((c) => c.id === mission.clientId);
  const partners = data.carriers.filter((c) => c.companyId === mission.companyId);
  const [flow, setFlow] = useState<InvoiceFlow>(invoice?.flow ?? initialFlow);
  const [label, setLabel] = useState(invoice?.label ?? (initialFlow === "debours" ? DEBOURS_LABELS[0] : `Transport ${placeName(mission.origin)} → ${placeName(mission.destination)}`));
  const [carrierId, setCarrierId] = useState(invoice?.flow === "transporteur" ? (invoice.counterpartyId ?? "") : (mission.carrierId ?? partners[0]?.id ?? ""));
  const [supplier, setSupplier] = useState(invoice?.flow === "debours" ? invoice.counterpartyName : "Port de Djibouti SA");
  const [ref, setRef] = useState(invoice?.ref ?? "");
  const [amount, setAmount] = useState(invoice ? String(invoice.amount) : flow === "client" ? String(mission.priceDjf) : "");
  const [currency, setCurrency] = useState<Currency>(invoice?.currency ?? "DJF");
  const [issued, setIssued] = useState(dateOnly(invoice?.issuedAt ?? DEMO_NOW));
  const [due, setDue] = useState(dateOnly(invoice?.dueAt ?? new Date(Date.parse(DEMO_NOW) + 15 * DAY).toISOString()));
  const [status, setStatus] = useState<"brouillon" | "emise">(invoice?.status === "brouillon" ? "brouillon" : "emise");

  const value = Number(amount.replace(/\s/g, "").replace(",", "."));
  const valid = label.trim().length > 1 && value > 0 && !!issued && !!due && (flow !== "transporteur" || !!carrierId) && (flow !== "debours" || supplier.trim().length > 1);

  const submit = () => {
    const draft = invoice ?? { ...actions.newInvoiceDraft(data, flow), payments: [], createdAt: demoNowIso(), rebilledOn: null };
    const counterparty =
      flow === "client"
        ? { counterpartyId: mission.clientId, counterpartyName: client?.name ?? "Client" }
        : flow === "transporteur"
          ? { counterpartyId: carrierId, counterpartyName: data.carriers.find((c) => c.id === carrierId)?.name ?? "Transporteur" }
          : { counterpartyId: null, counterpartyName: supplier.trim() };
    const inv: Invoice = {
      ...draft,
      ...counterparty,
      ref: ref.trim() || draft.ref,
      missionId: mission.id,
      flow,
      label: label.trim(),
      amount: value,
      currency,
      issuedAt: fromDate(issued),
      dueAt: fromDate(flow === "debours" ? issued : due),
      // un débours est un frais déjà réglé par l'entreprise
      status: flow === "debours" ? "payee" : invoice && invoice.status !== "brouillon" && invoice.status !== "emise" ? invoice.status : status,
      payments: flow === "debours" && !invoice ? [{ id: uid("pay"), at: fromDate(issued), amount: value, mode: "virement" as const, by }] : draft.payments,
      updatedAt: demoNowIso(),
    };
    actions.saveInvoice(inv);
    toast(invoice ? "Facture modifiée" : flow === "debours" ? "Débours enregistré" : "Facture enregistrée", { message: `${inv.ref} — ${formatMoney(inv.amount, inv.currency)}` });
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={invoice ? `Modifier ${invoice.ref}` : "Nouvelle facture ou débours"}
      description={`Mission ${mission.ref}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button disabled={!valid} onClick={submit}>
            Enregistrer
          </Button>
        </>
      }
    >
      {!invoice && (
        <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {(Object.keys(INVOICE_FLOWS) as InvoiceFlow[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => {
                setFlow(f);
                setLabel(f === "debours" ? DEBOURS_LABELS[0] : f === "transporteur" ? `Mission ${mission.ref}` : `Transport ${placeName(mission.origin)} → ${placeName(mission.destination)}`);
                setAmount(f === "client" ? String(mission.priceDjf) : "");
              }}
              className={`rounded-xl border p-2.5 text-left text-xs transition ${flow === f ? "border-brand-600 bg-brand-50 ring-2 ring-brand-600/15" : "border-slate-200 hover:border-slate-300"}`}
            >
              <span className="block text-sm font-semibold">{INVOICE_FLOWS[f].label}</span>
              <span className="text-slate-500">{INVOICE_FLOWS[f].hint}</span>
            </button>
          ))}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {flow === "debours" ? (
          <>
            <Field label="Nature du débours" required>
              <Select value={DEBOURS_LABELS.includes(label) ? label : "Autre débours"} onChange={(e) => setLabel(e.target.value)}>
                {DEBOURS_LABELS.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </Select>
            </Field>
            <Field label="Payé à" required>
              <Input value={supplier} onChange={(e) => setSupplier(e.target.value)} />
            </Field>
          </>
        ) : (
          <Field label="Objet" required className="sm:col-span-2">
            <Input value={label} onChange={(e) => setLabel(e.target.value)} />
          </Field>
        )}
        {flow === "client" && (
          <Field label="Client">
            <Input value={client?.name ?? "—"} disabled />
          </Field>
        )}
        {flow === "transporteur" && (
          <Field label="Transporteur" required>
            <Select value={carrierId} onChange={(e) => setCarrierId(e.target.value)}>
              {partners.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label={flow === "debours" ? "N° de reçu" : "N° de facture"} hint={invoice ? undefined : "Laisser vide pour une numérotation automatique."}>
          <Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder={invoice?.ref ?? "Automatique"} />
        </Field>
        <div className="grid grid-cols-[1fr_6rem] gap-2">
          <Field label="Montant" required>
            <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <Field label="Devise">
            <Select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)}>
              {CURRENCIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label={flow === "debours" ? "Date du paiement" : "Date d'émission"} required>
          <Input type="date" value={issued} onChange={(e) => setIssued(e.target.value)} />
        </Field>
        {flow !== "debours" && (
          <Field label="Échéance" required>
            <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          </Field>
        )}
        {flow !== "debours" && (!invoice || invoice.status === "brouillon" || invoice.status === "emise") && (
          <Field label="Statut">
            <Select value={status} onChange={(e) => setStatus(e.target.value as "brouillon" | "emise")}>
              <option value="brouillon">Brouillon</option>
              <option value="emise">Émise</option>
            </Select>
          </Field>
        )}
      </div>
    </Modal>
  );
}

export function InvoiceFormModal({ open, onClose, mission, flow = "client", invoice, by }: { open: boolean; onClose: () => void; mission: Mission; flow?: InvoiceFlow; invoice?: Invoice; by: string }) {
  return open ? <InvoiceForm mission={mission} flow={flow} invoice={invoice} by={by} onClose={onClose} /> : null;
}

// ── Paiement ─────────────────────────────────────────────────
function PaymentForm({ invoice, by, onClose }: { invoice: Invoice; by: string; onClose: () => void }) {
  const { toast } = useToast();
  const left = remaining(invoice);
  const [amount, setAmount] = useState(String(left));
  const [date, setDate] = useState(dateOnly(DEMO_NOW));
  const [mode, setMode] = useState<PaymentMode>("virement");
  const [reference, setReference] = useState("");
  const value = Number(amount.replace(/\s/g, "").replace(",", "."));
  const valid = value > 0 && value <= left + 0.001 && !!date;
  return (
    <Modal
      open
      size="sm"
      onClose={onClose}
      title={invoice.flow === "client" ? "Enregistrer un encaissement" : "Enregistrer un paiement"}
      description={`${invoice.ref} · reste dû ${formatMoney(left, invoice.currency)}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button
            variant="success"
            disabled={!valid}
            onClick={() => {
              actions.recordPayment(invoice.id, { at: fromDate(date), amount: value, mode, reference: reference.trim() || undefined, by });
              toast("Paiement enregistré", { message: `${formatMoney(value, invoice.currency)} — ${invoice.ref}`, tone: "success" });
              onClose();
            }}
          >
            Enregistrer
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <Field label={`Montant (${invoice.currency})`} required error={value > left + 0.001 ? "Supérieur au reste dû." : undefined}>
          <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date" required>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Mode">
            <Select value={mode} onChange={(e) => setMode(e.target.value as PaymentMode)}>
              {(Object.keys(PAYMENT_MODES) as PaymentMode[]).map((k) => (
                <option key={k} value={k}>
                  {PAYMENT_MODES[k]}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Référence" hint="N° de virement, de chèque ou de transaction.">
          <Input value={reference} onChange={(e) => setReference(e.target.value)} />
        </Field>
        <p className="text-xs text-slate-500">Information de suivi : aucun paiement ne transite par LogiTrack.</p>
      </div>
    </Modal>
  );
}

export function PaymentModal({ invoice, by, onClose }: { invoice: Invoice | null; by: string; onClose: () => void }) {
  return invoice ? <PaymentForm invoice={invoice} by={by} onClose={onClose} /> : null;
}

// ── Contestation / annulation ────────────────────────────────
function ReasonForm({ invoice, mode, onClose }: { invoice: Invoice; mode: "contestee" | "annulee"; onClose: () => void }) {
  const { toast } = useToast();
  const [note, setNote] = useState("");
  return (
    <Modal
      open
      size="sm"
      onClose={onClose}
      title={mode === "contestee" ? "Facture contestée" : "Annuler la facture"}
      description={invoice.ref}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Retour
          </Button>
          <Button
            variant="danger"
            disabled={note.trim().length < 5}
            onClick={() => {
              actions.setInvoiceStatus(invoice.id, mode, note.trim());
              toast(mode === "contestee" ? "Contestation enregistrée" : "Facture annulée", { message: invoice.ref, tone: "warning" });
              onClose();
            }}
          >
            Confirmer
          </Button>
        </>
      }
    >
      <Field label="Motif" required hint={mode === "annulee" ? "Une facture annulée reste visible dans l'historique." : undefined}>
        <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder={mode === "contestee" ? "Ex. : le client conteste le nombre de colis livrés" : "Ex. : erreur de montant, facture remplacée par…"} />
      </Field>
    </Modal>
  );
}

export function ReasonModal({ target, onClose }: { target: { invoice: Invoice; mode: "contestee" | "annulee" } | null; onClose: () => void }) {
  return target ? <ReasonForm invoice={target.invoice} mode={target.mode} onClose={onClose} /> : null;
}

"use client";

import { useState } from "react";
import { Ban, Banknote, CircleAlert, Link2, Paperclip, Pencil, Plus, Send, Trash2, Unlink } from "lucide-react";
import { actions } from "@/lib/store";
import { INVOICE_FLOWS, INVOICE_STATUS, PAYMENT_MODES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { daysLate, formatMoney, formatTotals, invoiceStatus, isOpen, paidAmount, remaining, toRebill, totalsByCurrency } from "@/lib/utils/invoices";
import type { Invoice, InvoiceFlow, Mission } from "@/types";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActionMenu, type MenuItem } from "@/components/ui/dropdown";
import { useToast } from "@/components/ui/toast";
import { DetailSection } from "@/components/details/parts";
import { useFilePicker } from "@/components/documents/mission-documents";
import { InvoiceFormModal, PaymentModal, ReasonModal } from "./invoice-forms";

const FLOW_ORDER: InvoiceFlow[] = ["client", "debours", "transporteur"];

/** Ligne de facture avec ses actions ; réutilisée dans la page Factures. */
export function useInvoiceActions(by: string) {
  const { toast } = useToast();
  const [pay, setPay] = useState<Invoice | null>(null);
  const [reason, setReason] = useState<{ invoice: Invoice; mode: "contestee" | "annulee" } | null>(null);
  const { pick, element } = useFilePicker((id, file) => {
    actions.attachInvoiceFile(id, file);
    toast("Justificatif joint", { message: file.fileName });
  });

  const menu = (inv: Invoice, clientInvoices: Invoice[], onEdit?: () => void): (MenuItem | false)[] => {
    const st = inv.status;
    const rebillTarget = clientInvoices.find((c) => c.status !== "annulee");
    return [
      inv.flow !== "debours" && isOpen(inv) && st !== "contestee" && { label: inv.flow === "client" ? "Enregistrer un encaissement" : "Enregistrer un paiement", icon: Banknote, onClick: () => setPay(inv) },
      inv.flow === "client" && (st === "brouillon" || st === "emise") && {
        label: st === "brouillon" ? "Émettre" : "Marquer comme envoyée",
        icon: Send,
        onClick: () => {
          actions.setInvoiceStatus(inv.id, st === "brouillon" ? "emise" : "envoyee");
          toast(st === "brouillon" ? "Facture émise" : "Facture envoyée", { message: inv.ref });
        },
      },
      inv.flow !== "debours" && isOpen(inv) && st !== "contestee" && { label: "Signaler une contestation", icon: CircleAlert, onClick: () => setReason({ invoice: inv, mode: "contestee" }) },
      st === "contestee" && {
        label: "Lever la contestation",
        icon: CircleAlert,
        onClick: () => {
          actions.setInvoiceStatus(inv.id, paidAmount(inv) >= inv.amount ? "payee" : paidAmount(inv) > 0 ? "partielle" : "envoyee");
          toast("Contestation levée", { message: inv.ref });
        },
      },
      toRebill(inv) && rebillTarget && {
        label: `Refacturé sur ${rebillTarget.ref}`,
        icon: Link2,
        onClick: () => {
          actions.setDeboursRebilled(inv.id, rebillTarget.ref);
          toast("Débours refacturé", { message: `${inv.ref} → ${rebillTarget.ref}` });
        },
      },
      inv.flow === "debours" && inv.rebilledOn && { label: "Retirer la refacturation", icon: Unlink, onClick: () => actions.setDeboursRebilled(inv.id, null) },
      { label: inv.attachment ? "Remplacer le justificatif" : "Joindre le justificatif", icon: Paperclip, onClick: () => pick(inv.id) },
      onEdit && st !== "annulee" && (st !== "payee" || inv.flow === "debours") && { label: "Modifier", icon: Pencil, onClick: onEdit },
      st !== "annulee" && st !== "brouillon" && (inv.payments.length === 0 || inv.flow === "debours") && { label: inv.flow === "debours" ? "Annuler le débours" : "Annuler la facture", icon: Ban, danger: true, onClick: () => setReason({ invoice: inv, mode: "annulee" }) },
      st === "brouillon" && { label: "Supprimer le brouillon", icon: Trash2, danger: true, onClick: () => actions.deleteInvoice(inv.id) },
    ].map((item) => item || false);
  };

  const modals = (
    <>
      {element}
      <PaymentModal invoice={pay} by={by} onClose={() => setPay(null)} />
      <ReasonModal target={reason} onClose={() => setReason(null)} />
    </>
  );
  return { menu, modals };
}

export function InvoiceStatusBadges({ inv }: { inv: Invoice }) {
  const st = invoiceStatus(inv);
  if (inv.flow === "debours") {
    return toRebill(inv) ? <Badge tone="orange">À refacturer</Badge> : inv.rebilledOn ? <Badge tone="green">Refacturé · {inv.rebilledOn}</Badge> : <StatusBadge map={INVOICE_STATUS} value={inv.status} />;
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <StatusBadge map={INVOICE_STATUS} value={st} />
      {st === "en_retard" && <span className="text-[11px] font-medium text-red-600">+{daysLate(inv)} j</span>}
    </span>
  );
}

// ── Section « Factures et débours » de la fiche mission ──────
export function MissionInvoices({ mission: m, invoices, by, canEdit = true }: { mission: Mission; invoices: Invoice[]; by: string; canEdit?: boolean }) {
  const [form, setForm] = useState<{ flow: InvoiceFlow; invoice?: Invoice } | null>(null);
  const { menu, modals } = useInvoiceActions(by);
  const list = invoices.filter((i) => i.missionId === m.id);
  const clientInvoices = list.filter((i) => i.flow === "client");
  const due = list.filter((i) => i.flow === "client" && isOpen(i));
  const toPay = list.filter((i) => i.flow === "transporteur" && isOpen(i));
  const rebill = list.filter(toRebill);
  const podMissing = m.step < 6;

  return (
    <DetailSection title="Factures et débours" action={canEdit && <Button size="sm" variant="ghost" icon={Plus} onClick={() => setForm({ flow: "client" })}>Ajouter</Button>}>
      {list.length === 0 ? (
        <p className="text-sm text-slate-500">Aucune facture ni débours sur cette mission.</p>
      ) : (
        <>
          <div className="mb-3 grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 px-3 py-2">
              <p className="text-sm font-semibold tabular-nums">{formatTotals(totalsByCurrency(due))}</p>
              <p className="text-[11px] text-slate-500">Reste à encaisser</p>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-2">
              <p className="text-sm font-semibold tabular-nums">{formatTotals(totalsByCurrency(toPay))}</p>
              <p className="text-[11px] text-slate-500">Reste à payer (transporteur)</p>
            </div>
            <div className={`rounded-xl px-3 py-2 ${rebill.length && m.step >= 7 ? "bg-red-50" : "bg-slate-50"}`}>
              <p className="text-sm font-semibold tabular-nums">{formatTotals(totalsByCurrency(rebill, "amount"))}</p>
              <p className="text-[11px] text-slate-500">Débours à refacturer</p>
            </div>
          </div>
          {rebill.length > 0 && m.step >= 7 && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">Mission clôturée avec {rebill.length} débours non refacturé(s) : vérifiez la facture client.</p>}
          <div className="space-y-3">
            {FLOW_ORDER.map((flow) => {
              const rows = list.filter((i) => i.flow === flow);
              if (!rows.length) return null;
              return (
                <div key={flow}>
                  <p className="mb-1.5 text-[11px] font-medium tracking-wide text-slate-400 uppercase">{INVOICE_FLOWS[flow].label}s</p>
                  <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100">
                    {rows.map((inv) => (
                      <li key={inv.id} className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-start sm:gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-mono text-xs font-semibold text-slate-600">{inv.ref}</span>
                            <InvoiceStatusBadges inv={inv} />
                          </div>
                          <p className="mt-0.5 text-sm">{inv.label}</p>
                          <p className="text-xs text-slate-500">
                            {inv.counterpartyName} · {inv.flow === "debours" ? `payé le ${formatDate(inv.issuedAt)}` : `échéance ${formatDate(inv.dueAt)}`}
                            {inv.attachment && <> · <Paperclip className="inline size-3" /> {inv.attachment.fileName}</>}
                          </p>
                          {inv.flow === "transporteur" && podMissing && isOpen(inv) && <p className="mt-0.5 text-[11px] text-amber-700">Preuve de livraison pas encore reçue : à rapprocher avant paiement.</p>}
                          {inv.note && (inv.status === "contestee" || inv.status === "annulee") && <p className="mt-1 rounded-lg bg-red-50 px-2 py-1 text-xs text-red-700">{inv.note}</p>}
                          {inv.flow !== "debours" && inv.payments.length > 0 && (
                            <ul className="mt-1 space-y-0.5 text-[11px] text-slate-500">
                              {inv.payments.map((p) => (
                                <li key={p.id}>
                                  {formatDate(p.at)} · {formatMoney(p.amount, inv.currency)} · {PAYMENT_MODES[p.mode]}
                                  {p.reference ? ` · ${p.reference}` : ""}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2 sm:block sm:shrink-0 sm:text-right">
                          <p className="text-sm font-semibold tabular-nums">{formatMoney(inv.amount, inv.currency)}</p>
                          {inv.flow !== "debours" && isOpen(inv) && paidAmount(inv) > 0 && <p className="text-[11px] text-slate-500 tabular-nums">reste {formatMoney(remaining(inv), inv.currency)}</p>}
                          {canEdit && (
                            <div className="mt-1 flex justify-end">
                              <ActionMenu items={menu(inv, clientInvoices, () => setForm({ flow: inv.flow, invoice: inv }))} />
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </>
      )}
      <p className="mt-3 text-[11px] text-slate-400">Suivi uniquement : LogiTrack ne reçoit ni ne transfère d&apos;argent.</p>
      {modals}
      <InvoiceFormModal open={!!form} onClose={() => setForm(null)} mission={m} flow={form?.flow} invoice={form?.invoice} by={by} />
    </DetailSection>
  );
}

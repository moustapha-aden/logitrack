// ─────────────────────────────────────────────────────────────
// Factures et paiements : statuts calculés et totaux.
// La plateforme suit des statuts et conserve les justificatifs ;
// elle ne reçoit ni ne transfère d'argent.
// ─────────────────────────────────────────────────────────────
import { DEMO_NOW } from "@/lib/constants";
import type { Currency, Invoice, InvoiceStatus } from "@/types";

const DAY = 24 * 3600 * 1000;

export const paidAmount = (inv: Pick<Invoice, "payments">) => inv.payments.reduce((s, p) => s + p.amount, 0);
export const remaining = (inv: Pick<Invoice, "payments" | "amount">) => Math.max(0, inv.amount - paidAmount(inv));

/** Factures qui comptent dans les montants dus (ni brouillon, ni annulée). */
export const isOpen = (inv: Pick<Invoice, "status">) => inv.status !== "brouillon" && inv.status !== "annulee" && inv.status !== "payee";

/** Statut affiché : « en retard » si l'échéance est dépassée et qu'il reste un montant dû. */
export function invoiceStatus(inv: Pick<Invoice, "status" | "dueAt" | "flow">, now = Date.parse(DEMO_NOW)): InvoiceStatus | "en_retard" {
  if (inv.flow !== "debours" && (inv.status === "emise" || inv.status === "envoyee" || inv.status === "partielle") && Date.parse(inv.dueAt) < now) return "en_retard";
  return inv.status;
}

export const isOverdueInvoice = (inv: Pick<Invoice, "status" | "dueAt" | "flow">) => invoiceStatus(inv) === "en_retard";

/** Jours de retard (0 si non échue). */
export function daysLate(inv: Pick<Invoice, "dueAt">, now = Date.parse(DEMO_NOW)): number {
  return Math.max(0, Math.floor((now - Date.parse(inv.dueAt)) / DAY));
}

/** Débours avancé et pas encore refacturé au client. */
export const toRebill = (inv: Pick<Invoice, "flow" | "rebilledOn" | "status">) => inv.flow === "debours" && !inv.rebilledOn && inv.status !== "annulee";

/** Totaux par devise (jamais additionnés entre devises). */
export function totalsByCurrency(list: Pick<Invoice, "currency" | "amount" | "payments">[], pick: "remaining" | "amount" = "remaining"): Partial<Record<Currency, number>> {
  const out: Partial<Record<Currency, number>> = {};
  for (const inv of list) out[inv.currency] = (out[inv.currency] ?? 0) + (pick === "remaining" ? remaining(inv) : inv.amount);
  return out;
}

export function formatMoney(amount: number, currency: Currency): string {
  const digits = currency === "DJF" ? 0 : 2;
  return `${new Intl.NumberFormat("fr-FR", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(amount)} ${currency}`;
}

export function formatTotals(t: Partial<Record<Currency, number>>): string {
  const parts = (Object.entries(t) as [Currency, number][]).filter(([, v]) => v > 0).map(([c, v]) => formatMoney(v, c));
  return parts.length ? parts.join(" + ") : "0 DJF";
}

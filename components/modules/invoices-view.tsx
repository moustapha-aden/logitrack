"use client";

import { useState } from "react";
import { AlarmClock, HandCoins, Paperclip, Receipt, Wallet } from "lucide-react";
import { useData, usePermissions } from "@/lib/store/selectors";
import { DEMO_NOW, INVOICE_FLOWS } from "@/lib/constants";
import { formatDate, includesText } from "@/lib/utils";
import { formatMoney, formatTotals, isOpen, isOverdueInvoice, paidAmount, remaining, toRebill, totalsByCurrency } from "@/lib/utils/invoices";
import type { Invoice, InvoiceFlow } from "@/types";
import { Card, StatCard } from "@/components/ui/card";
import { ActionMenu } from "@/components/ui/dropdown";
import { AccessDenied, FilterSelect, LinkButton, PageHeader, SearchInput, Segmented, Toolbar } from "@/components/ui/misc";
import { DataTable, type Column } from "@/components/tables/data-table";
import { useDetail } from "@/components/details/detail-provider";
import { InvoiceStatusBadges, useInvoiceActions } from "@/components/invoices/mission-invoices";

type Tab = "encaisser" | "retard" | "payer" | "refacturer" | "all";

export function InvoicesView() {
  const { invoices, lookups } = useData();
  const { open } = useDetail();
  const perms = usePermissions();
  const actor = perms.actor;
  const { menu, modals } = useInvoiceActions(actor);
  const [tab, setTab] = useState<Tab>("encaisser");
  const [q, setQ] = useState("");
  const [flow, setFlow] = useState<InvoiceFlow | "all">("all");

  const receivable = invoices.filter((i) => i.flow === "client" && isOpen(i));
  const overdue = invoices.filter(isOverdueInvoice);
  const payable = invoices.filter((i) => i.flow === "transporteur" && isOpen(i));
  const rebill = invoices.filter(toRebill);

  const byTab: Record<Tab, (i: Invoice) => boolean> = {
    encaisser: (i) => i.flow === "client" && isOpen(i),
    retard: isOverdueInvoice,
    payer: (i) => i.flow === "transporteur" && isOpen(i),
    refacturer: toRebill,
    all: () => true,
  };
  const filtered = invoices.filter((i) => (flow === "all" || i.flow === flow) && includesText([i.ref, i.label, i.counterpartyName, lookups.mission(i.missionId)?.ref], q));
  const rows = filtered.filter(byTab[tab]).sort((a, b) => Number(isOverdueInvoice(b)) - Number(isOverdueInvoice(a)) || a.dueAt.localeCompare(b.dueAt));

  const columns: Column<Invoice>[] = [
    {
      key: "ref",
      header: "Pièce",
      cell: (i) => (
        <div className="min-w-0">
          <p className="font-mono text-xs font-semibold text-slate-600">{i.ref}</p>
          <p className="text-xs text-slate-500">{INVOICE_FLOWS[i.flow].label}</p>
        </div>
      ),
    },
    {
      key: "mission",
      header: "Mission",
      cell: (i) => (
        <LinkButton className="font-mono text-xs" onClick={() => open({ kind: "mission", id: i.missionId })}>
          {lookups.mission(i.missionId)?.ref ?? "—"}
        </LinkButton>
      ),
    },
    {
      key: "party",
      header: "Contrepartie",
      cell: (i) => (
        <div className="min-w-0">
          <p className="truncate text-sm">{i.counterpartyName}</p>
          <p className="truncate text-xs text-slate-500">{i.label}</p>
        </div>
      ),
    },
    { key: "due", header: "Échéance", hideBelow: "md", cell: (i) => <span className="text-xs whitespace-nowrap text-slate-600 tabular-nums">{i.flow === "debours" ? `payé ${formatDate(i.issuedAt)}` : formatDate(i.dueAt)}</span> },
    {
      key: "amount",
      header: "Montant",
      align: "right",
      cell: (i) => (
        <div className="text-right whitespace-nowrap">
          <p className="text-sm font-semibold tabular-nums">{formatMoney(i.amount, i.currency)}</p>
          {i.flow !== "debours" && isOpen(i) && paidAmount(i) > 0 && <p className="text-[11px] text-slate-500 tabular-nums">reste {formatMoney(remaining(i), i.currency)}</p>}
        </div>
      ),
    },
    { key: "status", header: "Statut", cell: (i) => <InvoiceStatusBadges inv={i} /> },
    { key: "file", header: "", hideBelow: "lg", cell: (i) => (i.attachment ? <Paperclip className="size-4 text-slate-400" aria-label={i.attachment.fileName} /> : null) },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (i) => (perms.can("invoice.edit") ? <ActionMenu items={menu(i, invoices.filter((x) => x.missionId === i.missionId && x.flow === "client"))} /> : null),
    },
  ];

  if (!perms.can("invoice.view")) return <AccessDenied />;

  return (
    <div>
      <PageHeader
        eyebrow="Exploitation"
        title="Factures et paiements"
        description="Suivi des factures clients, des factures transporteurs et des débours, rattachés aux missions. Aucun fonds ne transite par la plateforme."
      />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Reste à encaisser" value={<span className="text-base sm:text-lg">{formatTotals(totalsByCurrency(receivable))}</span>} icon={Wallet} tone="blue" hint={`${receivable.length} facture(s) client`} onClick={() => setTab("encaisser")} />
        <StatCard label="En retard de paiement" value={<span className="text-base sm:text-lg">{formatTotals(totalsByCurrency(overdue))}</span>} icon={AlarmClock} tone="red" hint={`${overdue.length} facture(s) échue(s)`} onClick={() => setTab("retard")} />
        <StatCard label="À payer aux transporteurs" value={<span className="text-base sm:text-lg">{formatTotals(totalsByCurrency(payable))}</span>} icon={HandCoins} tone="orange" hint={`${payable.length} facture(s)`} onClick={() => setTab("payer")} />
        <StatCard label="Débours à refacturer" value={<span className="text-base sm:text-lg">{formatTotals(totalsByCurrency(rebill, "amount"))}</span>} icon={Receipt} tone="violet" hint={`${rebill.length} débours`} onClick={() => setTab("refacturer")} />
      </div>
      <div className="mb-4">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: "encaisser", label: "À encaisser", count: filtered.filter(byTab.encaisser).length },
            { value: "retard", label: "En retard", count: filtered.filter(byTab.retard).length },
            { value: "payer", label: "À payer", count: filtered.filter(byTab.payer).length },
            { value: "refacturer", label: "Débours à refacturer", count: filtered.filter(byTab.refacturer).length },
            { value: "all", label: "Toutes", count: filtered.length },
          ]}
        />
      </div>
      <Card>
        <Toolbar>
          <SearchInput value={q} onChange={setQ} placeholder="N° de facture, client, transporteur, mission…" className="sm:w-80" />
          <FilterSelect label="Type" value={flow} onChange={setFlow} options={[{ value: "all", label: "Tous les types" }, ...(Object.keys(INVOICE_FLOWS) as InvoiceFlow[]).map((f) => ({ value: f, label: INVOICE_FLOWS[f].label }))]} />
        </Toolbar>
        <DataTable columns={columns} rows={rows} onRowClick={(i) => open({ kind: "mission", id: i.missionId })} emptyTitle="Aucune facture" emptyMessage="Aucune facture ne correspond à ces critères." />
      </Card>
      <p className="mt-3 text-xs text-slate-400">
        Les montants ne sont jamais additionnés entre devises. Statut « en retard » calculé à la date de la démonstration ({formatDate(DEMO_NOW)}).
      </p>
      {modals}
    </div>
  );
}

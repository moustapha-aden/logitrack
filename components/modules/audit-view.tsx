"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { useData, usePermissions } from "@/lib/store/selectors";
import { AUDIT_ACTIONS } from "@/lib/permissions";
import { formatDateTime, includesText } from "@/lib/utils";
import type { AuditAction, AuditEntry } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CompanyLogo } from "@/components/ui/media";
import { AccessDenied, FilterSelect, LinkButton, PageHeader, SearchInput, Toolbar } from "@/components/ui/misc";
import { DataTable, type Column } from "@/components/tables/data-table";
import { useDetail } from "@/components/details/detail-provider";

const TONES: Record<AuditAction, "neutral" | "blue" | "green" | "orange" | "red" | "navy" | "violet"> = {
  connexion: "navy",
  statut: "blue",
  document: "violet",
  facture: "green",
  partage: "orange",
  droits: "red",
  export: "orange",
  modification: "neutral",
};

/** Journal d'audit : consultation seule, aucune ligne ne peut être modifiée ni supprimée. */
export function AuditView() {
  const { audit, lookups, scope } = useData();
  const { can } = usePermissions();
  const { open } = useDetail();
  const [q, setQ] = useState("");
  const [action, setAction] = useState<AuditAction | "all">("all");
  const [company, setCompany] = useState("all");
  if (!can("audit.view")) return <AccessDenied />;

  const companies = [...new Set(audit.map((a) => a.companyId).filter(Boolean))] as string[];
  const rows = audit
    .filter((a) => (action === "all" || a.action === action) && (company === "all" || a.companyId === company) && includesText([a.actor, a.role, a.text], q))
    .sort((a, b) => b.at.localeCompare(a.at));

  const columns: Column<AuditEntry>[] = [
    { key: "at", header: "Date", cell: (a) => <span className="text-xs whitespace-nowrap text-slate-600 tabular-nums">{formatDateTime(a.at)}</span> },
    {
      key: "who",
      header: "Utilisateur",
      cell: (a) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{a.actor}</p>
          <p className="truncate text-xs text-slate-500">{a.role}</p>
        </div>
      ),
    },
    ...(!scope
      ? [
          {
            key: "company",
            header: "Entreprise",
            hideBelow: "lg" as const,
            cell: (a: AuditEntry) => {
              const c = lookups.company(a.companyId);
              return c ? (
                <span className="flex items-center gap-2">
                  <CompanyLogo company={c} size="xs" /> <span className="truncate text-xs">{c.name}</span>
                </span>
              ) : (
                <span className="text-xs text-slate-400">Plateforme</span>
              );
            },
          },
        ]
      : []),
    { key: "action", header: "Type", cell: (a) => <Badge tone={TONES[a.action]}>{AUDIT_ACTIONS[a.action]}</Badge> },
    {
      key: "text",
      header: "Action",
      cell: (a) => (
        <p className="max-w-xl text-sm text-slate-700">
          {a.text}
          {a.link?.kind === "mission" && (
            <>
              {" "}
              <LinkButton className="text-xs" onClick={() => open({ kind: "mission", id: a.link!.id })}>
                Ouvrir
              </LinkButton>
            </>
          )}
        </p>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Sécurité"
        title="Journal d'audit"
        description={scope ? "Qui a fait quoi, et quand, dans votre espace : connexions, statuts, documents, factures, partages et droits." : "Traces de toutes les organisations de la plateforme."}
      />
      <div className="mb-4 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-card">
        <Lock className="mt-0.5 size-4 shrink-0 text-slate-400" />
        <p>Journal non modifiable : aucune ligne ne peut être modifiée ni supprimée, y compris par un administrateur. Les entrées sont conservées plus longtemps que le fil d&apos;activité.</p>
      </div>
      <Card>
        <Toolbar>
          <SearchInput value={q} onChange={setQ} placeholder="Utilisateur, rôle, action, référence…" className="sm:w-80" />
          <FilterSelect label="Type" value={action} onChange={setAction} options={[{ value: "all", label: "Tous les types" }, ...(Object.keys(AUDIT_ACTIONS) as AuditAction[]).map((k) => ({ value: k, label: AUDIT_ACTIONS[k] }))]} />
          {!scope && <FilterSelect label="Entreprise" value={company} onChange={setCompany} options={[{ value: "all", label: "Toutes les entreprises" }, ...companies.map((id) => ({ value: id, label: lookups.company(id)?.name ?? id }))]} />}
        </Toolbar>
        <DataTable columns={columns} rows={rows} pageSize={25} emptyTitle="Aucune entrée" emptyMessage="Aucune action ne correspond à ces critères." />
      </Card>
    </div>
  );
}

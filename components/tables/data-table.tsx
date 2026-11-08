"use client";

import { useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAppData } from "@/lib/store";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/misc";

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
  /** masque la colonne sous un breakpoint */
  hideBelow?: "sm" | "md" | "lg" | "xl";
  align?: "left" | "right" | "center";
}

const hideClass = { sm: "hidden sm:table-cell", md: "hidden md:table-cell", lg: "hidden lg:table-cell", xl: "hidden xl:table-cell" };

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  onRowClick,
  pageSize = 10,
  emptyTitle = "Aucun résultat",
  emptyMessage = "Modifiez vos filtres ou votre recherche.",
}: {
  columns: Column<T>[];
  rows: T[];
  onRowClick?: (row: T) => void;
  pageSize?: number;
  emptyTitle?: string;
  emptyMessage?: string;
}) {
  const { settings } = useAppData();
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pages);
  const slice = rows.slice((current - 1) * pageSize, current * pageSize);
  const dense = settings.compactTables;

  if (rows.length === 0) return <EmptyState title={emptyTitle} message={emptyMessage} />;

  return (
    <div>
      <div className="scroll-thin overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-y border-slate-100 bg-slate-50/70 text-left text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
              {columns.map((c) => (
                <th key={c.key} className={cn("px-4 py-2.5 whitespace-nowrap first:pl-5 last:pr-5", c.hideBelow && hideClass[c.hideBelow], c.align === "right" && "text-right", c.align === "center" && "text-center", c.className)}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {slice.map((row) => (
              <tr
                key={row.id}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn("transition-colors", onRowClick && "cursor-pointer hover:bg-brand-50/40")}
              >
                {columns.map((c) => (
                  <td key={c.key} className={cn("px-4 first:pl-5 last:pr-5", dense ? "py-2" : "py-3", c.hideBelow && hideClass[c.hideBelow], c.align === "right" && "text-right", c.align === "center" && "text-center", c.className)}>
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col items-center justify-between gap-2 border-t border-slate-100 px-5 py-3 text-xs text-slate-500 sm:flex-row">
        <span>
          {(current - 1) * pageSize + 1}–{Math.min(current * pageSize, rows.length)} sur <strong className="text-ink">{rows.length}</strong> éléments
        </span>
        {pages > 1 && (
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(current - 1)} disabled={current === 1} className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40" aria-label="Page précédente">
              <ChevronLeft className="size-4" />
            </button>
            {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={cn("inline-flex size-8 items-center justify-center rounded-lg text-xs font-medium tabular-nums", p === current ? "bg-navy-900 text-white" : "text-slate-600 hover:bg-slate-100")}
                aria-current={p === current ? "page" : undefined}
              >
                {p}
              </button>
            ))}
            <button onClick={() => setPage(current + 1)} disabled={current === pages} className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40" aria-label="Page suivante">
              <ChevronRight className="size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

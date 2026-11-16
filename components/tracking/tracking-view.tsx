"use client";

import { ArrowRight, Check, Clock, FileText, Info, Link2Off, Phone, ShieldCheck, Truck, User } from "lucide-react";
import { useAppData } from "@/lib/store";
import { DOC_TYPES, GOODS_TYPES } from "@/lib/constants";
import { placeName } from "@/lib/data/geo";
import { cn, driverName, formatDate, formatDateTime } from "@/lib/utils";
import { isCleared } from "@/lib/utils/documents";
import { CLIENT_MILESTONES, estimatedArrival, milestoneAt, milestoneIndex, shareState } from "@/lib/utils/tracking";
import { CompanyLogo } from "@/components/ui/media";
import { Logo } from "@/components/layout/logo";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas">
      <main className="mx-auto max-w-2xl px-4 py-6 sm:py-10">{children}</main>
      <footer className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 pb-8 text-[11px] text-slate-400">
        <span>Lien personnel — merci de ne pas le transférer.</span>
        <span className="flex items-center gap-1.5">
          Suivi assuré par <Logo />
        </span>
      </footer>
    </div>
  );
}

function Unavailable({ title, message }: { title: string; message: string }) {
  return (
    <Shell>
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-card">
        <Link2Off className="mx-auto size-10 text-slate-300" />
        <h1 className="mt-4 text-lg font-semibold">{title}</h1>
        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{message}</p>
      </div>
    </Shell>
  );
}

/** Page publique ouverte par le client depuis le lien reçu. Aucune donnée interne n'y figure. */
export function TrackingView({ token }: { token: string }) {
  const data = useAppData();
  const m = data.missions.find((x) => x.clientShare?.token === token);
  const share = m?.clientShare;

  if (!m || !share) return <Unavailable title="Lien introuvable" message="Ce lien de suivi n'existe pas ou a été remplacé. Contactez votre transitaire pour obtenir un nouveau lien." />;
  const state = shareState(share);
  if (state === "desactive") return <Unavailable title="Lien désactivé" message="Votre transitaire a désactivé ce lien de suivi. Contactez-le pour en obtenir un nouveau." />;
  if (state === "expire") return <Unavailable title="Lien expiré" message={`Ce lien n'est plus valable depuis le ${formatDate(share.expiresAt)}.`} />;

  const company = data.companies.find((c) => c.id === m.companyId);
  const client = data.companies.find((c) => c.id === m.clientId);
  const load = data.loads.find((l) => l.missionId === m.id);
  const current = milestoneIndex(m.step);
  const delivered = m.step >= 6;
  const eta = estimatedArrival(m, data.incidents);
  const truckPlate = m.carrierAssignment?.plate ?? data.trucks.find((t) => t.id === m.truckId)?.plate;
  const driver = m.carrierAssignment ? { name: m.carrierAssignment.driverName, phone: m.carrierAssignment.driverPhone } : (() => {
    const d = data.drivers.find((x) => x.id === m.driverId);
    return d ? { name: driverName(d), phone: d.phone } : null;
  })();
  // seules les pièces cochées « client » et déjà vérifiées par le transitaire
  const docs = data.documents.filter((d) => d.missionId === m.id && d.sharedWith.includes("client") && isCleared(d));

  return (
    <Shell>
      <div className="flex items-center gap-3">
        <CompanyLogo company={company} size="md" />
        <div className="min-w-0">
          <p className="text-xs text-slate-500">Suivi de votre envoi</p>
          <p className="truncate font-semibold">{company?.name}</p>
        </div>
      </div>

      <section className="mt-5 overflow-hidden rounded-2xl bg-navy-900 text-white shadow-card">
        <div className="p-5 sm:p-6">
          <p className="font-mono text-xs text-white/60">Réf. {m.ref}</p>
          <h1 className="mt-1 flex flex-wrap items-center gap-2 text-xl font-semibold sm:text-2xl">
            {placeName(m.origin)} <ArrowRight className="size-5 text-white/50" /> {placeName(m.destination)}
          </h1>
          <p className="mt-1 text-sm text-white/70">
            {GOODS_TYPES[m.goodsType]}
            {load?.containerNo ? ` · ${load.containerNo}` : ""}
            {client ? ` · ${client.name}` : ""}
          </p>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] tracking-wide text-white/50 uppercase">Statut actuel</p>
              <p className="mt-0.5 text-lg font-semibold">{CLIENT_MILESTONES[current].label}</p>
              {m.delayed && !delivered && <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2 py-0.5 text-xs text-amber-200"><Clock className="size-3" /> Retard signalé</p>}
            </div>
            <div className="text-right">
              <p className="text-[11px] tracking-wide text-white/50 uppercase">{delivered ? "Livré le" : "Livraison estimée"}</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums">{delivered ? formatDateTime(milestoneAt(m, 6) ?? eta) : formatDateTime(eta)}</p>
              {!delivered && <p className="text-[11px] text-white/50">Estimation, susceptible d&apos;évoluer</p>}
            </div>
          </div>
        </div>
      </section>

      {share.publicNote && (
        <section className="mt-4 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <Info className="mt-0.5 size-5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-900">Information de votre transitaire</p>
            <p className="mt-0.5 text-sm text-amber-900/90">{share.publicNote}</p>
            {share.publicNoteAt && <p className="mt-1 text-[11px] text-amber-700/70">{formatDateTime(share.publicNoteAt)}</p>}
          </div>
        </section>
      )}

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
        <h2 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Étapes</h2>
        <ol className="mt-4">
          {CLIENT_MILESTONES.map((ms, i) => {
            const done = i < current || (i === current && delivered);
            const isCurrent = i === current && !delivered;
            const at = milestoneAt(m, ms.from);
            return (
              <li key={ms.label} className="relative flex gap-3 pb-5 last:pb-0">
                {i < CLIENT_MILESTONES.length - 1 && <span className={cn("absolute top-7 left-[13px] h-[calc(100%-1.5rem)] w-0.5", i < current ? "bg-success-600" : "bg-slate-200")} />}
                <span className={cn("relative z-10 inline-flex size-7 shrink-0 items-center justify-center rounded-full border-2", isCurrent ? "border-brand-600 bg-white text-brand-600" : done ? "border-success-600 bg-success-600 text-white" : "border-slate-200 bg-white text-slate-300")}>
                  {done && !isCurrent ? <Check className="size-4" /> : <span className="size-2 rounded-full bg-current" />}
                </span>
                <div className="pt-0.5">
                  <p className={cn("text-sm font-medium", !done && !isCurrent && "text-slate-400")}>{ms.label}</p>
                  {at && (done || isCurrent) && <p className="text-xs text-slate-500 tabular-nums">{formatDateTime(at)}</p>}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {(share.showPlate || share.showDriver) && (truckPlate || driver) && (
        <section className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:grid-cols-2">
          {share.showPlate && truckPlate && (
            <p className="flex items-center gap-2 text-sm">
              <Truck className="size-4 text-slate-400" /> Camion <span className="font-mono font-semibold">{truckPlate}</span>
            </p>
          )}
          {share.showDriver && driver && (
            <p className="flex items-center gap-2 text-sm">
              <User className="size-4 text-slate-400" /> {driver.name} · <Phone className="size-3 text-slate-400" /> {driver.phone}
            </p>
          )}
        </section>
      )}

      {docs.length > 0 && (
        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <h2 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Documents mis à disposition</h2>
          <ul className="mt-3 divide-y divide-slate-100">
            {docs.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="flex items-center gap-2 text-sm">
                  <FileText className="size-4 text-slate-400" /> {DOC_TYPES[d.type].label}
                </span>
                <span className="text-xs text-slate-400" title="Le contenu des fichiers n'est pas conservé dans la démonstration">
                  {d.versions.at(-1) ? formatDate(d.versions.at(-1)!.at) : "—"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
        <div>
          <p className="text-sm font-medium">Une question sur votre envoi ?</p>
          <p className="text-xs text-slate-500">Contactez {company?.name} en citant la référence {m.ref}.</p>
        </div>
        <a href={`tel:${company?.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50">
          <Phone className="size-4" /> {company?.phone}
        </a>
      </section>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-400">
        <ShieldCheck className="size-3.5" /> Informations partagées par votre transitaire · lien valable jusqu&apos;au {formatDate(share.expiresAt)}
      </p>
    </Shell>
  );
}

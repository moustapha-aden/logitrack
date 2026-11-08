"use client";

import { useState } from "react";
import {
  BadgeCheck,
  Building2,
  CalendarClock,
  Gauge,
  IdCard,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Power,
  ShieldCheck,
  Star,
  Trash2,
  Truck as TruckIcon,
  Wrench,
} from "lucide-react";
import { actions } from "@/lib/store";
import { useData } from "@/lib/store/selectors";
import { ACTIVE_STATUS, CARRIER_STATUS, COMPANY_TYPES, DRIVER_AVAILABILITY, TRUCK_STATUS, TRUCK_TYPES } from "@/lib/constants";
import { driverName, formatDate, formatDjf, formatNumber, isActiveMission } from "@/lib/utils";
import type { TruckStatus } from "@/types";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CompanyLogo, DriverAvatar, SafeImage } from "@/components/ui/media";
import { ConfirmDialog } from "@/components/ui/modal";
import { InfoRow } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { CarrierFormModal } from "@/components/forms/carrier-form";
import { CompanyFormModal } from "@/components/forms/company-form";
import { DriverFormModal } from "@/components/forms/driver-form";
import { TruckFormModal } from "@/components/forms/truck-form";
import { useDetail } from "./detail-provider";
import { DetailSection, EntityLink, MiniStat, MissionRow, NotFound } from "./parts";

// ── Entreprise ───────────────────────────────────────────────
export function CompanyDetail({ id }: { id: string }) {
  const { all, lookups, scope } = useData();
  const { open } = useDetail();
  const { toast } = useToast();
  const [edit, setEdit] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const c = lookups.company(id);
  if (!c) return <NotFound />;

  const isClient = c.type === "client";
  const trucks = all.trucks.filter((t) => t.companyId === id);
  const drivers = all.drivers.filter((d) => d.companyId === id);
  const missions = all.missions.filter((m) => (isClient ? m.clientId === id : m.companyId === id)).sort((a, b) => b.plannedDeparture.localeCompare(a.plannedDeparture));
  const revenue = missions.reduce((s, m) => s + m.priceDjf, 0);

  return (
    <div>
      <div className="relative h-36 bg-navy-900">
        <SafeImage src={isClient ? "/images/parc-camions-corridor.jpg" : "/images/port-terminal.jpg"} alt="" className="absolute inset-0 opacity-40" sizes="700px" fallback="image" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-900 to-transparent" />
      </div>
      <div className="-mt-12 space-y-4 px-5 pb-8 sm:px-6">
        <div className="relative flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-end gap-4">
            <span className="rounded-2xl bg-white p-1 shadow-card">
              <CompanyLogo company={c} size="xl" />
            </span>
            <div className="pb-1">
              <div className="flex flex-wrap gap-1.5">
                <StatusBadge map={COMPANY_TYPES} value={c.type} />
                <StatusBadge map={ACTIVE_STATUS} value={c.status} />
              </div>
              <h2 className="mt-1.5 text-xl font-semibold text-ink">{c.name}</h2>
            </div>
          </div>
          {!scope && (
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" icon={Pencil} onClick={() => setEdit(true)}>
                Modifier
              </Button>
              <Button variant={c.status === "actif" ? "secondary" : "success"} size="sm" icon={Power} onClick={() => setConfirm(true)}>
                {c.status === "actif" ? "Désactiver" : "Activer"}
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <MiniStat label="Camions" value={trucks.length} />
          <MiniStat label="Chauffeurs" value={drivers.length} />
          <MiniStat label="Missions" value={missions.length} />
          <MiniStat label="Volume d'affaires" value={<span className="text-sm">{formatDjf(revenue)}</span>} />
        </div>

        <DetailSection title="Coordonnées">
          <div className="divide-y divide-slate-100">
            <InfoRow icon={Building2} label="Responsable" value={c.manager} />
            <InfoRow icon={Phone} label="Téléphone" value={c.phone} />
            <InfoRow icon={Mail} label="E-mail" value={c.email} />
            <InfoRow icon={MapPin} label="Adresse" value={`${c.address}, ${c.city}`} />
            <InfoRow icon={IdCard} label="NIF" value={<span className="font-mono text-xs">{c.nif || "—"}</span>} />
            <InfoRow icon={CalendarClock} label="Inscrite le" value={formatDate(c.createdAt)} />
          </div>
        </DetailSection>

        {!isClient && (
          <DetailSection title={`Flotte (${trucks.length})`}>
            {trucks.length ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {trucks.map((t) => (
                  <EntityLink
                    key={t.id}
                    onClick={() => open({ kind: "truck", id: t.id })}
                    leading={<SafeImage src={t.image} alt={t.plate} className="h-10 w-14 shrink-0 rounded-lg" sizes="56px" />}
                    label={<span className="font-mono">{t.plate}</span>}
                    sub={<StatusBadge map={TRUCK_STATUS} value={t.status} />}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Aucun camion enregistré.</p>
            )}
          </DetailSection>
        )}

        <DetailSection title={isClient ? "Missions commandées" : "Missions récentes"}>
          <div className="space-y-2">
            {missions.slice(0, 5).map((m) => (
              <MissionRow key={m.id} mission={m} />
            ))}
            {missions.length === 0 && <p className="text-sm text-slate-500">Aucune mission.</p>}
          </div>
        </DetailSection>
      </div>
      <CompanyFormModal open={edit} onClose={() => setEdit(false)} company={c} />
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        tone={c.status === "actif" ? "danger" : "primary"}
        title={c.status === "actif" ? "Désactiver l'entreprise ?" : "Réactiver l'entreprise ?"}
        message={c.status === "actif" ? `${c.name} ne pourra plus créer de missions tant qu'elle restera inactive.` : `${c.name} retrouvera l'accès à son espace de travail.`}
        confirmLabel={c.status === "actif" ? "Désactiver" : "Activer"}
        onConfirm={() => {
          actions.toggleCompany(c.id);
          toast(c.status === "actif" ? "Entreprise désactivée" : "Entreprise activée", { message: c.name, tone: c.status === "actif" ? "warning" : "success" });
        }}
      />
    </div>
  );
}

// ── Transporteur ─────────────────────────────────────────────
export function CarrierDetail({ id }: { id: string }) {
  const { all, lookups } = useData();
  const { open, close } = useDetail();
  const { toast } = useToast();
  const [edit, setEdit] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const c = lookups.carrier(id);
  if (!c) return <NotFound />;
  const company = lookups.company(c.companyId);
  const missions = all.missions.filter((m) => m.carrierId === id);

  return (
    <div className="space-y-4 px-5 pt-14 pb-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-4">
          <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-navy-900 text-white">
            <TruckIcon className="size-6" />
          </span>
          <div>
            <StatusBadge map={CARRIER_STATUS} value={c.status} />
            <h2 className="mt-1 text-xl font-semibold">{c.name}</h2>
            <p className="text-sm text-slate-500">Transporteur partenaire · {c.city}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={Pencil} onClick={() => setEdit(true)}>
            Modifier
          </Button>
          <Button variant="secondary" size="sm" icon={Trash2} className="text-red-600" onClick={() => setConfirm(true)}>
            Supprimer
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <MiniStat label="Véhicules" value={c.fleetSize} />
        <MiniStat label="Missions" value={missions.length} />
        <MiniStat label="En cours" value={missions.filter(isActiveMission).length} />
      </div>
      <DetailSection title="Coordonnées">
        <div className="divide-y divide-slate-100">
          <InfoRow icon={Building2} label="Responsable" value={c.manager} />
          <InfoRow icon={Phone} label="Téléphone" value={c.phone} />
          <InfoRow icon={Mail} label="E-mail" value={c.email} />
        </div>
      </DetailSection>
      <DetailSection title="Entreprise donneuse d'ordre">
        <EntityLink onClick={() => company && open({ kind: "company", id: company.id })} leading={<CompanyLogo company={company} />} label={company?.name ?? "—"} sub={company ? COMPANY_TYPES[company.type].label : undefined} />
      </DetailSection>
      <DetailSection title="Missions confiées">
        <div className="space-y-2">
          {missions.map((m) => (
            <MissionRow key={m.id} mission={m} />
          ))}
          {missions.length === 0 && <p className="text-sm text-slate-500">Aucune mission confiée.</p>}
        </div>
      </DetailSection>
      <CarrierFormModal open={edit} onClose={() => setEdit(false)} carrier={c} />
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Supprimer ce transporteur ?"
        message={`${c.name} sera retiré de la liste. Les missions associées seront conservées sans transporteur.`}
        confirmLabel="Supprimer"
        onConfirm={() => {
          actions.deleteCarrier(c.id);
          toast("Transporteur supprimé", { message: c.name, tone: "info" });
          close();
        }}
      />
    </div>
  );
}

// ── Camion ───────────────────────────────────────────────────
export function TruckDetail({ id }: { id: string }) {
  const { all, lookups } = useData();
  const { open, close } = useDetail();
  const { toast } = useToast();
  const [edit, setEdit] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const t = lookups.truck(id);
  if (!t) return <NotFound />;
  const company = lookups.company(t.companyId);
  const driver = lookups.driver(t.driverId);
  const missions = all.missions.filter((m) => m.truckId === id).sort((a, b) => b.plannedDeparture.localeCompare(a.plannedDeparture));
  const current = missions.find(isActiveMission);
  const done = missions.filter((m) => m.step >= 6).length;
  const manualStatuses: TruckStatus[] = ["disponible", "maintenance", "immobilise"];

  return (
    <div>
      <div className="relative">
        <SafeImage src={t.image} alt={`${t.brand} ${t.model} — ${t.plate}`} className="h-60 sm:h-72" sizes="700px" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/85 via-navy-950/20 to-transparent" />
        <div className="absolute right-5 bottom-4 left-5 text-white sm:left-6">
          <StatusBadge map={TRUCK_STATUS} value={t.status} />
          <h2 className="mt-2 font-mono text-2xl font-semibold tracking-wide">{t.plate}</h2>
          <p className="text-sm text-white/80">
            {t.brand} {t.model} · {TRUCK_TYPES[t.type]}
          </p>
        </div>
      </div>
      <div className="space-y-4 px-5 py-5 sm:px-6">
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" icon={Pencil} onClick={() => setEdit(true)}>
            Modifier
          </Button>
          {manualStatuses.map((s) => (
            <Button
              key={s}
              size="sm"
              variant={t.status === s ? "dark" : "ghost"}
              disabled={t.status === "en_mission" || t.status === s}
              icon={s === "maintenance" ? Wrench : s === "disponible" ? BadgeCheck : Power}
              onClick={() => {
                actions.setTruckStatus(t.id, s);
                toast("Statut du véhicule mis à jour", { message: `${t.plate} : ${TRUCK_STATUS[s].label}` });
              }}
            >
              {TRUCK_STATUS[s].label}
            </Button>
          ))}
          <Button variant="ghost" size="sm" icon={Trash2} className="text-red-600 hover:bg-red-50" onClick={() => setConfirm(true)} disabled={!!current}>
            Supprimer
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <MiniStat label="Capacité" value={`${t.capacityT} t`} />
          <MiniStat label="Kilométrage" value={<span className="text-base">{formatNumber(t.mileageKm)} km</span>} />
          <MiniStat label="Année" value={t.year} />
          <MiniStat label="Missions terminées" value={done} />
        </div>

        {current && (
          <DetailSection title="Mission en cours">
            <MissionRow mission={current} />
          </DetailSection>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <DetailSection title="Propriétaire">
            <EntityLink onClick={() => company && open({ kind: "company", id: company.id })} leading={<CompanyLogo company={company} />} label={company?.name ?? "—"} sub={company?.phone} />
          </DetailSection>
          <DetailSection title="Chauffeur affecté">
            {driver ? (
              <EntityLink onClick={() => open({ kind: "driver", id: driver.id })} leading={<DriverAvatar driver={driver} />} label={driverName(driver)} sub={driver.phone} />
            ) : (
              <p className="text-sm text-slate-500">Aucun chauffeur affecté.</p>
            )}
          </DetailSection>
        </div>

        <DetailSection title="Entretien et conformité">
          <div className="divide-y divide-slate-100">
            <InfoRow icon={Wrench} label="Dernière révision" value={formatDate(t.lastService)} />
            <InfoRow icon={ShieldCheck} label="Assurance valable jusqu'au" value={formatDate(t.insuranceUntil)} />
            <InfoRow icon={Gauge} label="Prochaine révision" value={`dans ${formatNumber(15000 - (t.mileageKm % 15000))} km`} />
          </div>
        </DetailSection>

        <DetailSection title={`Historique des missions (${missions.length})`}>
          <div className="space-y-2">
            {missions.slice(0, 6).map((m) => (
              <MissionRow key={m.id} mission={m} />
            ))}
            {missions.length === 0 && <p className="text-sm text-slate-500">Aucune mission pour ce véhicule.</p>}
          </div>
        </DetailSection>
      </div>
      <TruckFormModal open={edit} onClose={() => setEdit(false)} truck={t} />
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Supprimer ce camion ?"
        message={`Le véhicule ${t.plate} sera retiré de la flotte. Cette action est irréversible dans le prototype.`}
        confirmLabel="Supprimer"
        onConfirm={() => {
          actions.deleteTruck(t.id);
          toast("Camion supprimé", { message: t.plate, tone: "info" });
          close();
        }}
      />
    </div>
  );
}

// ── Chauffeur ────────────────────────────────────────────────
export function DriverDetail({ id }: { id: string }) {
  const { all, lookups } = useData();
  const { open, close } = useDetail();
  const { toast } = useToast();
  const [edit, setEdit] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const d = lookups.driver(id);
  if (!d) return <NotFound />;
  const company = lookups.company(d.companyId);
  const truck = lookups.truck(d.truckId);
  const missions = all.missions.filter((m) => m.driverId === id).sort((a, b) => b.plannedDeparture.localeCompare(a.plannedDeparture));
  const current = missions.find(isActiveMission);
  const incidents = all.incidents.filter((i) => i.driverId === id);

  return (
    <div>
      <div className="relative h-32 overflow-hidden bg-navy-900">
        <SafeImage src="/images/truck-cab.jpg" alt="" className="absolute inset-0 opacity-30" sizes="700px" fallback="image" />
      </div>
      <div className="-mt-10 space-y-4 px-5 pb-8 sm:px-6">
        <div className="relative flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-end gap-4">
            <DriverAvatar driver={d} size="xl" ring />
            <div className="pb-1">
              <StatusBadge map={DRIVER_AVAILABILITY} value={d.availability} />
              <h2 className="mt-1 text-xl font-semibold">{driverName(d)}</h2>
              <p className="flex items-center gap-1 text-sm text-slate-500">
                <Star className="size-3.5 fill-amber-400 text-amber-400" /> {d.rating.toFixed(1)} · {d.experienceYears} ans d&apos;expérience
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" icon={Pencil} onClick={() => setEdit(true)}>
              Modifier
            </Button>
            <Button variant="secondary" size="sm" icon={Trash2} className="text-red-600" onClick={() => setConfirm(true)} disabled={!!current}>
              Supprimer
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <MiniStat label="Missions" value={missions.length} />
          <MiniStat label="Terminées" value={missions.filter((m) => m.step >= 6).length} tone="text-success-600" />
          <MiniStat label="Incidents" value={incidents.length} tone={incidents.length ? "text-amber-600" : undefined} />
        </div>

        {current && (
          <DetailSection title="Mission en cours">
            <MissionRow mission={current} />
          </DetailSection>
        )}

        <DetailSection title="Permis et contact">
          <div className="divide-y divide-slate-100">
            <InfoRow icon={Phone} label="Téléphone" value={d.phone} />
            <InfoRow icon={IdCard} label="N° de permis" value={<span className="font-mono text-xs">{d.licenseNumber}</span>} />
            <InfoRow icon={BadgeCheck} label="Catégorie" value={<Badge tone="blue" dot={false}>{d.licenseCategory}</Badge>} />
            <InfoRow icon={CalendarClock} label="Expiration du permis" value={formatDate(d.licenseExpiry)} />
            <InfoRow icon={CalendarClock} label="Entré(e) dans l'entreprise" value={formatDate(d.joinedAt)} />
          </div>
        </DetailSection>

        <div className="grid gap-4 sm:grid-cols-2">
          <DetailSection title="Entreprise">
            <EntityLink onClick={() => company && open({ kind: "company", id: company.id })} leading={<CompanyLogo company={company} />} label={company?.name ?? "—"} />
          </DetailSection>
          <DetailSection title="Camion affecté">
            {truck ? (
              <EntityLink onClick={() => open({ kind: "truck", id: truck.id })} leading={<SafeImage src={truck.image} alt={truck.plate} className="h-10 w-14 shrink-0 rounded-lg" sizes="56px" />} label={<span className="font-mono">{truck.plate}</span>} sub={`${truck.brand} ${truck.model}`} />
            ) : (
              <p className="text-sm text-slate-500">Aucun camion affecté.</p>
            )}
          </DetailSection>
        </div>

        <DetailSection title="Historique des missions">
          <div className="space-y-2">
            {missions.slice(0, 6).map((m) => (
              <MissionRow key={m.id} mission={m} />
            ))}
            {missions.length === 0 && <p className="text-sm text-slate-500">Aucune mission.</p>}
          </div>
        </DetailSection>
      </div>
      <DriverFormModal open={edit} onClose={() => setEdit(false)} driver={d} />
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Supprimer ce chauffeur ?"
        message={`${driverName(d)} sera retiré de l'effectif et désaffecté de son camion.`}
        confirmLabel="Supprimer"
        onConfirm={() => {
          actions.deleteDriver(d.id);
          toast("Chauffeur supprimé", { message: driverName(d), tone: "info" });
          close();
        }}
      />
    </div>
  );
}

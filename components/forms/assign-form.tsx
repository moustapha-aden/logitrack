"use client";

import { useState } from "react";
import { CheckCircle2, UserCheck } from "lucide-react";
import { actions } from "@/lib/store";
import { useData } from "@/lib/store/selectors";
import { DRIVER_AVAILABILITY, TRUCK_STATUS, TRUCK_TYPES } from "@/lib/constants";
import { placeName } from "@/lib/data/geo";
import { cn, driverName } from "@/lib/utils";
import type { Mission } from "@/types";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DriverAvatar, SafeImage } from "@/components/ui/media";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

function Inner({ onClose, mission }: { onClose: () => void; mission: Mission }) {
  const { toast } = useToast();
  const { all } = useData();
  const [truckId, setTruckId] = useState(mission.truckId ?? "");
  const [driverId, setDriverId] = useState(mission.driverId ?? "");
  const trucks = all.trucks.filter((t) => t.companyId === mission.companyId);
  const drivers = all.drivers.filter((d) => d.companyId === mission.companyId);
  const busyByOther = (truck: string) => all.missions.some((m) => m.id !== mission.id && m.truckId === truck && m.step >= 2 && m.step <= 5);

  const confirm = () => {
    actions.assignMission(mission.id, truckId || null, driverId || null);
    toast("Affectation enregistrée", { message: `${mission.ref} · ${all.trucks.find((t) => t.id === truckId)?.plate ?? "sans camion"} / ${driverName(all.drivers.find((d) => d.id === driverId))}` });
    onClose();
  };

  return (
    <Modal
      open
      size="lg"
      onClose={onClose}
      title={`Affecter la mission ${mission.ref}`}
      description={`${placeName(mission.origin)} → ${placeName(mission.destination)} · sélectionnez un camion et un chauffeur de l'entreprise.`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button icon={UserCheck} onClick={confirm}>
            Confirmer l&apos;affectation
          </Button>
        </>
      }
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold tracking-wider text-slate-400 uppercase">Camion</p>
          <div className="space-y-2">
            {trucks.map((t) => {
              const unavailable = t.status === "maintenance" || t.status === "immobilise" || busyByOther(t.id);
              const selected = truckId === t.id;
              return (
                <button
                  key={t.id}
                  disabled={unavailable}
                  onClick={() => {
                    setTruckId(selected ? "" : t.id);
                    if (!selected && t.driverId && !driverId) setDriverId(t.driverId);
                  }}
                  className={cn("flex w-full items-center gap-3 rounded-xl border p-2 text-left transition disabled:cursor-not-allowed disabled:opacity-50", selected ? "border-brand-600 bg-brand-50 ring-2 ring-brand-600/20" : "border-slate-200 hover:border-slate-300")}
                >
                  <SafeImage src={t.image} alt={t.plate} className="h-12 w-16 shrink-0 rounded-lg" sizes="64px" />
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-sm font-semibold">{t.plate}</p>
                    <p className="truncate text-xs text-slate-500">
                      {TRUCK_TYPES[t.type]} · {t.capacityT} t
                    </p>
                  </div>
                  {selected ? <CheckCircle2 className="size-5 text-brand-600" /> : <StatusBadge map={TRUCK_STATUS} value={t.status} />}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold tracking-wider text-slate-400 uppercase">Chauffeur</p>
          <div className="space-y-2">
            {drivers.map((d) => {
              const selected = driverId === d.id;
              const unavailable = d.availability === "conge";
              return (
                <button
                  key={d.id}
                  disabled={unavailable}
                  onClick={() => setDriverId(selected ? "" : d.id)}
                  className={cn("flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition disabled:cursor-not-allowed disabled:opacity-50", selected ? "border-brand-600 bg-brand-50 ring-2 ring-brand-600/20" : "border-slate-200 hover:border-slate-300")}
                >
                  <DriverAvatar driver={d} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{driverName(d)}</p>
                    <p className="text-xs text-slate-500">
                      Permis {d.licenseCategory} · {d.experienceYears} ans d&apos;exp.
                    </p>
                  </div>
                  {selected ? <CheckCircle2 className="size-5 text-brand-600" /> : <StatusBadge map={DRIVER_AVAILABILITY} value={d.availability} />}
                </button>
              );
            })}
            {drivers.length === 0 && <Badge>Aucun chauffeur pour cette entreprise</Badge>}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export function AssignModal({ open, onClose, mission }: { open: boolean; onClose: () => void; mission?: Mission }) {
  return open && mission ? <Inner onClose={onClose} mission={mission} /> : null;
}

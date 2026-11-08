"use client";

import { Save } from "lucide-react";
import { actions } from "@/lib/store";
import { useData } from "@/lib/store/selectors";
import { TRUCK_STATUS, TRUCK_TYPES } from "@/lib/constants";
import { driverName } from "@/lib/utils";
import type { Truck, TruckStatus, TruckType } from "@/types";
import { Button } from "@/components/ui/button";
import { Field, FormGrid, FormSection, Input, Select } from "@/components/ui/form";
import { SafeImage } from "@/components/ui/media";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { positive, required, useForm } from "./use-form";

export const TRUCK_IMAGES: Record<TruckType, string[]> = {
  semi_remorque: ["/images/truck-howo-semi-bachee.jpg", "/images/truck-semi-bachee-corridor.jpg", "/images/truck-semi-3.jpg", "/images/truck-semi-benne-corridor.jpg", "/images/truck-axor-conteneur.jpg", "/images/truck-faw-conteneur.jpg"],
  porte_conteneur: ["/images/truck-container-1.jpg", "/images/truck-conteneur-plateau-corridor.jpg"],
  citerne: ["/images/truck-howo-citerne.jpg", "/images/truck-iveco-citerne.jpg"],
  frigorifique: ["/images/truck-reefer-1.jpg", "/images/truck-reefer-2.jpg"],
  plateau: ["/images/truck-flatbed-1.jpg", "/images/truck-flatbed-2.jpg"],
};

type Values = Omit<Truck, "id" | "lastService" | "insuranceUntil">;

function Inner({ onClose, truck }: { onClose: () => void; truck?: Truck }) {
  const { toast } = useToast();
  const { scope, all } = useData();
  const owners = all.companies.filter((c) => c.type !== "client");
  const { values, errors, set, submit } = useForm<Values>(
    truck ?? {
      plate: "DJ-",
      brand: "",
      model: "",
      type: "semi_remorque",
      capacityT: 30,
      year: 2024,
      companyId: scope ?? owners[0]?.id ?? "",
      driverId: null,
      status: "disponible",
      image: TRUCK_IMAGES.semi_remorque[0],
      mileageKm: 0,
    },
    (v) => ({
      plate: required(v.plate.trim()) ?? (all.trucks.some((t) => t.plate.toUpperCase() === v.plate.trim().toUpperCase() && t.id !== truck?.id) ? "Immatriculation déjà enregistrée" : undefined),
      brand: required(v.brand.trim()),
      model: required(v.model.trim()),
      capacityT: positive(v.capacityT),
      companyId: required(v.companyId),
    }),
  );

  const drivers = all.drivers.filter((d) => d.companyId === values.companyId);

  const save = submit((v) => {
    const now = new Date();
    actions.saveTruck({
      ...v,
      plate: v.plate.trim().toUpperCase(),
      id: truck?.id ?? actions.newTruckId(),
      lastService: truck?.lastService ?? now.toISOString(),
      insuranceUntil: truck?.insuranceUntil ?? new Date(now.getTime() + 365 * 86400000).toISOString(),
    });
    toast(truck ? "Camion mis à jour" : "Camion ajouté à la flotte", { message: v.plate.toUpperCase() });
    onClose();
  });

  return (
    <Modal
      open
      size="lg"
      onClose={onClose}
      title={truck ? `Modifier ${truck.plate}` : "Ajouter un camion"}
      description="Caractéristiques du véhicule, propriétaire et affectation."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button icon={Save} onClick={() => save()}>
            Enregistrer
          </Button>
        </>
      }
    >
      <form onSubmit={save} className="grid gap-6 md:grid-cols-[1fr_220px]">
        <div className="space-y-6">
          <FormSection title="Véhicule">
            <FormGrid>
              <Field label="Immatriculation" required error={errors.plate}>
                <Input value={values.plate} onChange={(e) => set("plate", e.target.value)} invalid={!!errors.plate} className="font-mono uppercase" />
              </Field>
              <Field label="Type de camion" required>
                <Select
                  value={values.type}
                  onChange={(e) => {
                    const t = e.target.value as TruckType;
                    set("type", t);
                    set("image", TRUCK_IMAGES[t][0]);
                  }}
                >
                  {Object.entries(TRUCK_TYPES).map(([k, l]) => (
                    <option key={k} value={k}>
                      {l}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Marque" required error={errors.brand}>
                <Input value={values.brand} onChange={(e) => set("brand", e.target.value)} invalid={!!errors.brand} placeholder="Volvo, Mercedes-Benz…" />
              </Field>
              <Field label="Modèle" required error={errors.model}>
                <Input value={values.model} onChange={(e) => set("model", e.target.value)} invalid={!!errors.model} />
              </Field>
              <Field label="Capacité (tonnes)" required error={errors.capacityT}>
                <Input type="number" min={1} value={values.capacityT} onChange={(e) => set("capacityT", Number(e.target.value))} />
              </Field>
              <Field label="Année">
                <Input type="number" min={1990} max={2027} value={values.year} onChange={(e) => set("year", Number(e.target.value))} />
              </Field>
              <Field label="Kilométrage">
                <Input type="number" min={0} value={values.mileageKm} onChange={(e) => set("mileageKm", Number(e.target.value))} />
              </Field>
              <Field label="Statut du véhicule">
                <Select value={values.status} onChange={(e) => set("status", e.target.value as TruckStatus)} disabled={values.status === "en_mission"}>
                  {Object.entries(TRUCK_STATUS).map(([k, m]) => (
                    <option key={k} value={k} disabled={k === "en_mission"}>
                      {m.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </FormGrid>
          </FormSection>
          <FormSection title="Affectation">
            <FormGrid>
              <Field label="Entreprise propriétaire" required error={errors.companyId}>
                <Select
                  value={values.companyId}
                  disabled={!!scope}
                  onChange={(e) => {
                    set("companyId", e.target.value);
                    set("driverId", null);
                  }}
                >
                  {owners.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Chauffeur affecté">
                <Select value={values.driverId ?? ""} onChange={(e) => set("driverId", e.target.value || null)}>
                  <option value="">— Aucun —</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {driverName(d)}
                      {d.truckId && d.truckId !== truck?.id ? " (déjà affecté)" : ""}
                    </option>
                  ))}
                </Select>
              </Field>
            </FormGrid>
          </FormSection>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold tracking-wider text-slate-400 uppercase">Photo</p>
          <SafeImage src={values.image} alt="Aperçu du camion" className="aspect-[4/3] rounded-xl" sizes="220px" />
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {TRUCK_IMAGES[values.type].map((src) => (
              <button key={src} type="button" onClick={() => set("image", src)} className={`overflow-hidden rounded-lg ring-offset-1 ${values.image === src ? "ring-2 ring-brand-600" : "opacity-70 hover:opacity-100"}`}>
                <SafeImage src={src} alt="" className="aspect-square" sizes="70px" />
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-slate-400">Photos d&apos;illustration (Wikimedia Commons).</p>
        </div>
      </form>
    </Modal>
  );
}

export function TruckFormModal({ open, onClose, truck }: { open: boolean; onClose: () => void; truck?: Truck }) {
  return open ? <Inner onClose={onClose} truck={truck} /> : null;
}

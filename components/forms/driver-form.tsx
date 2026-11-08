"use client";

import { Save } from "lucide-react";
import { actions } from "@/lib/store";
import { useData } from "@/lib/store/selectors";
import { DRIVER_AVAILABILITY, LICENSE_CATEGORIES } from "@/lib/constants";
import { fromLocalInput, toLocalInput } from "@/lib/utils";
import type { Driver, DriverAvailability } from "@/types";
import { Button } from "@/components/ui/button";
import { Field, FormGrid, FormSection, Input, Select } from "@/components/ui/form";
import { DriverAvatar } from "@/components/ui/media";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { required, useForm } from "./use-form";

const COLORS = ["#2563EB", "#0F9F83", "#7C3AED", "#EA580C", "#0E7490", "#B45309", "#DB2777", "#101E35"];

type Values = Omit<Driver, "id" | "joinedAt" | "rating"> & { expiryDate: string };

function Inner({ onClose, driver }: { onClose: () => void; driver?: Driver }) {
  const { toast } = useToast();
  const { scope, all } = useData();
  const owners = all.companies.filter((c) => c.type !== "client");
  const defaultExpiry = "2029-12-31T12:00:00+03:00";
  const { values, errors, set, submit } = useForm<Values>(
    driver
      ? { ...driver, expiryDate: toLocalInput(driver.licenseExpiry).slice(0, 10) }
      : {
          firstName: "",
          lastName: "",
          phone: "+253 77 ",
          licenseNumber: "PC-DJ-",
          licenseCategory: "CE",
          licenseExpiry: defaultExpiry,
          expiryDate: toLocalInput(defaultExpiry).slice(0, 10),
          companyId: scope ?? owners[0]?.id ?? "",
          truckId: null,
          availability: "disponible",
          experienceYears: 1,
          avatarColor: COLORS[0],
        },
    (v) => ({ firstName: required(v.firstName.trim()), lastName: required(v.lastName.trim()), phone: required(v.phone.trim()), licenseNumber: required(v.licenseNumber.trim()), expiryDate: required(v.expiryDate), companyId: required(v.companyId) }),
  );

  const trucks = all.trucks.filter((t) => t.companyId === values.companyId);

  const save = submit((v) => {
    const { expiryDate, ...rest } = v;
    actions.saveDriver({
      ...rest,
      licenseExpiry: fromLocalInput(`${expiryDate}T12:00`),
      id: driver?.id ?? actions.newDriverId(),
      rating: driver?.rating ?? 4.5,
      joinedAt: driver?.joinedAt ?? new Date().toISOString(),
    });
    toast(driver ? "Chauffeur mis à jour" : "Chauffeur ajouté", { message: `${v.firstName} ${v.lastName}` });
    onClose();
  });

  return (
    <Modal
      open
      size="lg"
      onClose={onClose}
      title={driver ? "Modifier le chauffeur" : "Nouveau chauffeur"}
      description="Identité, permis de conduire et affectation."
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
      <form onSubmit={save} className="space-y-6">
        <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-3">
          <DriverAvatar driver={{ firstName: values.firstName || "?", lastName: values.lastName || "", avatarColor: values.avatarColor }} size="md" />
          <div>
            <p className="text-xs font-medium text-slate-600">Couleur de l&apos;avatar</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => set("avatarColor", c)} className={`size-6 rounded-full ring-offset-2 ${values.avatarColor === c ? "ring-2 ring-brand-600" : ""}`} style={{ backgroundColor: c }} aria-label={`Couleur ${c}`} />
              ))}
            </div>
          </div>
        </div>
        <FormSection title="Identité">
          <FormGrid>
            <Field label="Prénom" required error={errors.firstName}>
              <Input value={values.firstName} onChange={(e) => set("firstName", e.target.value)} invalid={!!errors.firstName} />
            </Field>
            <Field label="Nom" required error={errors.lastName}>
              <Input value={values.lastName} onChange={(e) => set("lastName", e.target.value)} invalid={!!errors.lastName} />
            </Field>
            <Field label="Téléphone" required error={errors.phone}>
              <Input value={values.phone} onChange={(e) => set("phone", e.target.value)} invalid={!!errors.phone} />
            </Field>
            <Field label="Années d'expérience">
              <Input type="number" min={0} value={values.experienceYears} onChange={(e) => set("experienceYears", Number(e.target.value))} />
            </Field>
          </FormGrid>
        </FormSection>
        <FormSection title="Permis de conduire">
          <FormGrid>
            <Field label="Numéro de permis" required error={errors.licenseNumber}>
              <Input value={values.licenseNumber} onChange={(e) => set("licenseNumber", e.target.value)} invalid={!!errors.licenseNumber} className="font-mono" />
            </Field>
            <Field label="Catégorie">
              <Select value={values.licenseCategory} onChange={(e) => set("licenseCategory", e.target.value)}>
                {LICENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    Catégorie {c}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Date d'expiration" required error={errors.expiryDate}>
              <Input type="date" value={values.expiryDate} onChange={(e) => set("expiryDate", e.target.value)} />
            </Field>
          </FormGrid>
        </FormSection>
        <FormSection title="Affectation">
          <FormGrid>
            <Field label="Entreprise" required>
              <Select
                value={values.companyId}
                disabled={!!scope}
                onChange={(e) => {
                  set("companyId", e.target.value);
                  set("truckId", null);
                }}
              >
                {owners.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Camion affecté">
              <Select value={values.truckId ?? ""} onChange={(e) => set("truckId", e.target.value || null)}>
                <option value="">— Aucun —</option>
                {trucks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.plate} · {t.brand} {t.model}
                    {t.driverId && t.driverId !== driver?.id ? " (occupé)" : ""}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Disponibilité">
              <Select value={values.availability} onChange={(e) => set("availability", e.target.value as DriverAvailability)} disabled={values.availability === "en_mission"}>
                {Object.entries(DRIVER_AVAILABILITY).map(([k, m]) => (
                  <option key={k} value={k} disabled={k === "en_mission"}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </Field>
          </FormGrid>
        </FormSection>
      </form>
    </Modal>
  );
}

export function DriverFormModal({ open, onClose, driver }: { open: boolean; onClose: () => void; driver?: Driver }) {
  return open ? <Inner onClose={onClose} driver={driver} /> : null;
}

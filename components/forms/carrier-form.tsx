"use client";

import { Save } from "lucide-react";
import { actions } from "@/lib/store";
import { useData } from "@/lib/store/selectors";
import type { Carrier, CarrierStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Field, FormGrid, Input, Select } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { emailRule, positive, required, useForm } from "./use-form";

type Values = Omit<Carrier, "id">;

function Inner({ onClose, carrier }: { onClose: () => void; carrier?: Carrier }) {
  const { toast } = useToast();
  const { scope, all } = useData();
  const owners = all.companies.filter((c) => c.type !== "client");
  const { values, errors, set, submit } = useForm<Values>(
    carrier ?? { name: "", manager: "", phone: "+253 77 ", email: "", companyId: scope ?? owners[0]?.id ?? "", status: "actif", fleetSize: 1, city: "Djibouti" },
    (v) => ({ name: required(v.name.trim()), manager: required(v.manager.trim()), phone: required(v.phone.trim()), email: required(v.email) ?? emailRule(v.email), companyId: required(v.companyId), fleetSize: positive(v.fleetSize) }),
  );

  const save = submit((v) => {
    actions.saveCarrier({ ...v, id: carrier?.id ?? actions.newCarrierId() });
    toast(carrier ? "Transporteur mis à jour" : "Transporteur ajouté", { message: v.name });
    onClose();
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={carrier ? "Modifier le transporteur" : "Nouveau transporteur"}
      description="Transporteur partenaire autorisé à opérer pour une entreprise."
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
      <form onSubmit={save}>
        <FormGrid>
          <Field label="Nom ou raison sociale" required error={errors.name} className="sm:col-span-2">
            <Input value={values.name} onChange={(e) => set("name", e.target.value)} invalid={!!errors.name} />
          </Field>
          <Field label="Responsable" required error={errors.manager}>
            <Input value={values.manager} onChange={(e) => set("manager", e.target.value)} invalid={!!errors.manager} />
          </Field>
          <Field label="Téléphone" required error={errors.phone}>
            <Input value={values.phone} onChange={(e) => set("phone", e.target.value)} invalid={!!errors.phone} />
          </Field>
          <Field label="E-mail" required error={errors.email}>
            <Input type="email" value={values.email} onChange={(e) => set("email", e.target.value)} invalid={!!errors.email} />
          </Field>
          <Field label="Ville">
            <Input value={values.city} onChange={(e) => set("city", e.target.value)} />
          </Field>
          <Field label="Entreprise donneuse d'ordre" required error={errors.companyId}>
            <Select value={values.companyId} onChange={(e) => set("companyId", e.target.value)} disabled={!!scope}>
              {owners.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Taille de flotte" error={errors.fleetSize}>
            <Input type="number" min={1} value={values.fleetSize} onChange={(e) => set("fleetSize", Number(e.target.value))} />
          </Field>
          <Field label="Statut">
            <Select value={values.status} onChange={(e) => set("status", e.target.value as CarrierStatus)}>
              <option value="actif">Actif</option>
              <option value="inactif">Inactif</option>
              <option value="suspendu">Suspendu</option>
            </Select>
          </Field>
        </FormGrid>
      </form>
    </Modal>
  );
}

export function CarrierFormModal({ open, onClose, carrier }: { open: boolean; onClose: () => void; carrier?: Carrier }) {
  return open ? <Inner onClose={onClose} carrier={carrier} /> : null;
}

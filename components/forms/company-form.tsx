"use client";

import { Save } from "lucide-react";
import { actions } from "@/lib/store";
import { COMPANY_TYPES } from "@/lib/constants";
import { initials } from "@/lib/utils";
import type { Company, CompanyType } from "@/types";
import { Button } from "@/components/ui/button";
import { Field, FormGrid, Input, Select } from "@/components/ui/form";
import { CompanyLogo } from "@/components/ui/media";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { emailRule, required, useForm } from "./use-form";

const COLORS = ["#2563EB", "#0F9F83", "#F59E0B", "#7C3AED", "#101E35", "#DC2626", "#0E7490", "#B45309"];

type Values = Omit<Company, "id" | "createdAt" | "initials">;

function Inner({ onClose, company }: { onClose: () => void; company?: Company }) {
  const { toast } = useToast();
  const { values, errors, set, submit } = useForm<Values>(
    company ?? { name: "", color: COLORS[0], type: "transport", manager: "", phone: "+253 77 ", email: "", address: "", city: "Djibouti", nif: "", status: "actif" },
    (v) => ({ name: required(v.name.trim()), manager: required(v.manager.trim()), phone: required(v.phone.trim()), email: required(v.email) ?? emailRule(v.email), address: required(v.address.trim()) }),
  );

  const save = submit((v) => {
    const id = company?.id ?? actions.newCompanyId();
    actions.saveCompany({ ...v, id, initials: initials(v.name), createdAt: company?.createdAt ?? new Date().toISOString() });
    toast(company ? "Entreprise mise à jour" : "Entreprise ajoutée", { message: v.name });
    onClose();
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={company ? "Modifier l'entreprise" : "Nouvelle entreprise"}
      description="Informations administratives et coordonnées de contact."
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
      <form onSubmit={save} className="space-y-5">
        <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-3">
          <CompanyLogo company={{ name: values.name, color: values.color, initials: initials(values.name || "?") }} size="md" />
          <div className="flex-1">
            <p className="text-xs font-medium text-slate-600">Couleur du logo</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => set("color", c)} className={`size-6 rounded-full ring-offset-2 transition ${values.color === c ? "ring-2 ring-brand-600" : ""}`} style={{ backgroundColor: c }} aria-label={`Couleur ${c}`} />
              ))}
            </div>
          </div>
        </div>
        <FormGrid>
          <Field label="Raison sociale" required error={errors.name} className="sm:col-span-2">
            <Input value={values.name} onChange={(e) => set("name", e.target.value)} invalid={!!errors.name} placeholder="Ex. Horn Freight Logistics" />
          </Field>
          <Field label="Type d'entreprise" required>
            <Select value={values.type} onChange={(e) => set("type", e.target.value as CompanyType)}>
              {Object.entries(COMPANY_TYPES).map(([k, m]) => (
                <option key={k} value={k}>
                  {m.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="NIF" hint="Numéro d'identification fiscale">
            <Input value={values.nif} onChange={(e) => set("nif", e.target.value)} placeholder="DJ-NIF-000000" />
          </Field>
          <Field label="Responsable" required error={errors.manager}>
            <Input value={values.manager} onChange={(e) => set("manager", e.target.value)} invalid={!!errors.manager} />
          </Field>
          <Field label="Téléphone" required error={errors.phone}>
            <Input value={values.phone} onChange={(e) => set("phone", e.target.value)} invalid={!!errors.phone} />
          </Field>
          <Field label="E-mail" required error={errors.email} className="sm:col-span-2">
            <Input type="email" value={values.email} onChange={(e) => set("email", e.target.value)} invalid={!!errors.email} placeholder="contact@entreprise.dj" />
          </Field>
          <Field label="Adresse" required error={errors.address}>
            <Input value={values.address} onChange={(e) => set("address", e.target.value)} invalid={!!errors.address} />
          </Field>
          <Field label="Ville">
            <Input value={values.city} onChange={(e) => set("city", e.target.value)} />
          </Field>
          <Field label="Statut">
            <Select value={values.status} onChange={(e) => set("status", e.target.value as Company["status"])}>
              <option value="actif">Actif</option>
              <option value="inactif">Inactif</option>
            </Select>
          </Field>
        </FormGrid>
      </form>
    </Modal>
  );
}

export function CompanyFormModal({ open, onClose, company }: { open: boolean; onClose: () => void; company?: Company }) {
  return open ? <Inner onClose={onClose} company={company} /> : null;
}

"use client";

import { useState } from "react";
import { Bell, Database, Globe, RotateCcw, Save, ShieldCheck, SlidersHorizontal, User } from "lucide-react";
import { actions, useAppData } from "@/lib/store";
import type { Settings } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, FormGrid, Input, Select, Toggle } from "@/components/ui/form";
import { ConfirmDialog } from "@/components/ui/modal";
import { InfoRow, PageHeader } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";

function SettingsForm({ initial }: { initial: Settings }) {
  const data = useAppData();
  const { toast } = useToast();
  const [s, setS] = useState<Settings>(initial);
  const [reset, setReset] = useState(false);
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((p) => ({ ...p, [k]: v }));
  const dirty = JSON.stringify(s) !== JSON.stringify(initial);

  return (
    <div>
      <PageHeader
        eyebrow="Configuration"
        title="Paramètres"
        description="Profil, préférences de notification et configuration de la plateforme."
        actions={
          <Button
            icon={Save}
            disabled={!dirty}
            onClick={() => {
              actions.saveSettings(s);
              toast("Paramètres enregistrés");
            }}
          >
            Enregistrer les modifications
          </Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Profil administrateur" subtitle="Informations affichées dans l'en-tête et les journaux d'activité" icon={User} />
            <div className="px-5 pb-5">
              <FormGrid>
                <Field label="Nom complet">
                  <Input value={s.userName} onChange={(e) => set("userName", e.target.value)} />
                </Field>
                <Field label="E-mail">
                  <Input type="email" value={s.userEmail} onChange={(e) => set("userEmail", e.target.value)} />
                </Field>
                <Field label="Téléphone">
                  <Input value={s.userPhone} onChange={(e) => set("userPhone", e.target.value)} />
                </Field>
                <Field label="Organisation">
                  <Input value={s.organisation} onChange={(e) => set("organisation", e.target.value)} />
                </Field>
              </FormGrid>
            </div>
          </Card>
          <Card>
            <CardHeader title="Notifications et alertes" subtitle="Canaux et événements déclenchant une alerte" icon={Bell} />
            <div className="divide-y divide-slate-100 px-5 pb-3">
              <Toggle checked={s.emailAlerts} onChange={(v) => set("emailAlerts", v)} label="Alertes par e-mail" description="Recevoir un e-mail pour chaque événement important" />
              <Toggle checked={s.smsAlerts} onChange={(v) => set("smsAlerts", v)} label="Alertes SMS" description="Recommandé pour les incidents critiques (simulation)" />
              <Toggle checked={s.incidentAlerts} onChange={(v) => set("incidentAlerts", v)} label="Incidents déclarés" description="Pannes, accidents et problèmes de chargement" />
              <Toggle checked={s.delayAlerts} onChange={(v) => set("delayAlerts", v)} label="Retards" description="Missions dépassant le seuil de tolérance" />
              <Toggle checked={s.weeklyReport} onChange={(v) => set("weeklyReport", v)} label="Rapport hebdomadaire" description="Synthèse envoyée chaque lundi à 7 h" />
              <div className="py-3">
                <Field label="Seuil de retard (minutes)" hint="Au-delà, une mission est signalée en retard">
                  <Select value={s.delayThresholdMin} onChange={(e) => set("delayThresholdMin", Number(e.target.value))}>
                    {[15, 30, 45, 60, 90, 120].map((n) => (
                      <option key={n} value={n}>
                        {n} minutes
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            </div>
          </Card>
          <Card>
            <CardHeader title="Affichage" icon={SlidersHorizontal} />
            <div className="px-5 pb-3">
              <Toggle checked={s.compactTables} onChange={(v) => set("compactTables", v)} label="Tableaux compacts" description="Réduit la hauteur des lignes pour afficher plus d'éléments" />
            </div>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader title="Plateforme" icon={Globe} />
            <div className="divide-y divide-slate-100 px-5 pb-4">
              <InfoRow label="Langue" value="Français" />
              <InfoRow label="Fuseau horaire" value="Africa/Djibouti (UTC+3)" />
              <InfoRow label="Devise" value="Franc djiboutien (DJF)" />
              <InfoRow label="Unités" value="km · tonnes · m³" />
              <InfoRow label="Version" value="Prototype 0.1" />
            </div>
          </Card>
          <Card>
            <CardHeader title="Sécurité" icon={ShieldCheck} />
            <p className="px-5 pb-5 text-sm text-slate-500">L&apos;authentification, les rôles et les permissions seront mis en place lors de la phase de développement. Ce prototype ne collecte aucune donnée réelle.</p>
          </Card>
          <Card>
            <CardHeader title="Données de démonstration" icon={Database} />
            <div className="space-y-3 px-5 pb-5">
              <p className="text-sm text-slate-500">
                Les modifications sont conservées dans votre navigateur. {data.missions.length} missions, {data.trucks.length} camions et {data.incidents.length} incidents actuellement enregistrés.
              </p>
              <Button variant="secondary" icon={RotateCcw} className="w-full" onClick={() => setReset(true)}>
                Réinitialiser la démonstration
              </Button>
            </div>
          </Card>
        </div>
      </div>
      <ConfirmDialog
        open={reset}
        onClose={() => setReset(false)}
        title="Réinitialiser les données ?"
        message="Toutes vos modifications (missions, camions, incidents…) seront remplacées par le jeu de données initial."
        confirmLabel="Réinitialiser"
        onConfirm={() => {
          actions.reset();
          toast("Démonstration réinitialisée", { message: "Les données initiales ont été restaurées." });
        }}
      />
    </div>
  );
}

export function SettingsView() {
  const data = useAppData();
  // la clé force la réinitialisation du formulaire si les paramètres changent ailleurs (ex. reset)
  return <SettingsForm key={JSON.stringify(data.settings)} initial={data.settings} />;
}

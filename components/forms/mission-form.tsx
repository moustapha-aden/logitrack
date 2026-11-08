"use client";

import { Route, Save } from "lucide-react";
import { actions, actorOf, useAppData } from "@/lib/store";
import { useData } from "@/lib/store/selectors";
import { GOODS_TYPES, TRUCK_STATUS, DRIVER_AVAILABILITY } from "@/lib/constants";
import { PLACES, routeDistanceKm } from "@/lib/data/geo";
import { tripHours } from "@/lib/data/seed";
import { driverName, formatDjf, fromLocalInput, toLocalInput } from "@/lib/utils";
import type { GoodsType, Mission } from "@/types";
import { Button } from "@/components/ui/button";
import { Field, FormGrid, FormSection, Input, Select, Textarea } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { positive, required, useForm } from "./use-form";

interface Values {
  companyId: string;
  clientId: string;
  carrierId: string;
  truckId: string;
  driverId: string;
  origin: string;
  destination: string;
  goodsType: GoodsType;
  description: string;
  departure: string;
  arrival: string;
  priceDjf: number;
  weightT: number;
  volumeM3: number;
  packages: number;
  declaredValueDjf: number;
  containerNo: string;
  hazardous: boolean;
}

function Inner({ onClose, mission }: { onClose: () => void; mission?: Mission }) {
  const { toast } = useToast();
  const raw = useAppData();
  const { scope, all, lookups } = useData();
  const owners = all.companies.filter((c) => c.type !== "client" && c.status === "actif");
  const clients = all.companies.filter((c) => c.type === "client");
  const existingLoad = mission ? lookups.loadOfMission(mission.id) : undefined;
  const defaultDeparture = "2026-11-10T07:00";

  const { values, errors, set, submit } = useForm<Values>(
    {
      companyId: mission?.companyId ?? scope ?? owners[0]?.id ?? "",
      clientId: mission?.clientId ?? clients[0]?.id ?? "",
      carrierId: mission?.carrierId ?? "",
      truckId: mission?.truckId ?? "",
      driverId: mission?.driverId ?? "",
      origin: mission?.origin ?? "port-djibouti",
      destination: mission?.destination ?? "ali-sabieh",
      goodsType: mission?.goodsType ?? "conteneurs",
      description: mission?.description ?? "",
      departure: mission ? toLocalInput(mission.plannedDeparture) : defaultDeparture,
      arrival: mission ? toLocalInput(mission.plannedArrival) : toLocalInput(new Date(new Date(fromLocalInput(defaultDeparture)).getTime() + 4.5 * 3600000).toISOString()),
      priceDjf: mission?.priceDjf ?? 450000,
      weightT: existingLoad?.weightT ?? 20,
      volumeM3: existingLoad?.volumeM3 ?? 30,
      packages: existingLoad?.packages ?? 1,
      declaredValueDjf: existingLoad?.declaredValueDjf ?? 5000000,
      containerNo: existingLoad?.containerNo ?? "",
      hazardous: existingLoad?.hazardous ?? false,
    },
    (v) => ({
      companyId: required(v.companyId),
      clientId: required(v.clientId),
      description: required(v.description.trim(), "Décrivez le chargement"),
      destination: v.origin === v.destination ? "La destination doit différer du départ" : undefined,
      departure: required(v.departure),
      arrival: required(v.arrival) ?? (v.arrival <= v.departure ? "L'arrivée doit suivre le départ" : undefined),
      priceDjf: positive(v.priceDjf),
      weightT: positive(v.weightT),
    }),
  );

  const trucks = all.trucks.filter((t) => t.companyId === values.companyId);
  const drivers = all.drivers.filter((d) => d.companyId === values.companyId);
  const carriers = all.carriers.filter((c) => c.companyId === values.companyId && c.status === "actif");
  const km = values.origin !== values.destination ? routeDistanceKm(values.origin, values.destination) : 0;

  const recomputeArrival = (departure: string, destination: string) => {
    if (!departure) return;
    const dep = new Date(fromLocalInput(departure)).getTime();
    set("arrival", toLocalInput(new Date(dep + (tripHours(destination) + 1) * 3600000).toISOString()));
  };

  const save = submit((v) => {
    const draft = mission ?? { ...actions.newMissionDraft(raw), step: 0 as const, delayed: false, history: [], createdAt: new Date().toISOString() };
    const createdHistory = mission ? mission.history : [{ step: 0 as const, at: new Date().toISOString(), by: actorOf(raw) }];
    actions.saveMission(
      {
        ...draft,
        history: createdHistory,
        companyId: v.companyId,
        clientId: v.clientId,
        carrierId: v.carrierId || null,
        truckId: v.truckId || null,
        driverId: v.driverId || null,
        origin: v.origin,
        destination: v.destination,
        goodsType: v.goodsType,
        description: v.description.trim(),
        plannedDeparture: fromLocalInput(v.departure),
        plannedArrival: fromLocalInput(v.arrival),
        priceDjf: v.priceDjf,
      },
      {
        nature: v.description.split(" — ")[0].trim(),
        weightT: v.weightT,
        volumeM3: v.volumeM3,
        packages: v.packages,
        declaredValueDjf: v.declaredValueDjf,
        containerNo: v.containerNo || undefined,
        hazardous: v.hazardous,
      },
    );
    toast(mission ? "Mission mise à jour" : "Mission créée", { message: `${draft.ref} · ${PLACES.find((p) => p.id === v.origin)?.short} → ${PLACES.find((p) => p.id === v.destination)?.short}` });
    onClose();
  });

  return (
    <Modal
      open
      size="xl"
      onClose={onClose}
      title={mission ? `Modifier la mission ${mission.ref}` : "Créer une mission"}
      description="Itinéraire, acteurs, chargement et planification."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button icon={Save} onClick={() => save()}>
            {mission ? "Enregistrer" : "Créer la mission"}
          </Button>
        </>
      }
    >
      <form onSubmit={save} className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <FormSection title="Acteurs">
            <FormGrid>
              <Field label="Entreprise" required error={errors.companyId}>
                <Select
                  value={values.companyId}
                  disabled={!!scope || !!mission}
                  onChange={(e) => {
                    set("companyId", e.target.value);
                    set("truckId", "");
                    set("driverId", "");
                    set("carrierId", "");
                  }}
                >
                  {all.companies
                    .filter((c) => c.type !== "client")
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </Select>
              </Field>
              <Field label="Client" required error={errors.clientId}>
                <Select value={values.clientId} onChange={(e) => set("clientId", e.target.value)}>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Camion">
                <Select
                  value={values.truckId}
                  onChange={(e) => {
                    const t = trucks.find((x) => x.id === e.target.value);
                    set("truckId", e.target.value);
                    if (t?.driverId && !values.driverId) set("driverId", t.driverId);
                  }}
                >
                  <option value="">— À affecter —</option>
                  {trucks.map((t) => (
                    <option key={t.id} value={t.id} disabled={t.status === "maintenance" || t.status === "immobilise"}>
                      {t.plate} · {t.brand} {t.model} ({TRUCK_STATUS[t.status].label})
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Chauffeur">
                <Select value={values.driverId} onChange={(e) => set("driverId", e.target.value)}>
                  <option value="">— À affecter —</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id} disabled={d.availability === "conge"}>
                      {driverName(d)} ({DRIVER_AVAILABILITY[d.availability].label})
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Transporteur partenaire" className="sm:col-span-2">
                <Select value={values.carrierId} onChange={(e) => set("carrierId", e.target.value)}>
                  <option value="">— Flotte propre —</option>
                  {carriers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </FormGrid>
          </FormSection>
          <FormSection title="Itinéraire et planification">
            <FormGrid>
              <Field label="Point de départ" required>
                <Select value={values.origin} onChange={(e) => set("origin", e.target.value)}>
                  {PLACES.filter((p) => p.kind !== "international").map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Destination" required error={errors.destination}>
                <Select
                  value={values.destination}
                  onChange={(e) => {
                    set("destination", e.target.value);
                    recomputeArrival(values.departure, e.target.value);
                  }}
                >
                  {PLACES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Départ prévu" required error={errors.departure}>
                <Input
                  type="datetime-local"
                  value={values.departure}
                  onChange={(e) => {
                    set("departure", e.target.value);
                    recomputeArrival(e.target.value, values.destination);
                  }}
                />
              </Field>
              <Field label="Arrivée prévue" required error={errors.arrival}>
                <Input type="datetime-local" value={values.arrival} onChange={(e) => set("arrival", e.target.value)} invalid={!!errors.arrival} />
              </Field>
            </FormGrid>
            {km > 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-700">
                <Route className="size-4" />
                Distance indicative ≈ <strong>{km} km</strong> · durée estimée {tripHours(values.destination)} h
              </div>
            )}
          </FormSection>
        </div>
        <div className="space-y-6">
          <FormSection title="Marchandise">
            <FormGrid>
              <Field label="Type de marchandise" required>
                <Select value={values.goodsType} onChange={(e) => set("goodsType", e.target.value as GoodsType)}>
                  {Object.entries(GOODS_TYPES).map(([k, l]) => (
                    <option key={k} value={k}>
                      {l}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Tarif de la mission (DJF)" required error={errors.priceDjf} hint={values.priceDjf > 0 ? formatDjf(values.priceDjf) : undefined}>
                <Input type="number" min={0} step={10000} value={values.priceDjf} onChange={(e) => set("priceDjf", Number(e.target.value))} />
              </Field>
              <Field label="Description du chargement" required error={errors.description} className="sm:col-span-2">
                <Textarea value={values.description} onChange={(e) => set("description", e.target.value)} invalid={!!errors.description} placeholder="Ex. 1 × 40' riz en sacs de 50 kg" />
              </Field>
            </FormGrid>
          </FormSection>
          <FormSection title="Chargement">
            <FormGrid>
              <Field label="Poids (t)" required error={errors.weightT}>
                <Input type="number" min={0} step={0.1} value={values.weightT} onChange={(e) => set("weightT", Number(e.target.value))} />
              </Field>
              <Field label="Volume (m³)">
                <Input type="number" min={0} value={values.volumeM3} onChange={(e) => set("volumeM3", Number(e.target.value))} />
              </Field>
              <Field label="Nombre de colis">
                <Input type="number" min={1} value={values.packages} onChange={(e) => set("packages", Number(e.target.value))} />
              </Field>
              <Field label="Valeur déclarée (DJF)">
                <Input type="number" min={0} step={100000} value={values.declaredValueDjf} onChange={(e) => set("declaredValueDjf", Number(e.target.value))} />
              </Field>
              <Field label="N° de conteneur" hint="Facultatif">
                <Input value={values.containerNo} onChange={(e) => set("containerNo", e.target.value)} className="font-mono" placeholder="MSKU 1234567" />
              </Field>
              <label className="flex items-center gap-2.5 self-end pb-2.5 text-sm text-slate-700">
                <input type="checkbox" checked={values.hazardous} onChange={(e) => set("hazardous", e.target.checked)} className="size-4 rounded border-slate-300 accent-red-500" />
                Marchandise dangereuse (ADR)
              </label>
            </FormGrid>
          </FormSection>
        </div>
      </form>
    </Modal>
  );
}

export function MissionFormModal({ open, onClose, mission }: { open: boolean; onClose: () => void; mission?: Mission }) {
  return open ? <Inner onClose={onClose} mission={mission} /> : null;
}

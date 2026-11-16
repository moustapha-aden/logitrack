"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileCheck2,
  IdCard,
  MapPin,
  PhoneCall,
  Route,
  Search,
  Send,
  ShieldCheck,
  Star,
  Timer,
  Truck as TruckIcon,
  Users,
} from "lucide-react";
import { actions, useAppData } from "@/lib/store";
import { DEMO_NOW, GOODS_TYPES, TRUCK_TYPES } from "@/lib/constants";
import { PLACES } from "@/lib/data/geo";
import { cn, formatDate, toLocalInput } from "@/lib/utils";
import type { Company, GoodsType, TruckType } from "@/types";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { CompanyLogo, DriverAvatar, SafeImage } from "@/components/ui/media";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/misc";
import { Logo } from "@/components/layout/logo";
import { SiteHeader } from "@/components/layout/site-header";
import { companyTypeLabel, directoryCompanies, directoryDrivers, directoryTrucks, publicName, type DirCompany, type DirDriver, type DirTruck } from "./directory-data";

type Tab = "camions" | "chauffeurs" | "transporteurs";

/** Destinataire d'une demande : toujours une entreprise, éventuellement un camion ou un chauffeur précis. */
interface Target {
  company?: Company;
  truckId?: string;
  driverId?: string;
  title: string;
  subtitle?: string;
}

// ── Éléments communs ─────────────────────────────────────────
function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Note ${value.toFixed(1)} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn("size-3.5", i <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-slate-200")} />
      ))}
      <span className="ml-1 text-xs font-semibold text-slate-700 tabular-nums">{value.toFixed(1)}</span>
    </span>
  );
}

function Pill({ tone, children }: { tone: "green" | "amber" | "slate"; children: React.ReactNode }) {
  const tones = { green: "bg-success-50 text-success-700 ring-success-600/20", amber: "bg-amber-50 text-amber-800 ring-amber-500/20", slate: "bg-slate-100 text-slate-600 ring-slate-300/40" };
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1", tones[tone])}>{children}</span>;
}

// ── Cartes ───────────────────────────────────────────────────
function TruckCard({ item, onRequest }: { item: DirTruck; onRequest: () => void }) {
  const { truck: t, driver: d, company: c } = item;
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-pop">
      <div className="relative h-44 overflow-hidden">
        <SafeImage src={t.image} alt={`${t.brand} ${t.model}`} className="absolute inset-0 transition duration-500 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 400px" fallback="truck" />
        <div className="absolute top-3 left-3">
          {item.freeFrom ? (
            <Pill tone="amber">
              <Clock className="size-3" /> Libre vers le {formatDate(item.freeFrom)}
            </Pill>
          ) : (
            <Pill tone="green">
              <CheckCircle2 className="size-3" /> Disponible
            </Pill>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[11px] font-semibold tracking-wider text-brand-600 uppercase">{TRUCK_TYPES[t.type]}</p>
        <h3 className="mt-1 text-lg font-semibold text-ink">
          {t.brand} {t.model}
        </h3>
        <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-slate-50 py-2">
            <dt className="text-[10px] text-slate-500 uppercase">Charge</dt>
            <dd className="text-sm font-semibold tabular-nums">{t.capacityT} t</dd>
          </div>
          <div className="rounded-lg bg-slate-50 py-2">
            <dt className="text-[10px] text-slate-500 uppercase">Année</dt>
            <dd className="text-sm font-semibold tabular-nums">{t.year}</dd>
          </div>
          <div className="rounded-lg bg-slate-50 py-2">
            <dt className="text-[10px] text-slate-500 uppercase">Base</dt>
            <dd className="truncate px-1 text-sm font-semibold">{c.city}</dd>
          </div>
        </dl>
        <div className="mt-4 flex items-center gap-3">
          {d ? (
            <>
              <DriverAvatar driver={d} size="sm" />
              <div className="min-w-0 text-sm">
                <p className="truncate font-medium">{publicName(d)}</p>
                <p className="text-xs text-slate-500">{d.experienceYears} ans d&apos;expérience</p>
              </div>
              <span className="ml-auto">
                <Stars value={d.rating} />
              </span>
            </>
          ) : (
            <p className="flex items-center gap-2 text-sm text-slate-500">
              <IdCard className="size-4" /> Chauffeur confirmé à la réservation
            </p>
          )}
        </div>
        <div className="mt-auto pt-4">
          <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
            <CompanyLogo company={c} size="xs" />
            <span className="min-w-0 flex-1 truncate text-xs text-slate-600">{c.name}</span>
          </div>
          <Button className="mt-3 h-auto min-h-10 w-full py-2 whitespace-normal" icon={Send} onClick={onRequest}>
            Demander ce camion
          </Button>
        </div>
      </div>
    </article>
  );
}

function DriverCard({ item, onRequest }: { item: DirDriver; onRequest: () => void }) {
  const { driver: d, company: c, truck: t } = item;
  return (
    <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-pop">
      <div className="flex items-start gap-4">
        <DriverAvatar driver={d} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-lg font-semibold text-ink">{publicName(d)}</h3>
            {item.available ? <Pill tone="green">Disponible</Pill> : <Pill tone="slate">En mission</Pill>}
          </div>
          <p className="text-sm text-slate-500">Chauffeur poids lourd · permis {d.licenseCategory}</p>
          <div className="mt-1">
            <Stars value={d.rating} />
          </div>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-slate-50 py-2">
          <dt className="text-[10px] text-slate-500 uppercase">Expérience</dt>
          <dd className="text-sm font-semibold tabular-nums">{d.experienceYears} ans</dd>
        </div>
        <div className="rounded-lg bg-slate-50 py-2">
          <dt className="text-[10px] text-slate-500 uppercase">Missions</dt>
          <dd className="text-sm font-semibold tabular-nums">{item.missionsDone}</dd>
        </div>
        <div className="rounded-lg bg-slate-50 py-2">
          <dt className="text-[10px] text-slate-500 uppercase">Note</dt>
          <dd className="text-sm font-semibold tabular-nums">{d.rating.toFixed(1)}/5</dd>
        </div>
      </dl>
      <div className="mt-4 space-y-2 text-sm">
        {t && (
          <p className="flex items-center gap-2 text-slate-600">
            <TruckIcon className="size-4 shrink-0 text-slate-400" /> {TRUCK_TYPES[t.type]} · {t.brand} {t.model}
          </p>
        )}
        {item.routes.length > 0 && (
          <p className="flex items-start gap-2 text-slate-600">
            <Route className="mt-0.5 size-4 shrink-0 text-slate-400" /> Itinéraires : {item.routes.join(", ")}
          </p>
        )}
      </div>
      <div className="mt-auto pt-4">
        <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
          <CompanyLogo company={c} size="xs" />
          <span className="min-w-0 flex-1 truncate text-xs text-slate-600">{c.name}</span>
        </div>
        <Button className="mt-3 h-auto min-h-10 w-full py-2 whitespace-normal" variant="secondary" icon={Send} onClick={onRequest}>
          Demander ce chauffeur
        </Button>
      </div>
    </article>
  );
}

function CompanyCard({ item, onRequest }: { item: DirCompany; onRequest: () => void }) {
  const c = item.company;
  return (
    <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-pop">
      <div className="flex items-start gap-4">
        <CompanyLogo company={c} size="lg" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold text-ink">{c.name}</h3>
          <p className="flex flex-wrap items-center gap-x-2 text-sm text-slate-500">
            {companyTypeLabel(c)} <span className="text-slate-300">·</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" /> {c.city}
            </span>
          </p>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-slate-50 py-2">
          <dt className="text-[10px] text-slate-500 uppercase">Camions</dt>
          <dd className="text-sm font-semibold tabular-nums">{item.trucks}</dd>
        </div>
        <div className="rounded-lg bg-slate-50 py-2">
          <dt className="text-[10px] text-slate-500 uppercase">Chauffeurs</dt>
          <dd className="text-sm font-semibold tabular-nums">{item.drivers}</dd>
        </div>
        <div className="rounded-lg bg-slate-50 py-2">
          <dt className="text-[10px] text-slate-500 uppercase">À l&apos;heure</dt>
          <dd className="text-sm font-semibold tabular-nums">{item.onTimeRate === null ? "—" : `${item.onTimeRate} %`}</dd>
        </div>
      </dl>
      {item.types.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {item.types.map((t) => (
            <span key={t} className="rounded-full border border-slate-200 px-2.5 py-0.5 text-[11px] text-slate-600">
              {TRUCK_TYPES[t]}
            </span>
          ))}
        </div>
      )}
      <p className="mt-3 text-xs text-slate-500">
        Sur LogiTrack depuis {item.since} · {item.missionsDone} missions livrées
      </p>
      <div className="mt-auto pt-4">
        <Button className="h-auto min-h-10 w-full py-2 whitespace-normal" variant="dark" icon={PhoneCall} onClick={onRequest}>
          Contacter l&apos;entreprise
        </Button>
      </div>
    </article>
  );
}

// ── Formulaire de demande ────────────────────────────────────
function RequestModal({ target, companies, onClose }: { target: Target; companies: Company[]; onClose: () => void }) {
  const [sent, setSent] = useState<{ ref: string; company: string } | null>(null);
  const [v, setV] = useState({
    companyId: target.company?.id ?? companies[0]?.id ?? "",
    name: "",
    phone: "",
    email: "",
    organisation: "",
    origin: "port-djibouti",
    destination: "dire-dawa",
    date: toLocalInput(new Date(Date.parse(DEMO_NOW) + 2 * 86400000).toISOString()).slice(0, 10),
    goodsType: "conteneurs" as GoodsType,
    message: "",
    consent: false,
  });
  const set = <K extends keyof typeof v>(k: K, val: (typeof v)[K]) => setV((x) => ({ ...x, [k]: val }));
  const company = target.company ?? companies.find((c) => c.id === v.companyId);
  const phoneOk = v.phone.replace(/\D/g, "").length >= 8;
  const emailOk = !v.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email);
  const valid = !!company && v.name.trim().length >= 3 && phoneOk && emailOk && v.origin !== v.destination && !!v.date && v.consent;

  if (sent) {
    return (
      <Modal open size="sm" onClose={onClose} title="Demande envoyée" footer={<Button className="w-full sm:w-auto" onClick={onClose}>Fermer</Button>}>
        <div className="text-center">
          <CheckCircle2 className="mx-auto size-12 text-success-600" />
          <p className="mt-3 text-sm text-slate-600">
            Votre demande <strong className="font-mono text-ink">{sent.ref}</strong> a été transmise à <strong className="text-ink">{sent.company}</strong>. Un conseiller vous rappelle au <strong className="text-ink">{v.phone}</strong>.
          </p>
          <p className="mt-2 text-xs text-slate-400">Démonstration : aucun SMS ni e-mail n&apos;est réellement envoyé.</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={target.title}
      description={target.subtitle}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button
            icon={Send}
            disabled={!valid}
            onClick={() => {
              if (!company) return;
              const ref = actions.submitLead({
                companyId: company.id,
                truckId: target.truckId,
                driverId: target.driverId,
                name: v.name.trim(),
                phone: v.phone.trim(),
                email: v.email.trim() || undefined,
                organisation: v.organisation.trim() || undefined,
                origin: v.origin,
                destination: v.destination,
                date: new Date(`${v.date}T08:00:00+03:00`).toISOString(),
                goodsType: v.goodsType,
                message: v.message.trim() || undefined,
              });
              setSent({ ref, company: company.name });
            }}
          >
            Envoyer la demande
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {!target.company && (
          <Field label="Transporteur" required className="sm:col-span-2">
            <Select value={v.companyId} onChange={(e) => set("companyId", e.target.value)}>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.city}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label="Nom et prénom" required>
          <Input value={v.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" />
        </Field>
        <Field label="Téléphone" required error={v.phone && !phoneOk ? "Numéro incomplet" : undefined}>
          <Input type="tel" value={v.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+253 77 …" autoComplete="tel" />
        </Field>
        <Field label="E-mail" error={!emailOk ? "Adresse invalide" : undefined}>
          <Input type="email" value={v.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" />
        </Field>
        <Field label="Société (facultatif)">
          <Input value={v.organisation} onChange={(e) => set("organisation", e.target.value)} autoComplete="organization" />
        </Field>
        <Field label="Départ" required>
          <Select value={v.origin} onChange={(e) => set("origin", e.target.value)}>
            {PLACES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Destination" required error={v.origin === v.destination ? "Choisissez une autre destination" : undefined}>
          <Select value={v.destination} onChange={(e) => set("destination", e.target.value)}>
            {PLACES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Date souhaitée" required>
          <Input type="date" value={v.date} onChange={(e) => set("date", e.target.value)} />
        </Field>
        <Field label="Marchandise" required>
          <Select value={v.goodsType} onChange={(e) => set("goodsType", e.target.value as GoodsType)}>
            {(Object.keys(GOODS_TYPES) as GoodsType[]).map((g) => (
              <option key={g} value={g}>
                {GOODS_TYPES[g]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Précisions" className="sm:col-span-2">
          <Textarea rows={3} value={v.message} onChange={(e) => set("message", e.target.value)} placeholder="Poids, nombre de conteneurs, contraintes de chargement…" />
        </Field>
        <label className="flex items-start gap-2 text-sm text-slate-600 sm:col-span-2">
          <input type="checkbox" checked={v.consent} onChange={(e) => set("consent", e.target.checked)} className="mt-0.5 size-4 shrink-0 rounded accent-brand-600" />
          <span>J&apos;accepte que mes coordonnées soient transmises à {company?.name ?? "ce transporteur"} pour être recontacté au sujet de cette demande.</span>
        </label>
      </div>
    </Modal>
  );
}

// ── Page ─────────────────────────────────────────────────────
export function MarketingView() {
  const data = useAppData();
  const trucks = directoryTrucks(data);
  const drivers = directoryDrivers(data);
  const companies = directoryCompanies(data);
  const [tab, setTab] = useState<Tab>("camions");
  const [q, setQ] = useState("");
  const [type, setType] = useState<TruckType | "all">("all");
  const [minCap, setMinCap] = useState(0);
  const [onlyFree, setOnlyFree] = useState(false);
  const [minExp, setMinExp] = useState(0);
  const [target, setTarget] = useState<Target | null>(null);

  const text = (...xs: string[]) => {
    const s = q.trim().toLowerCase();
    return !s || xs.some((x) => x.toLowerCase().includes(s));
  };
  const truckRows = trucks
    .filter((i) => (type === "all" || i.truck.type === type) && i.truck.capacityT >= minCap && (!onlyFree || !i.freeFrom) && text(i.truck.brand, i.truck.model, i.company.name, i.company.city, TRUCK_TYPES[i.truck.type]))
    .sort((a, b) => Number(!!a.freeFrom) - Number(!!b.freeFrom) || b.truck.capacityT - a.truck.capacityT);
  const driverRows = drivers
    .filter((i) => i.driver.experienceYears >= minExp && (!onlyFree || i.available) && (type === "all" || i.truck?.type === type) && text(i.driver.firstName, i.company.name, ...i.routes))
    .sort((a, b) => Number(b.available) - Number(a.available) || b.driver.experienceYears - a.driver.experienceYears);
  const companyRows = companies.filter((i) => (type === "all" || i.types.includes(type)) && text(i.company.name, i.company.city, companyTypeLabel(i.company))).sort((a, b) => b.trucks - a.trucks);

  const listedCompanies = companies.map((c) => c.company);
  const types = (Object.keys(TRUCK_TYPES) as TruckType[]).filter((t) => trucks.some((i) => i.truck.type === t) || drivers.some((i) => i.truck?.type === t));
  const yearsTotal = drivers.reduce((s, i) => s + i.driver.experienceYears, 0);
  const counts: Record<Tab, number> = { camions: truckRows.length, chauffeurs: driverRows.length, transporteurs: companyRows.length };
  const tabs: { id: Tab; label: string; icon: typeof TruckIcon }[] = [
    { id: "camions", label: "Camions", icon: TruckIcon },
    { id: "chauffeurs", label: "Chauffeurs", icon: IdCard },
    { id: "transporteurs", label: "Transporteurs", icon: Building2 },
  ];
  const resetFilters = () => {
    setQ("");
    setType("all");
    setMinCap(0);
    setMinExp(0);
    setOnlyFree(false);
  };

  return (
    <div className="min-h-screen bg-white text-ink">
      <SiteHeader />

      {/* Héros */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:py-20">
          <div>
            <h1 className="text-4xl leading-[1.1] font-semibold tracking-tight sm:text-5xl">
              Trouvez le camion, le chauffeur et le transporteur <span className="text-brand-600">qu&apos;il vous faut</span>.
            </h1>
            <p className="mt-4 max-w-xl text-lg text-slate-600">Comparez les camions disponibles, l&apos;expérience des chauffeurs et la fiabilité des entreprises. Envoyez votre demande en deux minutes : le transporteur vous rappelle.</p>
            <form
              className="mt-7 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-card sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                document.getElementById("annuaire")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-slate-400" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ville, marque, entreprise, itinéraire…" className="h-12 w-full rounded-xl pr-3 pl-10 text-base outline-none placeholder:text-slate-400" aria-label="Rechercher dans l'annuaire" />
              </div>
              <Button type="submit" size="lg" className="sm:px-7">
                Rechercher
              </Button>
            </form>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button variant="secondary" icon={Send} onClick={() => setTarget({ title: "Demander un transport", subtitle: "Votre demande est transmise au transporteur choisi, qui vous rappelle." })}>
                Demander un transport
              </Button>
              <span className="text-sm text-slate-500">sans choisir de camion à l&apos;avance</span>
            </div>
            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
              {["Sans inscription", "Réponse du transporteur", "Coordonnées protégées"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-success-600" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative hidden lg:block">
            <div className="relative h-[420px] overflow-hidden rounded-3xl shadow-pop">
              <SafeImage src="/images/port-terminal.jpg" alt="Terminal à conteneurs du port de Djibouti" className="absolute inset-0" sizes="600px" priority fallback="image" />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950/70 to-transparent" />
              <p className="absolute right-5 bottom-5 left-5 text-sm text-white/90">Du terminal de Doraleh jusqu&apos;à Dire Dawa : des professionnels inscrits et suivis sur LogiTrack.</p>
            </div>
            <div className="absolute -bottom-6 -left-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-pop">
              <p className="text-xs text-slate-500">Camions disponibles</p>
              <p className="text-2xl font-semibold tabular-nums">{trucks.filter((i) => !i.freeFrom).length}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Chiffres clés */}
      <section className="bg-navy-900 text-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-4">
          {[
            { icon: TruckIcon, value: trucks.length, label: "camions publiés" },
            { icon: Users, value: drivers.length, label: "chauffeurs référencés" },
            { icon: Building2, value: companies.length, label: "transporteurs" },
            { icon: Timer, value: yearsTotal, label: "années d'expérience cumulées" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
                <s.icon className="size-5 text-brand-500" />
              </span>
              <div>
                <p className="text-2xl font-semibold tabular-nums">{s.value}</p>
                <p className="text-xs text-white/60">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Annuaire */}
      <section id="annuaire" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-14 sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Les professionnels disponibles</h2>
          </div>
          <p className="max-w-md text-sm text-slate-500">Seuls les camions, chauffeurs et entreprises que les transporteurs ont choisi de publier apparaissent ici.</p>
        </div>

        <div className="mt-6 flex gap-1 overflow-x-auto border-b border-slate-200" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn("inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition", tab === t.id ? "border-brand-600 text-ink" : "border-transparent text-slate-500 hover:text-ink")}
            >
              <t.icon className="size-4" /> {t.label}
              <span className={cn("rounded-full px-2 text-[11px] tabular-nums", tab === t.id ? "bg-brand-50 text-brand-700" : "bg-slate-100 text-slate-500")}>{counts[t.id]}</span>
            </button>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-center">
          <div className="relative sm:col-span-2 lg:w-72">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…" className="pl-9" aria-label="Rechercher" />
          </div>
          <Select value={type} onChange={(e) => setType(e.target.value as TruckType | "all")} aria-label="Type de camion" className="lg:w-52">
            <option value="all">Tous les types de camion</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {TRUCK_TYPES[t]}
              </option>
            ))}
          </Select>
          {tab === "camions" && (
            <Select value={minCap} onChange={(e) => setMinCap(Number(e.target.value))} aria-label="Charge utile minimale" className="lg:w-44">
              <option value={0}>Toute charge utile</option>
              <option value={10}>10 t et plus</option>
              <option value={20}>20 t et plus</option>
              <option value={30}>30 t et plus</option>
            </Select>
          )}
          {tab === "chauffeurs" && (
            <Select value={minExp} onChange={(e) => setMinExp(Number(e.target.value))} aria-label="Expérience minimale" className="lg:w-48">
              <option value={0}>Toute expérience</option>
              <option value={5}>5 ans et plus</option>
              <option value={10}>10 ans et plus</option>
              <option value={15}>15 ans et plus</option>
            </Select>
          )}
          {tab !== "transporteurs" && (
            <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm text-slate-700">
              <input type="checkbox" checked={onlyFree} onChange={(e) => setOnlyFree(e.target.checked)} className="size-4 rounded accent-brand-600" /> Disponibles maintenant
            </label>
          )}
          <button onClick={resetFilters} className="h-10 text-sm font-medium text-slate-500 hover:text-ink lg:ml-auto">
            Réinitialiser les filtres
          </button>
        </div>

        <div className="mt-6">
          {counts[tab] === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300">
              <EmptyState icon={Search} title="Aucun résultat" message="Élargissez vos critères ou contactez directement un transporteur." />
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {tab === "camions" &&
                truckRows.map((i) => (
                  <TruckCard key={i.truck.id} item={i} onRequest={() => setTarget({ company: i.company, truckId: i.truck.id, title: `Demander : ${i.truck.brand} ${i.truck.model}`, subtitle: `${TRUCK_TYPES[i.truck.type]} · ${i.truck.capacityT} t · ${i.company.name}` })} />
                ))}
              {tab === "chauffeurs" &&
                driverRows.map((i) => (
                  <DriverCard key={i.driver.id} item={i} onRequest={() => setTarget({ company: i.company, driverId: i.driver.id, title: `Demander ${publicName(i.driver)}`, subtitle: `${i.driver.experienceYears} ans d'expérience · ${i.company.name}` })} />
                ))}
              {tab === "transporteurs" && companyRows.map((i) => <CompanyCard key={i.company.id} item={i} onRequest={() => setTarget({ company: i.company, title: `Contacter ${i.company.name}`, subtitle: `${companyTypeLabel(i.company)} · ${i.company.city}` })} />)}
            </div>
          )}
        </div>
      </section>

      {/* Fonctionnement */}
      <section id="fonctionnement" className="scroll-mt-20 border-y border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight">Trois étapes, sans inscription</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {[
              { icon: Search, title: "Comparez", text: "Camions disponibles, expérience et note des chauffeurs, ponctualité des transporteurs." },
              { icon: Send, title: "Envoyez votre demande", text: "Trajet, date, marchandise : la demande arrive directement chez le transporteur choisi." },
              { icon: PhoneCall, title: "Le transporteur vous rappelle", text: "Il confirme le prix et l'enlèvement, puis suit la mission jusqu'à la livraison avec preuve signée." },
            ].map((s, i) => (
              <div key={s.title} className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <s.icon className="size-5" />
                  </span>
                  <span className="text-xs font-semibold text-slate-400">Étape {i + 1}</span>
                </div>
                <p className="mt-4 text-lg font-semibold">{s.title}</p>
                <p className="mt-1 text-sm text-slate-600">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Garanties */}
      <section id="garanties" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-14 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:items-center">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Des professionnels suivis, pas une simple liste</h2>
            <p className="mt-3 text-slate-600">Les entreprises de l&apos;annuaire gèrent leurs missions sur LogiTrack : étapes horodatées, documents de transit vérifiés, incidents déclarés et lien de suivi pour le client.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: BadgeCheck, title: "Entreprises inscrites", text: "Seules les sociétés actives sur LogiTrack publient leurs moyens." },
              { icon: CalendarClock, title: "Suivi de bout en bout", text: "Chargement, départ, frontière, livraison : chaque étape est datée." },
              { icon: FileCheck2, title: "Documents contrôlés", text: "Bon à enlever, sortie port, preuve de livraison vérifiés avant chaque étape." },
              { icon: ShieldCheck, title: "Données protégées", text: "Vos coordonnées vont au seul transporteur choisi ; celles des chauffeurs ne sont jamais publiées." },
            ].map((g) => (
              <div key={g.title} className="rounded-2xl border border-slate-200 p-5">
                <g.icon className="size-6 text-brand-600" />
                <p className="mt-3 font-semibold">{g.title}</p>
                <p className="mt-1 text-sm text-slate-600">{g.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Appel aux transporteurs */}
      <section id="transporteurs" className="scroll-mt-20 px-4 pb-14 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 overflow-hidden rounded-3xl bg-navy-900 p-8 text-white sm:p-10 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Vous êtes transporteur ou transitaire ?</h2>
            <p className="mt-2 text-white/70">Publiez vos camions et vos chauffeurs disponibles, recevez les demandes directement dans votre espace LogiTrack et suivez-les jusqu&apos;à la facture.</p>
          </div>
          <Link href="/login" className="inline-flex h-12 shrink-0 items-center gap-2 rounded-xl bg-white px-6 font-medium text-navy-900 transition hover:bg-white/90">
            Publier ma flotte <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* Pied de page */}
      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-3 max-w-sm text-sm text-slate-500">La plateforme de coordination du transport routier et du transit à Djibouti.</p>
          </div>
          <div>
            <p className="text-sm font-semibold">Annuaire</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              {tabs.map((t) => (
                <li key={t.id}>
                  <a
                    href="#annuaire"
                    onClick={() => setTab(t.id)}
                    className="hover:text-ink"
                  >
                    {t.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold">Professionnels</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              <li>
                <Link href="/login" className="hover:text-ink">
                  Espace professionnel
                </Link>
              </li>
              <li>
                <Link href="/transporteur" className="hover:text-ink">
                  Espace transporteur partenaire
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-ink">
                  Présentation de LogiTrack
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-200">
          <p className="mx-auto max-w-7xl px-4 py-4 text-xs text-slate-400 sm:px-6">Prototype de démonstration — données entièrement fictives. Les demandes ne sont transmises qu&apos;à l&apos;entreprise concernée.</p>
        </div>
      </footer>

      {target && <RequestModal target={target} companies={listedCompanies} onClose={() => setTarget(null)} />}
    </div>
  );
}

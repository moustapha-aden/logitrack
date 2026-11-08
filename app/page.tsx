import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  Handshake,
  MapPinned,
  Package,
  Route,
  ShieldCheck,
  Smartphone,
  Truck,
} from "lucide-react";
import { OPERATION_STEPS, SLOGAN } from "@/lib/constants";
import { SafeImage } from "@/components/ui/media";
import { Logo } from "@/components/layout/logo";

const SPACES = [
  { title: "Administration", desc: "Supervisez entreprises, flottes, missions, incidents et performance de l'ensemble de la plateforme.", href: "/dashboard", icon: ShieldCheck, image: "/images/port-djibouti.jpg", cta: "Ouvrir l'administration" },
  { title: "Espace entreprise", desc: "Chaque transporteur ou transitaire gère ses camions, ses chauffeurs, ses missions et ses statistiques.", href: "/entreprise", icon: Building2, image: "/images/parc-camions-corridor.jpg", cta: "Découvrir l'espace entreprise" },
  { title: "Application chauffeur", desc: "Une interface mobile simple : mission du jour, itinéraire, chargement et mises à jour en un geste.", href: "/chauffeur", icon: Smartphone, image: "/images/truck-howo-semi-bachee.jpg", cta: "Lancer l'application" },
];

const FEATURES = [
  { icon: Truck, title: "Gestion de flotte", desc: "Camions plateau, citernes, porte-conteneurs, frigorifiques et semi-remorques." },
  { icon: Handshake, title: "Transporteurs & chauffeurs", desc: "Permis, affectations, disponibilités et partenaires autorisés." },
  { icon: Route, title: "Missions", desc: "Création, affectation camion/chauffeur et planification des départs." },
  { icon: Package, title: "Chargements", desc: "Nature, poids, volume, colis et valeur déclarée en DJF." },
  { icon: Activity, title: "Suivi des opérations", desc: "Timeline en 8 étapes, du chargement à la clôture." },
  { icon: AlertTriangle, title: "Incidents & retards", desc: "Déclaration terrain, gravité et suivi de résolution." },
  { icon: MapPinned, title: "Carte des corridors", desc: "Port, Doraleh, PK12, Damerjog et corridors vers Galafi et Dire Dawa." },
  { icon: BarChart3, title: "Rapports", desc: "Ponctualité, utilisation de la flotte et performance des entreprises." },
];

const PLACES = ["Port de Djibouti", "Doraleh", "Damerjog", "PK12", "Arta", "Ali Sabieh", "Dikhil", "Tadjourah", "Galafi", "Dire Dawa"];

export default function LandingPage() {
  return (
    <div className="bg-white">
      {/* Navigation */}
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Logo dark />
          <nav className="hidden items-center gap-8 text-sm text-white/80 md:flex">
            <a href="#espaces" className="hover:text-white">Espaces</a>
            <a href="#fonctionnalites" className="hover:text-white">Fonctionnalités</a>
            <a href="#suivi" className="hover:text-white">Suivi</a>
          </nav>
          <Link href="/login" className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/20">
            Se connecter
          </Link>
        </div>
      </header>

      {/* Héros */}
      <section className="relative flex min-h-svh items-center overflow-hidden bg-navy-900">
        <SafeImage src="/images/port-terminal.jpg" alt="Grues du terminal à conteneurs du Port de Djibouti au coucher du soleil" className="absolute inset-0 h-full w-full" sizes="100vw" priority fallback="image" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-900/45 to-navy-900/20 md:bg-gradient-to-r md:from-navy-950/90 md:via-navy-900/60 md:to-transparent" />
        <div className="relative mx-auto w-full max-w-7xl px-5 pt-28 pb-16 sm:px-8">
          <h1 className="max-w-3xl text-4xl leading-[1.1] font-semibold tracking-tight text-balance text-white sm:text-5xl lg:text-7xl">{SLOGAN}</h1>
          <p className="mt-6 max-w-xl text-base text-white/80 sm:text-lg">LogiTrack réunit administrateurs, entreprises de transport, transitaires, chauffeurs et clients sur une plateforme unique pour piloter chaque mission, du port jusqu&apos;à la livraison.</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/dashboard" className="inline-flex h-12 items-center gap-2 rounded-xl bg-brand-600 px-6 font-medium text-white shadow-lg shadow-brand-600/30 transition hover:bg-brand-700">
              Explorer la démonstration <ArrowRight className="size-4" />
            </Link>
            <Link href="/chauffeur" className="inline-flex h-12 items-center gap-2 rounded-xl bg-white/10 px-6 font-medium text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/20">
              <Smartphone className="size-4" /> Application chauffeur
            </Link>
          </div>
        </div>
      </section>
      {/* Espaces */}
      <section id="espaces" className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-brand-600">Trois espaces, une seule plateforme</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-navy-900 sm:text-4xl">Chaque acteur dispose d&apos;un espace adapté à son métier.</h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {SPACES.map((s) => (
            <Link key={s.title} href={s.href} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-pop">
              <div className="relative">
                <SafeImage src={s.image} alt={s.title} className="aspect-[16/10] transition duration-500 group-hover:scale-[1.03]" sizes="(max-width: 768px) 100vw, 400px" />
                <span className="absolute top-4 left-4 inline-flex size-10 items-center justify-center rounded-xl bg-white/95 text-brand-600 shadow">
                  <s.icon className="size-5" />
                </span>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-navy-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.desc}</p>
                <p className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600">
                  {s.cta} <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Fonctionnalités */}
      <section id="fonctionnalites" className="bg-canvas py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_1.4fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold text-brand-600">Fonctionnalités</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-navy-900 sm:text-4xl">Tout le cycle du transport, centralisé.</h2>
            <p className="mt-4 text-slate-600">Du débarquement au Port de Djibouti jusqu&apos;à la livraison à Ali Sabieh, Galafi ou Dire Dawa, chaque étape est tracée et partagée entre les acteurs.</p>
            <div className="relative mt-8 overflow-hidden rounded-3xl">
              <SafeImage src="/images/container-ship.jpg" alt="Porte-conteneurs en cours de chargement" className="aspect-[4/3]" sizes="(max-width: 1024px) 100vw, 480px" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <f.icon className="size-5" />
                </span>
                <h3 className="mt-4 font-semibold text-navy-900">{f.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Suivi */}
      <section id="suivi" className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold text-brand-600">Suivi des opérations</p>
          <h2 className="mx-auto mt-2 max-w-2xl text-3xl font-semibold tracking-tight text-navy-900 sm:text-4xl">Huit étapes claires, mises à jour par le terrain.</h2>
        </div>
        <ol className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {OPERATION_STEPS.map((s) => (
            <li key={s.step} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4">
              <span className={`inline-flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${s.step >= 6 ? "bg-success-50 text-success-700" : "bg-brand-50 text-brand-700"}`}>{s.step + 1}</span>
              <div>
                <p className="text-sm font-semibold text-navy-900">{s.label}</p>
                <p className="text-xs text-slate-500">{s.actor}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {PLACES.map((p) => (
            <span key={p} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-600">
              <MapPinned className="size-3.5 text-brand-600" /> {p}
            </span>
          ))}
        </div>
      </section>

      {/* Appel à l'action */}
      <section className="px-5 pb-24 sm:px-8">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-navy-900 px-8 py-14 text-center text-white sm:px-14">
          <SafeImage src="/images/truck-conteneur-plateau-corridor.jpg" alt="" className="absolute inset-0 opacity-20" sizes="1200px" fallback="image" />
          <div className="relative">
            <h2 className="text-3xl font-semibold tracking-tight">Prêt à découvrir LogiTrack ?</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/70">Prototype interactif : créez une mission, affectez un camion, suivez la progression et simulez le parcours d&apos;un chauffeur.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/login" className="inline-flex h-12 items-center gap-2 rounded-xl bg-brand-600 px-6 font-medium transition hover:bg-brand-700">
                Accéder à la démonstration <ArrowRight className="size-4" />
              </Link>
            </div>
            <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-white/70">
              {["Sans installation", "Données fictives", "Responsive mobile"].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-success-600" /> {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-slate-500 sm:flex-row sm:px-8">
          <Logo />
          <p>Prototype de démonstration — données entièrement fictives.</p>
          <Link href="/credits" className="hover:text-ink">
            Crédits photos
          </Link>
        </div>
      </footer>
    </div>
  );
}

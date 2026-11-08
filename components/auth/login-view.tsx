"use client";

import { useLayoutEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, CheckCircle2, Eye, EyeOff, Lock, Mail, ShieldCheck, Smartphone } from "lucide-react";
import { actions, useAppData } from "@/lib/store";
import { SLOGAN } from "@/lib/constants";
import { cn, driverName } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { SafeImage } from "@/components/ui/media";
import { useToast } from "@/components/ui/toast";
import { Logo } from "@/components/layout/logo";

type Role = "admin" | "company" | "driver";

const ROLES: { id: Role; label: string; desc: string; icon: typeof ShieldCheck; email: string; href: string }[] = [
  { id: "admin", label: "Administrateur", desc: "Supervision de la plateforme", icon: ShieldCheck, email: "admin@logitrack.dj", href: "/dashboard" },
  { id: "company", label: "Entreprise", desc: "Transporteur ou transitaire", icon: Building2, email: "exploitation@hornfreight.dj", href: "/entreprise" },
  { id: "driver", label: "Chauffeur", desc: "Application mobile terrain", icon: Smartphone, email: "chauffeur@logitrack.dj", href: "/chauffeur" },
];

export function LoginView() {
  const router = useRouter();
  const data = useAppData();
  const { toast } = useToast();
  const [role, setRole] = useState<Role>("admin");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  // Avec cacheComponents, Next.js masque la page (Activity) au lieu de la démonter :
  // on réinitialise l'état transitoire quand elle est cachée pour que le bouton
  // redevienne cliquable au retour (ex. après une déconnexion).
  useLayoutEffect(() => {
    return () => {
      setLoading(false);
      setShow(false);
    };
  }, []);

  const current = ROLES.find((r) => r.id === role)!;
  const companies = data.companies.filter((c) => c.type !== "client" && c.status === "actif");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      window.localStorage.setItem("logitrack:session", JSON.stringify({ role, at: new Date().toISOString() }));
    } catch {
      /* stockage indisponible */
    }
    window.setTimeout(() => {
      toast("Connexion réussie", { message: `Bienvenue dans l'espace ${current.label.toLowerCase()}.` });
      router.push(current.href);
    }, 450);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* Visuel */}
      <div className="relative hidden overflow-hidden bg-navy-900 lg:block">
        <SafeImage src="/images/port-terminal.jpg" alt="Terminal à conteneurs du Port de Djibouti" className="absolute inset-0" sizes="60vw" priority fallback="image" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-900/60 to-navy-900/30" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Link href="/">
            <Logo dark />
          </Link>
          <div className="max-w-lg">
            <p className="text-sm font-medium text-brand-500">Plateforme transport & logistique · Djibouti</p>
            <h1 className="mt-3 text-4xl leading-tight font-semibold tracking-tight">{SLOGAN}</h1>
            <ul className="mt-8 space-y-3 text-sm text-white/80">
              {["Flottes, chauffeurs et transporteurs centralisés", "Suivi des missions du port jusqu'à la livraison", "Incidents et retards déclarés en temps réel"].map((t) => (
                <li key={t} className="flex items-center gap-3">
                  <CheckCircle2 className="size-5 text-success-600" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-white/40">Photo : terminal à conteneurs du Port de Djibouti — Wikimedia Commons (CC BY-SA 4.0)</p>
        </div>
      </div>

      {/* Formulaire */}
      <div className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md animate-slide-up">
          <Link href="/" className="lg:hidden">
            <Logo />
          </Link>
          <h2 className="mt-8 text-2xl font-semibold tracking-tight lg:mt-0">Connexion à votre espace</h2>
          <p className="mt-1 text-sm text-slate-500">Prototype de démonstration — aucun mot de passe réel n&apos;est requis.</p>

          <div className="mt-6 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Profil">
            {ROLES.map((r) => (
              <button
                key={r.id}
                role="radio"
                aria-checked={role === r.id}
                onClick={() => setRole(r.id)}
                className={cn("rounded-xl border p-3 text-left transition", role === r.id ? "border-brand-600 bg-brand-50 ring-2 ring-brand-600/15" : "border-slate-200 hover:border-slate-300")}
              >
                <r.icon className={cn("size-5", role === r.id ? "text-brand-600" : "text-slate-400")} />
                <p className="mt-2 text-sm font-semibold">{r.label}</p>
                <p className="mt-0.5 hidden text-[11px] leading-tight text-slate-500 sm:block">{r.desc}</p>
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <Field label="Adresse e-mail">
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                <Input key={role} defaultValue={current.email} className="pl-9" type="email" />
              </div>
            </Field>
            <Field label="Mot de passe">
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                <Input type={show ? "text" : "password"} defaultValue="demo-logitrack" className="px-9" />
                <button type="button" onClick={() => setShow(!show)} className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-ink" aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}>
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </Field>
            {role === "company" && (
              <Field label="Entreprise à simuler">
                <Select value={data.prefs.companyId} onChange={(e) => actions.setPrefs({ companyId: e.target.value })}>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
            {role === "driver" && (
              <Field label="Chauffeur à simuler">
                <Select value={data.prefs.driverId} onChange={(e) => actions.setPrefs({ driverId: e.target.value })}>
                  {data.drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {driverName(d)}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-600">
                <input type="checkbox" defaultChecked className="size-4 rounded accent-brand-600" /> Se souvenir de moi
              </label>
              <button type="button" onClick={() => toast("Fonction disponible en production", { message: "La réinitialisation du mot de passe n'est pas simulée.", tone: "info" })} className="font-medium text-brand-600 hover:text-brand-700">
                Mot de passe oublié ?
              </button>
            </div>
            <Button type="submit" size="lg" iconRight={ArrowRight} className="w-full" disabled={loading}>
              {loading ? "Connexion…" : `Accéder à l'espace ${current.label.toLowerCase()}`}
            </Button>
          </form>
          <p className="mt-8 text-center text-xs text-slate-400">
            Données fictives · <Link href="/" className="hover:text-ink">Retour à la présentation</Link> · <Link href="/credits" className="hover:text-ink">Crédits photos</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

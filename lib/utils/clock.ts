// ─────────────────────────────────────────────────────────────
// Horloge de démonstration : la date de référence (DEMO_NOW)
// avance au rythme réel depuis l'ouverture de la page. Ainsi les
// actions horodatées restent cohérentes avec la date affichée.
// Côté serveur, l'horloge reste figée sur DEMO_NOW (rendu stable).
// ─────────────────────────────────────────────────────────────
import { DEMO_NOW } from "@/lib/constants";

const BASE = Date.parse(DEMO_NOW);
const LOADED_AT = typeof window === "undefined" ? 0 : Date.now();

export function demoNowMs(): number {
  if (typeof window === "undefined") return BASE;
  return BASE + (Date.now() - LOADED_AT);
}

export const demoNowIso = () => new Date(demoNowMs()).toISOString();

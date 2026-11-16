"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/**
 * Faux côté serveur et pendant l'hydratation, vrai ensuite.
 * Permet de lire `window` ou les données du navigateur sans écart d'hydratation.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}

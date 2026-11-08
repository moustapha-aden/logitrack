"use client";

import dynamic from "next/dynamic";
import { MapPinned } from "lucide-react";
import type { MapProps } from "./djibouti-map";

/** Carte chargée uniquement côté client (Leaflet dépend de window). */
export const DjiboutiMap = dynamic<MapProps>(() => import("./djibouti-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[460px] animate-pulse flex-col items-center justify-center gap-2 rounded-xl bg-slate-100 text-slate-400">
      <MapPinned className="size-8" />
      <span className="text-xs">Chargement de la carte…</span>
    </div>
  ),
});

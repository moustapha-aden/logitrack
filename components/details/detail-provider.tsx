"use client";

import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import type { EntityRef } from "@/types";
import { Drawer } from "@/components/ui/modal";
import { CarrierDetail, CompanyDetail, DriverDetail, TruckDetail } from "./entity-details";
import { IncidentDetail, LoadDetail, MissionDetail } from "./mission-details";

interface DetailApi {
  open: (ref: EntityRef) => void;
  close: () => void;
}

const DetailContext = createContext<DetailApi>({ open: () => {}, close: () => {} });
export const useDetail = () => useContext(DetailContext);

/** Héberge le panneau de fiche détaillée, avec historique de navigation. */
export function DetailProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<EntityRef[]>([]);
  const open = useCallback((ref: EntityRef) => setStack((s) => (s.length && s[s.length - 1].id === ref.id ? s : [...s, ref].slice(-8))), []);
  const close = useCallback(() => setStack([]), []);
  const back = () => setStack((s) => s.slice(0, -1));
  // referme la fiche si la page est masquée par Next.js (Activity)
  useLayoutEffect(() => () => setStack([]), []);
  const api = useMemo(() => ({ open, close }), [open, close]);
  const current = stack[stack.length - 1];

  return (
    <DetailContext.Provider value={api}>
      {children}
      <Drawer open={!!current} onClose={close}>
        {stack.length > 1 && (
          <button onClick={back} className="absolute top-3 left-3 z-20 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-card backdrop-blur hover:text-ink">
            <ArrowLeft className="size-3.5" /> Retour
          </button>
        )}
        {current && <DetailBody key={`${current.kind}-${current.id}`} entity={current} />}
      </Drawer>
    </DetailContext.Provider>
  );
}

function DetailBody({ entity }: { entity: EntityRef }) {
  switch (entity.kind) {
    case "company":
      return <CompanyDetail id={entity.id} />;
    case "carrier":
      return <CarrierDetail id={entity.id} />;
    case "truck":
      return <TruckDetail id={entity.id} />;
    case "driver":
      return <DriverDetail id={entity.id} />;
    case "mission":
      return <MissionDetail id={entity.id} />;
    case "load":
      return <LoadDetail id={entity.id} />;
    case "incident":
      return <IncidentDetail id={entity.id} />;
  }
}

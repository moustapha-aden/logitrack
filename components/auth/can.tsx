"use client";

import type { ReactNode } from "react";
import { usePermissions } from "@/lib/store/selectors";
import type { Permission } from "@/lib/permissions";

/** Affiche son contenu seulement si l'utilisateur courant a le droit demandé. */
export function Can({ perm, children }: { perm: Permission; children: ReactNode }) {
  const { can } = usePermissions();
  return can(perm) ? <>{children}</> : null;
}

import type { Metadata } from "next";
import { AuditView } from "@/components/modules/audit-view";

export const metadata: Metadata = { title: "Journal d'audit" };

export default function Page() {
  return <AuditView />;
}

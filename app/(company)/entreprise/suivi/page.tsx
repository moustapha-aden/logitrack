import type { Metadata } from "next";
import { OperationsView } from "@/components/modules/operations-view";

export const metadata: Metadata = { title: "Suivi des opérations" };

export default function Page() {
  return <OperationsView />;
}

import type { Metadata } from "next";
import { ReportsView } from "@/components/modules/reports-view";

export const metadata: Metadata = { title: "Rapports et statistiques" };

export default function Page() {
  return <ReportsView />;
}

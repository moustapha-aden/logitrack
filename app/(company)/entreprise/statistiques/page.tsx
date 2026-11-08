import type { Metadata } from "next";
import { ReportsView } from "@/components/modules/reports-view";

export const metadata: Metadata = { title: "Statistiques" };

export default function Page() {
  return <ReportsView />;
}

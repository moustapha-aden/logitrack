import type { Metadata } from "next";
import { IncidentsView } from "@/components/modules/incidents-view";

export const metadata: Metadata = { title: "Incidents et retards" };

export default function Page() {
  return <IncidentsView />;
}

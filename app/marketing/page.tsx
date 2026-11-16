import type { Metadata } from "next";
import { MarketingView } from "@/components/marketing/marketing-view";

export const metadata: Metadata = {
  title: "Annuaire des transporteurs à Djibouti",
  description: "Camions disponibles, chauffeurs expérimentés et transporteurs vérifiés à Djibouti. Demande de transport en ligne, sans inscription.",
};

export default function Page() {
  return <MarketingView />;
}

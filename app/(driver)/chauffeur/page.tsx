import type { Metadata } from "next";
import { DriverApp } from "@/components/driver/driver-app";

export const metadata: Metadata = { title: "Espace chauffeur" };

export default function Page() {
  return <DriverApp />;
}

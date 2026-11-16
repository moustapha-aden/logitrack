import type { Metadata } from "next";
import { CarrierApp } from "@/components/carrier/carrier-app";

export const metadata: Metadata = { title: "Espace transporteur" };

export default function Page() {
  return <CarrierApp />;
}

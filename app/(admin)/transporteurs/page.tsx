import type { Metadata } from "next";
import { CarriersView } from "@/components/modules/carriers-view";

export const metadata: Metadata = { title: "Transporteurs" };

export default function Page() {
  return <CarriersView />;
}

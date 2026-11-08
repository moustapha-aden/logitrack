import type { Metadata } from "next";
import { DriversView } from "@/components/modules/drivers-view";

export const metadata: Metadata = { title: "Chauffeurs" };

export default function Page() {
  return <DriversView />;
}

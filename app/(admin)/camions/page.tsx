import type { Metadata } from "next";
import { TrucksView } from "@/components/modules/trucks-view";

export const metadata: Metadata = { title: "Camions" };

export default function Page() {
  return <TrucksView />;
}

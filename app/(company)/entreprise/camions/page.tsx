import type { Metadata } from "next";
import { TrucksView } from "@/components/modules/trucks-view";

export const metadata: Metadata = { title: "Mes camions" };

export default function Page() {
  return <TrucksView />;
}

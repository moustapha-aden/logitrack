import type { Metadata } from "next";
import { ShowcaseView } from "@/components/modules/showcase-view";

export const metadata: Metadata = { title: "Annuaire public et demandes" };

export default function Page() {
  return <ShowcaseView />;
}

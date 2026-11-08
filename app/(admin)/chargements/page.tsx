import type { Metadata } from "next";
import { LoadsView } from "@/components/modules/loads-view";

export const metadata: Metadata = { title: "Chargements" };

export default function Page() {
  return <LoadsView />;
}

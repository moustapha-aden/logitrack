import type { Metadata } from "next";
import { MissionsView } from "@/components/modules/missions-view";

export const metadata: Metadata = { title: "Missions" };

export default function Page() {
  return <MissionsView />;
}

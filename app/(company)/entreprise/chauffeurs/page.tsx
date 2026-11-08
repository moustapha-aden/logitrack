import type { Metadata } from "next";
import { CompanyPeopleView } from "@/components/modules/drivers-view";

export const metadata: Metadata = { title: "Chauffeurs et transporteurs" };

export default function Page() {
  return <CompanyPeopleView />;
}

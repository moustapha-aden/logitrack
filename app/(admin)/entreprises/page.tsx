import type { Metadata } from "next";
import { CompaniesView } from "@/components/modules/companies-view";

export const metadata: Metadata = { title: "Entreprises" };

export default function Page() {
  return <CompaniesView />;
}

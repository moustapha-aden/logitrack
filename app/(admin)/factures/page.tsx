import type { Metadata } from "next";
import { InvoicesView } from "@/components/modules/invoices-view";

export const metadata: Metadata = { title: "Factures et paiements" };

export default function Page() {
  return <InvoicesView />;
}

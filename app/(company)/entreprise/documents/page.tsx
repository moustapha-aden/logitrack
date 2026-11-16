import type { Metadata } from "next";
import { DocumentsView } from "@/components/modules/documents-view";

export const metadata: Metadata = { title: "Documents de transit" };

export default function Page() {
  return <DocumentsView />;
}

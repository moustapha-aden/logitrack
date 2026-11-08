import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = { title: { default: "Espace entreprise", template: "%s · Espace entreprise · LogiTrack" } };

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  return <AppShell variant="company">{children}</AppShell>;
}

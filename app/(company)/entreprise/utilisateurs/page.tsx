import type { Metadata } from "next";
import { UsersView } from "@/components/modules/users-view";

export const metadata: Metadata = { title: "Utilisateurs et accès" };

export default function Page() {
  return <UsersView />;
}

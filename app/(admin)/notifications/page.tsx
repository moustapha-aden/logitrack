import type { Metadata } from "next";
import { NotificationsView } from "@/components/modules/notifications-view";

export const metadata: Metadata = { title: "Notifications" };

export default function Page() {
  return <NotificationsView />;
}

"use client";

import { useState } from "react";
import { AlertTriangle, Bell, CheckCheck, Mail, MailOpen, Route, Trash2, Truck } from "lucide-react";
import { actions } from "@/lib/store";
import { useData } from "@/lib/store/selectors";
import { NOTIFICATION_KINDS } from "@/lib/constants";
import { cn, formatDateTime } from "@/lib/utils";
import type { NotificationKind } from "@/types";
import { Badge, toneSoftBg } from "@/components/ui/badge";
import { Button, IconButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CompanyLogo } from "@/components/ui/media";
import { EmptyState, PageHeader, Segmented } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { useDetail } from "@/components/details/detail-provider";

const icons: Record<NotificationKind, typeof Bell> = { mission: Route, incident: AlertTriangle, retard: AlertTriangle, flotte: Truck, systeme: Bell };

export function NotificationsView() {
  const { notifications, lookups, scope } = useData();
  const { open } = useDetail();
  const { toast } = useToast();
  const [tab, setTab] = useState<"all" | "unread" | NotificationKind>("all");
  const sorted = [...notifications].sort((a, b) => b.at.localeCompare(a.at));
  const rows = sorted.filter((n) => (tab === "all" ? true : tab === "unread" ? !n.read : n.kind === tab));
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div>
      <PageHeader
        eyebrow="Analyse"
        title="Notifications"
        description="Alertes opérationnelles, incidents, retards et événements de flotte."
        actions={
          <Button
            variant="secondary"
            icon={CheckCheck}
            disabled={unread === 0}
            onClick={() => {
              actions.markAllNotificationsRead(scope);
              toast("Toutes les notifications ont été lues");
            }}
          >
            Tout marquer comme lu
          </Button>
        }
      />
      <div className="mb-4">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: "all", label: "Toutes", count: notifications.length },
            { value: "unread", label: "Non lues", count: unread },
            { value: "mission", label: "Missions" },
            { value: "incident", label: "Incidents" },
            { value: "retard", label: "Retards" },
            { value: "flotte", label: "Flotte" },
            { value: "systeme", label: "Système" },
          ]}
        />
      </div>
      <Card>
        {rows.length === 0 ? (
          <EmptyState icon={Bell} title="Aucune notification" message="Vous êtes à jour." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((n) => {
              const Icon = icons[n.kind];
              const company = lookups.company(n.companyId);
              return (
                <li key={n.id} className={cn("group flex gap-4 px-5 py-4 transition hover:bg-slate-50/70", !n.read && "bg-brand-50/30")}>
                  <span className={cn("inline-flex size-10 shrink-0 items-center justify-center rounded-xl", toneSoftBg[NOTIFICATION_KINDS[n.kind].tone])}>
                    <Icon className="size-5" />
                  </span>
                  <button
                    className="min-w-0 flex-1 text-left"
                    onClick={() => {
                      actions.markNotificationRead(n.id);
                      if (n.link) open(n.link);
                    }}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-ink">{n.title}</p>
                      {!n.read && <span className="size-2 rounded-full bg-brand-600" aria-label="Non lue" />}
                      <Badge tone={NOTIFICATION_KINDS[n.kind].tone}>{NOTIFICATION_KINDS[n.kind].label}</Badge>
                    </div>
                    <p className="mt-0.5 text-sm text-slate-600">{n.message}</p>
                    <p className="mt-1.5 flex items-center gap-2 text-xs text-slate-400">
                      {formatDateTime(n.at)}
                      {company && !scope && (
                        <>
                          · <CompanyLogo company={company} size="xs" /> {company.name}
                        </>
                      )}
                    </p>
                  </button>
                  <div className="flex shrink-0 items-start gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                    <IconButton icon={n.read ? Mail : MailOpen} label={n.read ? "Marquer comme non lue" : "Marquer comme lue"} onClick={() => actions.markNotificationRead(n.id, !n.read)} />
                    <IconButton
                      icon={Trash2}
                      label="Supprimer"
                      className="hover:text-red-600"
                      onClick={() => {
                        actions.deleteNotification(n.id);
                        toast("Notification supprimée", { tone: "info" });
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

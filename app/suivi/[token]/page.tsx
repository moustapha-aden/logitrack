import { Suspense } from "react";
import type { Metadata } from "next";
import { TrackingView } from "@/components/tracking/tracking-view";

export const metadata: Metadata = {
  title: "Suivi de votre envoi",
  // lien personnel : jamais indexé par les moteurs de recherche
  robots: { index: false, follow: false },
};

/** Le jeton est lu dans un composant enfant, sous Suspense (Cache Components). */
async function Tracking({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <TrackingView token={token} />;
}

export default function Page({ params }: PageProps<"/suivi/[token]">) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-canvas" />}>
      <Tracking params={params} />
    </Suspense>
  );
}

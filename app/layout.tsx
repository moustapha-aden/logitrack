import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "LogiTrack — Pilotez vos transports. Maîtrisez votre logistique.",
    template: "%s · LogiTrack",
  },
  description:
    "LogiTrack, plateforme de gestion du transport routier, du transit et de la logistique à Djibouti. Prototype de démonstration.",
};

export const viewport: Viewport = {
  themeColor: "#101E35",
  // les zones sûres (encoche, barre d'accueil) deviennent disponibles via env(safe-area-inset-*)
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-canvas text-ink">
        <ToastProvider>{children}</ToastProvider>
        <Analytics />
      </body>
    </html>
  );
}

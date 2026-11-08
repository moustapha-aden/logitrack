import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import credits from "@/public/images/credits.json";
import { SafeImage } from "@/components/ui/media";
import { Logo } from "@/components/layout/logo";

export const metadata: Metadata = { title: "Crédits photos" };

interface Credit {
  title: string;
  author: string;
  license: string;
  licenseUrl: string | null;
  source: string;
}

export default function CreditsPage() {
  const entries = Object.entries(credits as Record<string, Credit>);
  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <div className="flex items-center justify-between">
        <Logo />
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-ink">
          <ArrowLeft className="size-4" /> Retour
        </Link>
      </div>
      <h1 className="mt-10 text-3xl font-semibold tracking-tight">Crédits photographiques</h1>
      <p className="mt-2 max-w-2xl text-slate-600">
        Les photographies utilisées dans ce prototype proviennent de Wikimedia Commons et sont réutilisées conformément à leurs licences libres (CC0, domaine public, CC BY, CC BY-SA). Elles servent uniquement à illustrer le prototype ; les marques visibles appartiennent à leurs propriétaires respectifs et ne sont pas associées au projet.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map(([file, c]) => (
          <div key={file} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <SafeImage src={`/images/${file}`} alt={c.title.replace("File:", "")} className="aspect-[16/10]" sizes="320px" />
            <div className="p-4 text-sm">
              <p className="line-clamp-2 font-medium text-ink">{c.title.replace("File:", "").replace(/\.[a-z]+$/i, "")}</p>
              <p className="mt-1 line-clamp-1 text-slate-500">Auteur : {c.author || "Inconnu"}</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                {c.licenseUrl ? (
                  <a href={c.licenseUrl} target="_blank" rel="noopener noreferrer" className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 hover:bg-slate-200">
                    {c.license}
                  </a>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{c.license}</span>
                )}
                <a href={c.source} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline">
                  Source <ExternalLink className="size-3" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

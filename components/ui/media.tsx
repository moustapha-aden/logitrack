"use client";

import Image from "next/image";
import { useState } from "react";
import { ImageOff, Truck } from "lucide-react";
import type { Company, Driver } from "@/types";
import { cn, initials } from "@/lib/utils";

/** Image avec fallback visuel si le fichier ne charge pas. */
export function SafeImage({
  src,
  alt,
  className,
  sizes = "(max-width: 768px) 100vw, 400px",
  priority,
  fallback = "truck",
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fallback?: "truck" | "image";
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = failedSrc === src;
  const Icon = fallback === "truck" ? Truck : ImageOff;
  return (
    <div className={cn(className?.includes("absolute") ? "" : "relative", "overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200", className)}>
      {!failed ? (
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" onError={() => setFailedSrc(src)} />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-slate-400">
          <Icon className="size-8" aria-hidden />
          <span className="text-[11px]">Image indisponible</span>
        </div>
      )}
    </div>
  );
}

const sizeMap = { xs: "size-7 text-[10px]", sm: "size-9 text-xs", md: "size-11 text-sm", lg: "size-16 text-lg", xl: "size-20 text-2xl" };

export function DriverAvatar({ driver, size = "sm", ring }: { driver: Pick<Driver, "firstName" | "lastName" | "avatarColor"> | undefined; size?: keyof typeof sizeMap; ring?: boolean }) {
  if (!driver) {
    return <span className={cn("inline-flex shrink-0 items-center justify-center rounded-full bg-slate-100 font-semibold text-slate-400", sizeMap[size])}>?</span>;
  }
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white", sizeMap[size], ring && "ring-4 ring-white")}
      style={{ background: `linear-gradient(145deg, ${driver.avatarColor}, ${driver.avatarColor}cc)` }}
      aria-hidden
    >
      {initials(`${driver.firstName} ${driver.lastName}`)}
    </span>
  );
}

export function CompanyLogo({ company, size = "sm" }: { company: Pick<Company, "initials" | "color" | "name"> | undefined; size?: keyof typeof sizeMap }) {
  if (!company) return <span className={cn("inline-flex shrink-0 rounded-xl bg-slate-100", sizeMap[size])} />;
  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl font-bold tracking-tight text-white", sizeMap[size])}
      style={{ backgroundColor: company.color }}
      title={company.name}
      aria-hidden
    >
      <span className="absolute -top-1/3 -right-1/3 size-full rounded-full bg-white/15" />
      <span className="relative">{company.initials}</span>
    </span>
  );
}

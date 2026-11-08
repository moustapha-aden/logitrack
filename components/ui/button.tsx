import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success" | "dark";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-sm shadow-brand-600/20",
  secondary: "bg-white text-ink border border-slate-200 hover:bg-slate-50 hover:border-slate-300",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-ink",
  danger: "bg-red-500 text-white hover:bg-red-600 shadow-sm shadow-red-500/20",
  success: "bg-success-600 text-white hover:bg-success-700 shadow-sm shadow-success-600/20",
  dark: "bg-navy-900 text-white hover:bg-navy-800",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-lg",
  lg: "h-12 px-5 text-base gap-2 rounded-xl",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  children?: ReactNode;
}

export function Button({ variant = "primary", size = "md", icon: Icon, iconRight: IconRight, className, children, type = "button", ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap transition-all duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {Icon && <Icon className={size === "sm" ? "size-3.5" : "size-4"} aria-hidden />}
      {children}
      {IconRight && <IconRight className={size === "sm" ? "size-3.5" : "size-4"} aria-hidden />}
    </button>
  );
}

export function IconButton({ icon: Icon, label, className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { icon: LucideIcon; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-ink focus-visible:outline-2 focus-visible:outline-brand-600 disabled:opacity-40",
        className,
      )}
      {...rest}
    >
      <Icon className="size-4" aria-hidden />
    </button>
  );
}

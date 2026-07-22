import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

type Variant = "primary" | "gold" | "outline" | "outline-light";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-navy-900 text-cream-100 border border-navy-900 hover:border-gold-500",
  gold: "bg-gold-500 text-navy-950 border border-gold-500 hover:border-gold-300",
  outline:
    "bg-transparent text-navy-900 border border-navy-900/25 hover:border-gold-500 hover:text-navy-900",
  "outline-light":
    "bg-transparent text-cream-100 border border-cream-100/40 hover:border-gold-400 hover:text-cream-100",
};

const BASE =
  "group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full px-7 py-3.5 text-sm font-medium tracking-wide transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-12px_rgba(10,14,39,0.45)] active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950";

function Shine() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
    />
  );
}

export function Button({
  variant = "primary",
  className = "",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
}) {
  return (
    <button
      className={`${BASE} ${VARIANT_CLASSES[variant]} ${className}`}
      {...rest}
    >
      <Shine />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
}

export function LinkButton({
  variant = "primary",
  className = "",
  children,
  href,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: Variant;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={`${BASE} ${VARIANT_CLASSES[variant]} ${className}`}
      {...rest}
    >
      <Shine />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </Link>
  );
}

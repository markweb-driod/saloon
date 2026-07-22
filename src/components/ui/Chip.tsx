import type { ButtonHTMLAttributes } from "react";

export default function Chip({
  active = false,
  className = "",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "border-navy-900 bg-navy-900 text-cream-100"
          : "border-navy-900/15 text-navy-700 hover:border-gold-500/60"
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

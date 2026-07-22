import type { ElementType, ComponentPropsWithoutRef } from "react";

type CardProps<T extends ElementType> = {
  as?: T;
  className?: string;
  /** Disable the hover lift/shadow — use for forms and other non-marketing surfaces. */
  flat?: boolean;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className">;

export default function Card<T extends ElementType = "div">({
  as,
  className = "",
  flat = false,
  ...rest
}: CardProps<T>) {
  const Component = as || "div";
  const hoverClasses = flat
    ? ""
    : "transition-all duration-300 hover:-translate-y-1 hover:border-gold-500/50 hover:shadow-[0_20px_40px_-25px_rgba(10,14,39,0.35)]";

  return (
    <Component
      className={`rounded-2xl border border-navy-900/10 bg-white/70 p-8 ${hoverClasses} ${className}`}
      {...rest}
    />
  );
}

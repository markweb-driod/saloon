import type { SelectHTMLAttributes } from "react";
import { FIELD_BASE } from "@/components/ui/Input";

export function Select({
  label,
  className = "",
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  const select = (
    <select className={`${FIELD_BASE} ${className}`} {...rest}>
      {children}
    </select>
  );
  if (!label) return select;
  return (
    <label className="flex flex-col gap-1 text-sm text-navy-950">
      {label}
      {select}
    </label>
  );
}

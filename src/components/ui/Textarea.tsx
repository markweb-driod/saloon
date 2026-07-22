import type { TextareaHTMLAttributes } from "react";
import { FIELD_BASE } from "@/components/ui/Input";

export function Textarea({
  label,
  className = "",
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  const textarea = <textarea className={`${FIELD_BASE} ${className}`} {...rest} />;
  if (!label) return textarea;
  return (
    <label className="flex flex-col gap-1 text-sm text-navy-950">
      {label}
      {textarea}
    </label>
  );
}

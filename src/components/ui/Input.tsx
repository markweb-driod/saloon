import type { InputHTMLAttributes } from "react";

const FIELD_BASE =
  "w-full rounded-lg border border-navy-900/15 bg-white px-3 py-2 text-sm text-navy-950 outline-none transition-colors placeholder:text-slate-500/60 focus:border-gold-500 focus:ring-2 focus:ring-gold-400/20 disabled:opacity-50";

export function Input({
  label,
  className = "",
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  const input = <input className={`${FIELD_BASE} ${className}`} {...rest} />;
  if (!label) return input;
  return (
    <label className="flex flex-col gap-1 text-sm text-navy-950">
      {label}
      {input}
    </label>
  );
}

export { FIELD_BASE };

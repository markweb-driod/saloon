"use client";

import { useState, type InputHTMLAttributes } from "react";
import { FIELD_BASE } from "@/components/ui/Input";

export function PasswordInput({
  label,
  className = "",
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label?: string }) {
  const [visible, setVisible] = useState(false);

  const field = (
    <div className="relative">
      <input type={visible ? "text" : "password"} className={`${FIELD_BASE} pr-11 ${className}`} {...rest} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 transition-colors hover:text-navy-900"
      >
        {visible ? (
          <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3l18 18" />
            <path d="M10.6 10.6a2 2 0 002.8 2.8" />
            <path d="M9.3 5.3A10.9 10.9 0 0112 5c5.5 0 9.5 4.5 10.5 7-.4 1-.9 1.9-1.6 2.7M6.2 6.8C4 8.3 2.4 10.4 1.5 12c1 2.5 5 7 10.5 7 1.6 0 3-.4 4.3-1" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );

  if (!label) return field;
  return (
    <label className="flex flex-col gap-1 text-sm text-navy-950">
      {label}
      {field}
    </label>
  );
}

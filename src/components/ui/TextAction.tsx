import type { ButtonHTMLAttributes } from "react";

/** Small underlined text-button for inline actions like "Edit" / "Manage" / "Cancel". */
export default function TextAction({
  className = "",
  tone = "gold",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "gold" | "red" }) {
  const toneClass =
    tone === "red"
      ? "text-red-600 decoration-red-300 hover:decoration-red-500"
      : "text-navy-700 decoration-gold-500/50 hover:text-gold-600 hover:decoration-gold-500";

  return (
    <button
      type="button"
      className={`text-sm font-medium underline underline-offset-2 transition-colors disabled:opacity-50 ${toneClass} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

"use client";

import { useState } from "react";

/**
 * Photo tile with a graceful fallback. Pass `src` to render a real
 * (hotlinked) photo; if it fails to load, or no `src` is given, it
 * falls back to a styled gradient stand-in so layout never breaks.
 */
export default function ImagePlaceholder({
  label,
  src,
  alt,
  aspect = "aspect-[4/5]",
  className = "",
  tone = "navy",
  animated = true,
  priority = false,
  compact = false,
}: {
  label: string;
  src?: string;
  alt?: string;
  aspect?: string;
  className?: string;
  tone?: "navy" | "cream";
  animated?: boolean;
  priority?: boolean;
  /** Skip the decorative inset frame/shine — for small uses like avatars. */
  compact?: boolean;
}) {
  const [errored, setErrored] = useState(false);
  const isRemoteSrc = typeof src === "string" && /^(https?:)?\/\//i.test(src);
  const shouldUseImage = Boolean(src && !isRemoteSrc);
  const showFallback = !shouldUseImage || errored;

  const gradient =
    tone === "navy"
      ? "bg-[linear-gradient(120deg,#05060f_0%,#1a2350_30%,#33417f_55%,#0a0e27_80%,#111736_100%)]"
      : "bg-[linear-gradient(120deg,#f3efe4_0%,#e9e2d1_35%,#d9bc7b_60%,#f3efe4_100%)]";

  const textColor = tone === "navy" ? "text-cream-100/70" : "text-navy-900/60";
  const borderColor = tone === "navy" ? "border-gold-400/30" : "border-navy-900/15";

  return (
    <div
      className={`group/img relative ${aspect} w-full overflow-hidden rounded-2xl ${
        showFallback ? `${gradient} ${animated ? "animate-gradient-pan" : ""}` : "bg-navy-900"
      } ${className}`}
    >
      {!showFallback && (
        <img
          src={src as string}
          alt={alt ?? label}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover/img:scale-105"
          loading={priority ? "eager" : "lazy"}
          onError={() => setErrored(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      )}

      {!showFallback && (
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/70 via-navy-950/0 to-navy-950/10" />
      )}

      {!compact && (
        <>
          <div className="bg-noise absolute inset-0 opacity-[0.06] mix-blend-overlay" aria-hidden />
          <div
            className="absolute -left-1/3 top-0 h-full w-1/3 -skew-x-12 bg-white/10 opacity-0 transition-opacity duration-500 group-hover/img:opacity-100"
            aria-hidden
          />
          <div
            className={`absolute inset-3 rounded-xl border transition-colors duration-500 ${
              showFallback ? borderColor : "border-gold-400/20"
            } group-hover/img:border-gold-400/60`}
            aria-hidden
          />
        </>
      )}

      {showFallback && !compact && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center transition-transform duration-500 group-hover/img:scale-[1.03]">
          <span className={`font-serif text-sm italic ${textColor}`}>
            {label}
          </span>
          <span
            className={`text-[10px] font-medium uppercase tracking-[0.25em] ${textColor}`}
          >
            Photography Placeholder
          </span>
        </div>
      )}
    </div>
  );
}

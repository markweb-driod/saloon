const BADGES = [
  {
    label: "PCI Certified",
    icon: (
      <path d="M12 2 4 5v6c0 5.25 3.4 9.74 8 11 4.6-1.26 8-5.75 8-11V5l-8-3Zm0 2.2 6 2.25v4.55c0 4.2-2.7 7.9-6 8.95-3.3-1.05-6-4.75-6-8.95V6.45l6-2.25Z" />
    ),
  },
  {
    label: "SSL Secured",
    icon: (
      <path d="M12 1a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-5-5Zm0 2a3 3 0 0 1 3 3v3H9V6a3 3 0 0 1 3-3Zm0 10a1.75 1.75 0 0 1 1 3.2V18a1 1 0 1 1-2 0v-1.8A1.75 1.75 0 0 1 12 13Z" />
    ),
  },
  {
    label: "GDPR Compliant",
    icon: (
      <path d="m9.55 17.65-4.2-4.2 1.4-1.42 2.8 2.78 6.7-6.7 1.4 1.42-8.1 8.12ZM12 2 4 5v6c0 5.25 3.4 9.74 8 11 4.6-1.26 8-5.75 8-11V5l-8-3Z" />
    ),
  },
  {
    label: "Fast EU Shipping",
    icon: (
      <path d="M3 6a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v3h2.5a1 1 0 0 1 .87.5l2 3.46A1 1 0 0 1 20 13.5V17a1 1 0 0 1-1 1h-1a2.5 2.5 0 0 1-5 0H10a2.5 2.5 0 0 1-5 0H4a1 1 0 0 1-1-1Zm14 9.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm-9.5 0a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM14 8v3h2.94l-1.5-2.6A.5.5 0 0 0 15 8Z" />
    ),
  },
];

export default function TrustBadges({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const border = tone === "dark" ? "border-white/10 bg-white/8" : "border-navy-900/10 bg-white";
  const text = tone === "dark" ? "text-cream-100/85" : "text-navy-900/80";
  const iconColor = tone === "dark" ? "fill-gold-400" : "fill-gold-600";

  return (
    <div className="flex flex-wrap gap-3">
      {BADGES.map((badge) => (
        <div
          key={badge.label}
          className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium ${border} ${text}`}
        >
          <svg viewBox="0 0 24 24" className={`h-4 w-4 shrink-0 ${iconColor}`} aria-hidden>
            {badge.icon}
          </svg>
          {badge.label}
        </div>
      ))}
    </div>
  );
}

import NavIcon from "@/components/dashboard/NavIcon";

export type Trend = { value: number; positive: boolean } | null;

export default function StatCard({
  label,
  value,
  icon,
  trend,
  tone = "default",
  caption,
}: {
  label: string;
  value: string;
  icon: string;
  trend?: Trend;
  tone?: "default" | "gold";
  caption?: string;
}) {
  const isGold = tone === "gold";
  return (
    <div
      className={`rounded-xl border p-3.5 transition-all duration-300 hover:-translate-y-0.5 ${
        isGold
          ? "border-gold-500 bg-gold-500 text-navy-950 shadow-[0_16px_40px_-20px_rgba(201,162,75,0.6)]"
          : "border-navy-900/10 bg-white/70 text-navy-950 hover:border-gold-500/40"
      }`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
            isGold ? "bg-navy-950/10 text-navy-950" : "bg-navy-900/5 text-navy-700"
          }`}
        >
          <NavIcon name={icon} className="h-4 w-4" />
        </span>
        {trend && (
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
              trend.positive
                ? isGold
                  ? "bg-navy-950/10 text-navy-950"
                  : "bg-emerald-100 text-emerald-700"
                : isGold
                  ? "bg-navy-950/10 text-navy-950"
                  : "bg-red-100 text-red-700"
            }`}
          >
            {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <p
        className={`mt-2.5 text-[11px] font-medium uppercase tracking-[0.1em] ${
          isGold ? "text-navy-950/70" : "text-gold-600"
        }`}
      >
        {label}
      </p>
      <p className="mt-0.5 font-serif text-2xl font-semibold">{value}</p>
      {caption && (
        <p className={`mt-0.5 text-[11px] ${isGold ? "text-navy-950/60" : "text-slate-400"}`}>{caption}</p>
      )}
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-gold-300/40 text-gold-600",
  CONFIRMED: "bg-navy-900/10 text-navy-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  PAID: "bg-emerald-100 text-emerald-700",
  FULFILLED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-slate-200 text-slate-600",
  NO_SHOW: "bg-red-100 text-red-700",
  REFUNDED: "bg-red-100 text-red-700",
  PARTIALLY_REFUNDED: "bg-amber-100 text-amber-700",
};

const DEFAULT_STYLE = "bg-slate-100 text-slate-600";

export default function Badge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? DEFAULT_STYLE;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide ${style}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

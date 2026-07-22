import { endOfDay, parseISO, startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireRoleSession } from "@/lib/session";
import ReportDatePicker from "@/components/ReportDatePicker";
import RefundButton from "@/components/RefundButton";
import RangeReports from "@/components/RangeReports";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import StatCard from "@/components/dashboard/StatCard";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function todayISODate(): string {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  await requireRoleSession("ADMIN");
  const { date: dateParam } = await searchParams;
  const date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : todayISODate();
  const day = parseISO(date);

  const transactions = await prisma.transaction.findMany({
    where: { createdAt: { gte: startOfDay(day), lte: endOfDay(day) } },
    include: {
      staff: { include: { user: { select: { name: true } } } },
      lineItems: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const grossSales = round2(transactions.reduce((sum, t) => sum + Number(t.total), 0));
  const totalRefunded = round2(transactions.reduce((sum, t) => sum + Number(t.refundedAmount), 0));
  const netRevenue = round2(grossSales - totalRefunded);
  const totalTax = round2(transactions.reduce((sum, t) => sum + Number(t.tax), 0));
  const totalTips = round2(transactions.reduce((sum, t) => sum + Number(t.tip), 0));

  const cashCollected = round2(
    transactions.reduce((sum, t) => {
      if (t.paymentMethod === "CASH") return sum + Number(t.total);
      if (t.paymentMethod === "SPLIT") return sum + Number(t.splitCashAmount ?? 0);
      return sum;
    }, 0)
  );
  const cardCollected = round2(
    transactions.reduce((sum, t) => {
      if (t.paymentMethod === "CARD") return sum + Number(t.total);
      if (t.paymentMethod === "SPLIT") return sum + Number(t.splitCardAmount ?? 0);
      return sum;
    }, 0)
  );

  const byStaff = new Map<
    string,
    { name: string; commissionRate: number; count: number; subtotal: number; tip: number }
  >();
  const staffRates = await prisma.staff.findMany({ select: { id: true, commissionRate: true } });
  const rateById = new Map(staffRates.map((s) => [s.id, Number(s.commissionRate)]));

  for (const t of transactions) {
    const key = t.staffId;
    const existing = byStaff.get(key) ?? {
      name: t.staff.user.name,
      commissionRate: rateById.get(key) ?? 0,
      count: 0,
      subtotal: 0,
      tip: 0,
    };
    existing.count += 1;
    existing.subtotal = round2(existing.subtotal + Number(t.subtotal));
    existing.tip = round2(existing.tip + Number(t.tip));
    byStaff.set(key, existing);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-xl font-semibold tracking-tight text-navy-950 sm:text-2xl">
          End-of-day reconciliation
        </h1>
        <ReportDatePicker date={date} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Gross sales" value={`$${grossSales.toFixed(2)}`} icon="pos" />
        <StatCard label="Refunded" value={`$${totalRefunded.toFixed(2)}`} icon="orders" />
        <StatCard label="Net revenue" value={`$${netRevenue.toFixed(2)}`} icon="pos" tone="gold" />
        <StatCard label="Transactions" value={String(transactions.length)} icon="reports" />
        <StatCard label="Tax collected" value={`$${totalTax.toFixed(2)}`} icon="content" />
        <StatCard label="Tips collected" value={`$${totalTips.toFixed(2)}`} icon="promotions" />
        <StatCard label="Cash collected" value={`$${cashCollected.toFixed(2)}`} icon="pos" />
        <StatCard label="Card collected" value={`$${cardCollected.toFixed(2)}`} icon="pos" />
      </div>

      <section className="mt-6">
        <h2 className="font-serif text-base font-semibold text-navy-950">Stylist commissions</h2>
        {byStaff.size === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No transactions this day.</p>
        ) : (
          <Card flat className="mt-3 overflow-x-auto p-0!">
            <table className="w-full text-sm">
              <thead className="border-b border-navy-900/10 text-left text-xs font-medium uppercase tracking-[0.1em] text-gold-600">
                <tr>
                  <th className="px-5 py-3">Stylist</th>
                  <th className="px-5 py-3">Sales</th>
                  <th className="px-5 py-3">Subtotal</th>
                  <th className="px-5 py-3">Tips</th>
                  <th className="px-5 py-3">Commission owed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-900/10">
                {[...byStaff.values()].map((s) => (
                  <tr key={s.name}>
                    <td className="px-5 py-3 font-medium text-navy-950">{s.name}</td>
                    <td className="px-5 py-3 text-slate-600">{s.count}</td>
                    <td className="px-5 py-3 text-slate-600">${s.subtotal.toFixed(2)}</td>
                    <td className="px-5 py-3 text-slate-600">${s.tip.toFixed(2)}</td>
                    <td className="px-5 py-3 font-medium text-gold-600">
                      ${round2((s.subtotal * s.commissionRate) / 100).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </section>

      <section className="mt-6">
        <h2 className="font-serif text-base font-semibold text-navy-950">Transactions</h2>
        {transactions.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No transactions this day.</p>
        ) : (
          <ul className="mt-3 divide-y divide-navy-900/10">
            {transactions.map((t) => {
              const remaining = round2(Number(t.total) - Number(t.refundedAmount));
              return (
                <li key={t.id} className="flex flex-wrap items-center justify-between gap-4 py-4 text-sm">
                  <div>
                    <p className="font-medium text-navy-950">
                      {new Date(t.createdAt).toLocaleTimeString(undefined, {
                        hour: "numeric",
                        minute: "2-digit",
                      })}{" "}
                      &mdash; {t.staff.user.name}
                    </p>
                    <p className="text-slate-500">
                      {t.lineItems.map((li) => li.description).join(", ")} &middot;{" "}
                      {t.paymentMethod}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge status={t.status} />
                    <span className="font-medium text-navy-950">${Number(t.total).toFixed(2)}</span>
                    {["PAID", "PARTIALLY_REFUNDED"].includes(t.status) && remaining > 0 && (
                      <RefundButton transactionId={t.id} remaining={remaining} />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-6">
        <h2 className="font-serif text-base font-semibold text-navy-950">Trends &amp; reports</h2>
        <div className="mt-3">
          <RangeReports />
        </div>
      </section>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

function daysAgoISODate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
}

type RevenueData = {
  totals: {
    grossSales: number;
    refunded: number;
    netRevenue: number;
    tax: number;
    tips: number;
    cashCollected: number;
    cardCollected: number;
    transactions: number;
  };
};

type StaffRow = {
  name: string;
  role: string;
  appointments: number;
  completed: number;
  cancelled: number;
  noShow: number;
  transactions: number;
  revenue: number;
  tips: number;
  commissionOwed: number;
};

type InventoryData = {
  totals: { totalCostValue: number; totalRetailValue: number; lowStockCount: number };
  topSellers: { name: string; unitsSoldInRange: number }[];
};

type AppointmentsData = {
  total: number;
  byStatus: Record<string, number>;
  bySource: Record<string, number>;
  cancellationRate: number;
  noShowRate: number;
};

export default function RangeReports() {
  const [start, setStart] = useState(daysAgoISODate(30));
  const [end, setEnd] = useState(daysAgoISODate(0));
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [inventory, setInventory] = useState<InventoryData | null>(null);
  const [appointments, setAppointments] = useState<AppointmentsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Data-fetching-in-effect pattern (React's documented approach) — not a lint bug.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const qs = `start=${start}&end=${end}`;
    Promise.all([
      fetch(`/api/admin/reports/revenue?${qs}`).then((r) => r.json()),
      fetch(`/api/admin/reports/staff?${qs}`).then((r) => r.json()),
      fetch(`/api/admin/reports/inventory?${qs}`).then((r) => r.json()),
      fetch(`/api/admin/reports/appointments?${qs}`).then((r) => r.json()),
    ])
      .then(([rev, st, inv, appt]) => {
        setRevenue(rev);
        setStaff(st.staff ?? []);
        setInventory(inv);
        setAppointments(appt);
      })
      .finally(() => setLoading(false));
  }, [start, end]);

  const qs = `start=${start}&end=${end}`;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          From
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="rounded-md border border-black/15 bg-transparent px-2 py-1.5 text-sm outline-none focus:border-black/40 dark:border-white/20"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          To
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="rounded-md border border-black/15 bg-transparent px-2 py-1.5 text-sm outline-none focus:border-black/40 dark:border-white/20"
          />
        </label>
      </div>

      {loading && <p className="mt-4 text-sm text-zinc-500">Loading reports&hellip;</p>}

      {!loading && revenue && (
        <section className="mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium">Revenue</h3>
            <a href={`/api/admin/reports/revenue?${qs}&format=csv`} className="text-sm underline">
              Export CSV
            </a>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-4">
            <Stat label="Gross sales" value={`$${revenue.totals.grossSales.toFixed(2)}`} />
            <Stat label="Net revenue" value={`$${revenue.totals.netRevenue.toFixed(2)}`} />
            <Stat label="Tips" value={`$${revenue.totals.tips.toFixed(2)}`} />
            <Stat label="Transactions" value={String(revenue.totals.transactions)} />
          </div>
        </section>
      )}

      {!loading && staff.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium">Staff performance</h3>
            <a href={`/api/admin/reports/staff?${qs}&format=csv`} className="text-sm underline">
              Export CSV
            </a>
          </div>
          <table className="mt-3 w-full text-sm">
            <thead className="text-left text-zinc-500">
              <tr>
                <th className="pb-2">Name</th>
                <th className="pb-2">Appts</th>
                <th className="pb-2">Completed</th>
                <th className="pb-2">Cancelled</th>
                <th className="pb-2">No-show</th>
                <th className="pb-2">Revenue</th>
                <th className="pb-2">Commission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10 dark:divide-white/10">
              {staff.map((s) => (
                <tr key={s.name}>
                  <td className="py-2">{s.name}</td>
                  <td className="py-2">{s.appointments}</td>
                  <td className="py-2">{s.completed}</td>
                  <td className="py-2">{s.cancelled}</td>
                  <td className="py-2">{s.noShow}</td>
                  <td className="py-2">${s.revenue.toFixed(2)}</td>
                  <td className="py-2">${s.commissionOwed.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {!loading && inventory && (
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium">Inventory</h3>
            <a href={`/api/admin/reports/inventory?${qs}&format=csv`} className="text-sm underline">
              Export CSV
            </a>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Stat label="Retail value on hand" value={`$${inventory.totals.totalRetailValue.toFixed(2)}`} />
            <Stat label="Cost value on hand" value={`$${inventory.totals.totalCostValue.toFixed(2)}`} />
            <Stat label="Low stock items" value={String(inventory.totals.lowStockCount)} />
          </div>
          {inventory.topSellers.length > 0 && (
            <div className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              Top sellers:{" "}
              {inventory.topSellers.map((p) => `${p.name} (${p.unitsSoldInRange})`).join(", ")}
            </div>
          )}
        </section>
      )}

      {!loading && appointments && (
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium">Appointment volume</h3>
            <a href={`/api/admin/reports/appointments?${qs}&format=csv`} className="text-sm underline">
              Export CSV
            </a>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-4">
            <Stat label="Total bookings" value={String(appointments.total)} />
            <Stat label="Completed" value={String(appointments.byStatus.COMPLETED ?? 0)} />
            <Stat label="Cancellation rate" value={`${appointments.cancellationRate}%`} />
            <Stat label="No-show rate" value={`${appointments.noShowRate}%`} />
          </div>
          <div className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            By source: Online {appointments.bySource.ONLINE ?? 0} &middot; Walk-in{" "}
            {appointments.bySource.WALK_IN ?? 0} &middot; Phone {appointments.bySource.PHONE ?? 0}
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

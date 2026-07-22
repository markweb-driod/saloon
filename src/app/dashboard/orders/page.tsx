import { prisma } from "@/lib/prisma";
import { requireRoleSession } from "@/lib/session";
import OrderManager from "@/components/OrderManager";
import StatCard from "@/components/dashboard/StatCard";
import LineChart from "@/components/dashboard/LineChart";
import Card from "@/components/ui/Card";

function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default async function DashboardOrdersPage() {
  await requireRoleSession("RECEPTIONIST", "ADMIN");

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(startOfToday);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const orders = await prisma.order.findMany({
    include: {
      customer: { include: { user: { select: { name: true, email: true } } } },
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const ordersToday = orders.filter((o) => o.createdAt >= startOfToday).length;
  const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0);
  const pendingCount = orders.filter((o) => o.status === "PENDING" || o.status === "PAID").length;
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

  const revenueByDay = new Map<string, number>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    revenueByDay.set(dayKey(d), 0);
  }
  for (const o of orders) {
    if (o.createdAt < sevenDaysAgo) continue;
    const key = dayKey(o.createdAt);
    if (revenueByDay.has(key)) {
      revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + Number(o.total));
    }
  }
  const revenueChartData = [...revenueByDay.entries()].map(([key, value]) => {
    const [y, m, d] = key.split("-").map(Number);
    return { label: new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "short" }), value };
  });

  return (
    <div>
      <h1 className="font-serif text-xl font-semibold tracking-tight text-navy-950 sm:text-2xl">
        Orders
      </h1>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Orders today" value={String(ordersToday)} icon="orders" />
        <StatCard label="Total revenue" value={`$${totalRevenue.toFixed(2)}`} icon="pos" tone="gold" />
        <StatCard label="Awaiting fulfillment" value={String(pendingCount)} icon="calendar" />
        <StatCard label="Avg. order value" value={`$${avgOrderValue.toFixed(2)}`} icon="reports" />
      </div>

      <Card flat className="mt-6 p-4!">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-navy-950">Revenue &mdash; last 7 days</p>
          <p className="text-xs text-slate-400">
            Total ${revenueChartData.reduce((s, d) => s + d.value, 0).toFixed(2)}
          </p>
        </div>
        <div className="mt-4">
          <LineChart data={revenueChartData} id="orders-revenue" />
        </div>
      </Card>

      <div className="mt-6">
        <OrderManager
          orders={orders.map((o) => ({
            id: o.id,
            status: o.status,
            total: o.total.toString(),
            placedAt: o.createdAt.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              timeZone: "UTC",
            }),
            customerName: o.customer.user.name,
            customerEmail: o.customer.user.email,
            items: o.items.map((i) => ({
              productName: i.productName,
              quantity: i.quantity,
              lineTotal: i.lineTotal.toString(),
            })),
          }))}
        />
      </div>
    </div>
  );
}

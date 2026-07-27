import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRoleSession } from "@/lib/session";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import NavIcon from "@/components/dashboard/NavIcon";
import StatCard, { type Trend } from "@/components/dashboard/StatCard";
import LineChart from "@/components/dashboard/LineChart";
import DonutChart from "@/components/dashboard/DonutChart";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#e8d5aa",
  CONFIRMED: "#33417f",
  COMPLETED: "#34a875",
  CANCELLED: "#9aa1b5",
  NO_SHOW: "#d9534f",
};

function computeTrend(current: number, previous: number): Trend {
  if (previous === 0) return current > 0 ? { value: 100, positive: true } : null;
  const pct = Math.round(((current - previous) / previous) * 100);
  return { value: pct, positive: pct >= 0 };
}

function dayKey(d: Date): string {
  // Local calendar day, matching the local-time boundaries used elsewhere
  // on this page — toISOString() (UTC) would drift into a different bucket
  // near midnight depending on server timezone.
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default async function DashboardOverviewPage() {
  const session = await requireRoleSession("STYLIST", "RECEPTIONIST", "ADMIN");
  const isStaffOnly = session.role === "STYLIST";
  const canSeeSales = session.role === "RECEPTIONIST" || session.role === "ADMIN";
  const isAdmin = session.role === "ADMIN";

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const endOfYesterday = new Date(endOfToday);
  endOfYesterday.setDate(endOfYesterday.getDate() - 1);
  const sevenDaysAgo = new Date(startOfToday);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const staff = await prisma.staff.findUnique({ where: { userId: session.sub } });
  const staffFilter = isStaffOnly && staff ? { staffId: staff.id } : {};

  const [
    todaysAppointments,
    yesterdaysAppointments,
    recentAppointments,
    weekAppointments,
    lowStockCount,
    todaysRevenueAgg,
    yesterdaysRevenueAgg,
    weekTransactions,
    newMessages,
    activePromos,
  ] = await Promise.all([
    prisma.appointment.count({ where: { startTime: { gte: startOfToday, lte: endOfToday }, ...staffFilter } }),
    prisma.appointment.count({ where: { startTime: { gte: startOfYesterday, lte: endOfYesterday }, ...staffFilter } }),
    prisma.appointment.findMany({
      where: { startTime: { gte: startOfToday, lte: endOfToday }, ...staffFilter },
      include: {
        customer: { include: { user: { select: { name: true } } } },
        staff: { include: { user: { select: { name: true } } } },
        services: { include: { service: { select: { name: true } } } },
      },
      orderBy: { startTime: "asc" },
      take: 6,
    }),
    prisma.appointment.findMany({
      where: { startTime: { gte: sevenDaysAgo, lte: endOfToday }, ...staffFilter },
      select: { status: true },
    }),
    canSeeSales
      ? prisma.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*) as count FROM Product WHERE stockQuantity <= reorderThreshold`
      : Promise.resolve([{ count: BigInt(0) }]),
    canSeeSales
      ? prisma.transaction.aggregate({
          where: { createdAt: { gte: startOfToday, lte: endOfToday }, status: { in: ["PAID", "PARTIALLY_REFUNDED"] } },
          _sum: { total: true },
        })
      : Promise.resolve({ _sum: { total: null } }),
    canSeeSales
      ? prisma.transaction.aggregate({
          where: { createdAt: { gte: startOfYesterday, lte: endOfYesterday }, status: { in: ["PAID", "PARTIALLY_REFUNDED"] } },
          _sum: { total: true },
        })
      : Promise.resolve({ _sum: { total: null } }),
    canSeeSales
      ? prisma.transaction.findMany({
          where: { createdAt: { gte: sevenDaysAgo, lte: endOfToday }, status: { in: ["PAID", "PARTIALLY_REFUNDED"] } },
          select: { createdAt: true, total: true },
        })
      : Promise.resolve([]),
    canSeeSales ? prisma.contactMessage.count({ where: { status: "NEW" } }) : Promise.resolve(0),
    isAdmin ? prisma.promoCode.count({ where: { active: true } }) : Promise.resolve(0),
  ]);

  const todaysRevenue = Number(todaysRevenueAgg._sum.total ?? 0);
  const yesterdaysRevenue = Number(yesterdaysRevenueAgg._sum.total ?? 0);

  const revenueByDay = new Map<string, number>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    revenueByDay.set(dayKey(d), 0);
  }
  for (const t of weekTransactions) {
    const key = dayKey(t.createdAt);
    revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + Number(t.total));
  }
  const revenueChartData = [...revenueByDay.entries()].map(([key, value]) => {
    const [y, m, d] = key.split("-").map(Number);
    return {
      label: new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "short" }),
      value,
    };
  });

  const statusCounts = weekAppointments.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    return acc;
  }, {});
  const donutSegments = Object.entries(statusCounts).map(([status, value]) => ({
    label: status,
    value,
    color: STATUS_COLORS[status] ?? "#9aa1b5",
  }));

  const stats: {
    label: string;
    value: string;
    icon: string;
    trend?: Trend;
    caption?: string;
    tone?: "default" | "gold";
  }[] = [
    {
      label: isStaffOnly ? "Your appointments today" : "Appointments today",
      value: String(todaysAppointments),
      icon: "calendar",
      trend: computeTrend(todaysAppointments, yesterdaysAppointments),
      caption: "vs yesterday",
      tone: isStaffOnly ? "gold" : "default",
    },
    ...(canSeeSales
      ? ([
          {
            label: "Today's revenue",
            value: `$${todaysRevenue.toFixed(2)}`,
            icon: "pos",
            trend: computeTrend(todaysRevenue, yesterdaysRevenue),
            caption: "vs yesterday",
            tone: "gold" as const,
          },
          { label: "Low stock products", value: String(Number(lowStockCount[0]?.count ?? 0)), icon: "inventory" },
          { label: "New messages", value: String(newMessages), icon: "messages" },
        ])
      : []),
    ...(isAdmin ? [{ label: "Active promotions", value: String(activePromos), icon: "promotions" }] : []),
  ];

  const quickActions = [
    { label: "New appointment", href: "/dashboard/calendar", icon: "calendar", show: true },
    { label: "New sale", href: "/dashboard/pos", icon: "pos", show: canSeeSales },
    { label: "Add product", href: "/dashboard/inventory", icon: "inventory", show: isAdmin },
    { label: "Create promo", href: "/dashboard/promotions", icon: "promotions", show: isAdmin },
  ].filter((a) => a.show);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl font-semibold text-navy-950">
            Welcome back, {session.name.split(" ")[0]}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {quickActions.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
            Quick actions
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2.5">
            {quickActions.map((action) => (
              <LinkButton
                key={action.href}
                href={action.href}
                variant="outline"
                className="gap-2 px-4 py-2 text-sm"
              >
                <NavIcon name={action.icon} className="h-4 w-4" />
                {action.label}
              </LinkButton>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {canSeeSales && (
          <Card flat className="p-4!">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-navy-950">Revenue &mdash; last 7 days</p>
              <p className="text-xs text-slate-400">
                Total ${revenueChartData.reduce((s, d) => s + d.value, 0).toFixed(2)}
              </p>
            </div>
            <div className="mt-4">
              <LineChart data={revenueChartData} id="revenue" />
            </div>
          </Card>
        )}

        <Card flat className="p-4!">
          <p className="text-sm font-semibold text-navy-950">
            {isStaffOnly ? "Your appointments" : "Appointments"} &mdash; last 7 days
          </p>
          {donutSegments.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">No appointments in this range yet.</p>
          ) : (
            <div className="mt-4 flex items-center gap-6">
              <DonutChart segments={donutSegments} />
              <ul className="flex-1 space-y-1.5 text-sm">
                {donutSegments.map((seg) => (
                  <li key={seg.label} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-slate-600">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: seg.color }}
                        aria-hidden
                      />
                      {seg.label.replace("_", " ")}
                    </span>
                    <span className="font-medium text-navy-950">{seg.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
            {isStaffOnly ? "Your schedule today" : "Today's appointments"}
          </p>
          <Link
            href="/dashboard/calendar"
            className="text-sm font-medium text-gold-600 transition-colors hover:text-gold-500"
          >
            View calendar &rarr;
          </Link>
        </div>

        {recentAppointments.length === 0 ? (
          <Card flat className="mt-3 p-4! text-sm text-slate-500">
            Nothing on the books for today yet.
          </Card>
        ) : (
          <ul className="mt-3 space-y-2">
            {recentAppointments.map((appt) => (
              <Card key={appt.id} as="li" flat className="p-4!">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-navy-950">
                      {new Date(appt.startTime).toLocaleTimeString(undefined, {
                        hour: "numeric",
                        minute: "2-digit",
                      })}{" "}
                      &mdash; {appt.customer.user.name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {appt.services.map((s) => s.service.name).join(", ")}
                      {!isStaffOnly && <> with {appt.staff.user.name}</>}
                    </p>
                  </div>
                  <Badge status={appt.status} />
                </div>
              </Card>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

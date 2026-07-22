import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { endOfDay, parseISO, startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { toCsv, csvResponse } from "@/lib/csv";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

const querySchema = z.object({
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  format: z.enum(["json", "csv"]).default("json"),
});

export async function GET(req: NextRequest) {
  const { response } = await requireRole("ADMIN");
  if (response) return response;

  const parsed = querySchema.safeParse({
    start: req.nextUrl.searchParams.get("start"),
    end: req.nextUrl.searchParams.get("end"),
    format: req.nextUrl.searchParams.get("format") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }
  const { start, end, format } = parsed.data;
  const range = { gte: startOfDay(parseISO(start)), lte: endOfDay(parseISO(end)) };

  const staff = await prisma.staff.findMany({
    include: { user: { select: { name: true, role: true } } },
    orderBy: { user: { name: "asc" } },
  });

  const [transactions, appointments] = await Promise.all([
    prisma.transaction.findMany({ where: { createdAt: range } }),
    prisma.appointment.findMany({ where: { startTime: range } }),
  ]);

  const rows = staff.map((s) => {
    const staffTxns = transactions.filter((t) => t.staffId === s.id);
    const staffAppts = appointments.filter((a) => a.staffId === s.id);

    const subtotal = round2(staffTxns.reduce((sum, t) => sum + Number(t.subtotal), 0));
    const tips = round2(staffTxns.reduce((sum, t) => sum + Number(t.tip), 0));
    const commissionOwed = round2((subtotal * Number(s.commissionRate)) / 100);

    return {
      name: s.user.name,
      role: s.user.role,
      appointments: staffAppts.length,
      completed: staffAppts.filter((a) => a.status === "COMPLETED").length,
      cancelled: staffAppts.filter((a) => a.status === "CANCELLED").length,
      noShow: staffAppts.filter((a) => a.status === "NO_SHOW").length,
      transactions: staffTxns.length,
      revenue: subtotal,
      tips,
      commissionOwed,
    };
  });

  if (format === "csv") {
    return csvResponse(
      `staff-performance-${start}-to-${end}.csv`,
      toCsv(
        rows.map((r) => ({
          name: r.name,
          role: r.role,
          appointments: r.appointments,
          completed: r.completed,
          cancelled: r.cancelled,
          noShow: r.noShow,
          transactions: r.transactions,
          revenue: r.revenue,
          tips: r.tips,
          commissionOwed: r.commissionOwed,
        }))
      )
    );
  }

  return NextResponse.json({ staff: rows });
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { endOfDay, formatISO, parseISO, startOfDay } from "date-fns";
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

  const appointments = await prisma.appointment.findMany({
    where: { startTime: { gte: startOfDay(parseISO(start)), lte: endOfDay(parseISO(end)) } },
    select: { startTime: true, status: true, source: true },
  });

  const total = appointments.length;
  const byStatus = {
    PENDING: 0,
    CONFIRMED: 0,
    COMPLETED: 0,
    CANCELLED: 0,
    NO_SHOW: 0,
  };
  const bySource = { ONLINE: 0, WALK_IN: 0, PHONE: 0 };
  const byDay = new Map<string, number>();

  for (const a of appointments) {
    byStatus[a.status] += 1;
    bySource[a.source] += 1;
    const day = formatISO(a.startTime, { representation: "date" });
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
  }

  const daily = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, appointments: count }));

  const cancellationRate = total > 0 ? round2((byStatus.CANCELLED / total) * 100) : 0;
  const noShowRate = total > 0 ? round2((byStatus.NO_SHOW / total) * 100) : 0;

  if (format === "csv") {
    return csvResponse(`appointments-${start}-to-${end}.csv`, toCsv(daily));
  }

  return NextResponse.json({
    total,
    byStatus,
    bySource,
    cancellationRate,
    noShowRate,
    daily,
  });
}

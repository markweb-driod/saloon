import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { endOfDay, parseISO, startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getAvailableSlots, parseWorkingHours } from "@/lib/availability";

const querySchema = z.object({
  staffId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  durationMinutes: z.coerce.number().int().positive().max(8 * 60),
});

export async function GET(req: NextRequest) {
  const parsed = querySchema.safeParse({
    staffId: req.nextUrl.searchParams.get("staffId"),
    date: req.nextUrl.searchParams.get("date"),
    durationMinutes: req.nextUrl.searchParams.get("durationMinutes"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }
  const { staffId, date, durationMinutes } = parsed.data;

  const staff = await prisma.staff.findUnique({ where: { id: staffId } });
  if (!staff) {
    return NextResponse.json({ error: "Stylist not found" }, { status: 404 });
  }

  const day = parseISO(date);
  const appointments = await prisma.appointment.findMany({
    where: {
      staffId,
      status: { not: "CANCELLED" },
      startTime: { gte: startOfDay(day), lte: endOfDay(day) },
    },
    select: { startTime: true, endTime: true },
  });

  const slots = getAvailableSlots({
    date: day,
    workingHours: parseWorkingHours(staff.workingHours),
    serviceDurationMinutes: durationMinutes,
    busyIntervals: appointments.map((a) => ({ start: a.startTime, end: a.endTime })),
  });

  return NextResponse.json({ slots: slots.map((s) => s.toISOString()) });
}

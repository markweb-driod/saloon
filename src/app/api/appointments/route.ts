import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addMinutes, endOfDay, parseISO, startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const createSchema = z.object({
  staffId: z.string().min(1),
  serviceIds: z.array(z.string().min(1)).min(1),
  startTime: z.string().datetime(),
  notes: z.string().max(2000).optional(),
  customerEmail: z.string().email().optional(),
  source: z.enum(["WALK_IN", "PHONE"]).optional(),
});

const STAFF_ROLES = ["RECEPTIONIST", "ADMIN"] as const;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "CUSTOMER" && !STAFF_ROLES.includes(session.role as never)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { staffId, serviceIds, notes } = parsed.data;
  const startTime = new Date(parsed.data.startTime);

  let customerId: string;
  let source: "ONLINE" | "WALK_IN" | "PHONE";

  if (session.role === "CUSTOMER") {
    const customer = await prisma.customer.findUnique({ where: { userId: session.sub } });
    if (!customer) {
      return NextResponse.json({ error: "Customer profile not found" }, { status: 404 });
    }
    customerId = customer.id;
    source = "ONLINE";
  } else {
    if (!parsed.data.customerEmail) {
      return NextResponse.json(
        { error: "customerEmail is required for staff-initiated bookings" },
        { status: 400 }
      );
    }
    const customerUser = await prisma.user.findUnique({
      where: { email: parsed.data.customerEmail },
      include: { customer: true },
    });
    if (!customerUser?.customer) {
      return NextResponse.json(
        { error: "No customer account found with that email" },
        { status: 404 }
      );
    }
    customerId = customerUser.customer.id;
    source = parsed.data.source ?? "WALK_IN";
  }

  if (startTime < new Date()) {
    return NextResponse.json({ error: "Start time must be in the future" }, { status: 400 });
  }

  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    include: { user: { select: { role: true } } },
  });
  if (!staff || staff.user.role !== "STYLIST") {
    return NextResponse.json({ error: "Stylist not found" }, { status: 404 });
  }

  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds }, active: true },
  });
  if (services.length !== serviceIds.length) {
    return NextResponse.json({ error: "One or more services are invalid" }, { status: 400 });
  }

  const totalDuration = services.reduce((sum, s) => sum + s.durationMinutes, 0);
  const endTime = addMinutes(startTime, totalDuration);

  try {
    const appointment = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT id FROM staff WHERE id = ${staffId} FOR UPDATE`;

      const overlap = await tx.appointment.findFirst({
        where: {
          staffId,
          status: { not: "CANCELLED" },
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
      });
      if (overlap) {
        throw new Error("SLOT_TAKEN");
      }

      return tx.appointment.create({
        data: {
          customerId,
          staffId,
          startTime,
          endTime,
          source,
          notes,
          status: source === "ONLINE" ? "PENDING" : "CONFIRMED",
          services: {
            create: serviceIds.map((serviceId) => ({ serviceId })),
          },
        },
        include: { services: { include: { service: true } } },
      });
    });

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "SLOT_TAKEN") {
      return NextResponse.json(
        { error: "That time slot was just booked. Please pick another." },
        { status: 409 }
      );
    }
    throw err;
  }
}

const listQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  staffId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role === "CUSTOMER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = listQuerySchema.safeParse({
    date: req.nextUrl.searchParams.get("date"),
    staffId: req.nextUrl.searchParams.get("staffId") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }
  const { date, staffId } = parsed.data;
  const day = parseISO(date);

  let effectiveStaffId = staffId;
  if (session.role === "STYLIST") {
    const staff = await prisma.staff.findUnique({ where: { userId: session.sub } });
    effectiveStaffId = staff?.id;
  }

  const appointments = await prisma.appointment.findMany({
    where: {
      startTime: { gte: startOfDay(day), lte: endOfDay(day) },
      ...(effectiveStaffId ? { staffId: effectiveStaffId } : {}),
    },
    include: {
      customer: { include: { user: { select: { name: true, phone: true } } } },
      staff: { include: { user: { select: { name: true } } } },
      services: { include: { service: true } },
      transaction: { select: { id: true } },
    },
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json({ appointments });
}

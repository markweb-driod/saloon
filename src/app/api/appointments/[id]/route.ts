import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { differenceInMinutes, addMinutes } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const patchSchema = z.object({
  status: z.enum(["CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"]).optional(),
  startTime: z.string().datetime().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  if (!parsed.data.status && !parsed.data.startTime) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: { customer: true, staff: true },
  });
  if (!appointment) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }

  if (parsed.data.status) {
    const allowed = await canSetStatus(session, appointment, parsed.data.status);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  if (parsed.data.startTime && !["RECEPTIONIST", "ADMIN"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (parsed.data.startTime) {
    const newStart = new Date(parsed.data.startTime);
    const durationMinutes = differenceInMinutes(appointment.endTime, appointment.startTime);
    const newEnd = addMinutes(newStart, durationMinutes);

    try {
      const updated = await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT id FROM staff WHERE id = ${appointment.staffId} FOR UPDATE`;

        const overlap = await tx.appointment.findFirst({
          where: {
            id: { not: id },
            staffId: appointment.staffId,
            status: { not: "CANCELLED" },
            startTime: { lt: newEnd },
            endTime: { gt: newStart },
          },
        });
        if (overlap) throw new Error("SLOT_TAKEN");

        return tx.appointment.update({
          where: { id },
          data: {
            startTime: newStart,
            endTime: newEnd,
            ...(parsed.data.status ? { status: parsed.data.status } : {}),
          },
        });
      });
      return NextResponse.json({ appointment: updated });
    } catch (err) {
      if (err instanceof Error && err.message === "SLOT_TAKEN") {
        return NextResponse.json(
          { error: "That time slot is unavailable. Please pick another." },
          { status: 409 }
        );
      }
      throw err;
    }
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: { status: parsed.data.status },
  });
  return NextResponse.json({ appointment: updated });
}

async function canSetStatus(
  session: { sub: string; role: string },
  appointment: { customerId: string; staffId: string; status: string },
  nextStatus: string
): Promise<boolean> {
  if (session.role === "ADMIN" || session.role === "RECEPTIONIST") {
    return true;
  }

  if (session.role === "CUSTOMER") {
    if (nextStatus !== "CANCELLED") return false;
    if (!["PENDING", "CONFIRMED"].includes(appointment.status)) return false;
    const customer = await prisma.customer.findUnique({ where: { userId: session.sub } });
    return customer?.id === appointment.customerId;
  }

  if (session.role === "STYLIST") {
    if (!["COMPLETED", "NO_SHOW", "CANCELLED"].includes(nextStatus)) return false;
    const staff = await prisma.staff.findUnique({ where: { userId: session.sub } });
    return staff?.id === appointment.staffId;
  }

  return false;
}

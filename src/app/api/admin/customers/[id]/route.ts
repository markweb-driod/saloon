import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

const updateSchema = z.object({
  preferences: z.string().max(2000).optional(),
  allergiesNotes: z.string().max(2000).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireRole("RECEPTIONIST", "ADMIN");
  if (response) return response;

  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      appointments: {
        orderBy: { startTime: "desc" },
        take: 10,
        include: {
          staff: { include: { user: { select: { name: true } } } },
          services: { include: { service: { select: { name: true } } } },
        },
      },
      loyaltyTransactions: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  return NextResponse.json({
    customer: {
      id: customer.id,
      name: customer.user.name,
      email: customer.user.email,
      phone: customer.user.phone,
      loyaltyPointsBalance: customer.loyaltyPointsBalance,
      preferences: customer.preferences,
      allergiesNotes: customer.allergiesNotes,
      appointments: customer.appointments.map((a) => ({
        id: a.id,
        startTime: a.startTime,
        status: a.status,
        staffName: a.staff.user.name,
        services: a.services.map((s) => s.service.name),
      })),
      loyaltyTransactions: customer.loyaltyTransactions,
    },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireRole("RECEPTIONIST", "ADMIN");
  if (response) return response;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const updated = await prisma.customer.update({
    where: { id },
    data: {
      ...(parsed.data.preferences !== undefined ? { preferences: parsed.data.preferences } : {}),
      ...(parsed.data.allergiesNotes !== undefined
        ? { allergiesNotes: parsed.data.allergiesNotes }
        : {}),
    },
  });

  return NextResponse.json({ customer: updated });
}

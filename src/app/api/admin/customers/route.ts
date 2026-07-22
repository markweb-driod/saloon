import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export async function GET() {
  const { response } = await requireRole("RECEPTIONIST", "ADMIN");
  if (response) return response;

  const customers = await prisma.customer.findMany({
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      appointments: {
        orderBy: { startTime: "desc" },
        take: 1,
        select: { startTime: true },
      },
      _count: { select: { appointments: true } },
    },
    orderBy: { user: { name: "asc" } },
  });

  return NextResponse.json({
    customers: customers.map((c) => ({
      id: c.id,
      name: c.user.name,
      email: c.user.email,
      phone: c.user.phone,
      loyaltyPointsBalance: c.loyaltyPointsBalance,
      preferences: c.preferences,
      allergiesNotes: c.allergiesNotes,
      visitCount: c._count.appointments,
      lastVisit: c.appointments[0]?.startTime ?? null,
    })),
  });
}

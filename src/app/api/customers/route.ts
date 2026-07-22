import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  const { response } = await requireRole("RECEPTIONIST", "ADMIN");
  if (response) return response;

  const q = req.nextUrl.searchParams.get("q")?.trim();

  const customers = await prisma.customer.findMany({
    where: q
      ? {
          user: {
            OR: [
              { name: { contains: q } },
              { email: { contains: q } },
              { phone: { contains: q } },
            ],
          },
        }
      : undefined,
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      _count: { select: { appointments: true } },
    },
    orderBy: { user: { name: "asc" } },
    take: 50,
  });

  return NextResponse.json({
    customers: customers.map((c) => ({
      id: c.id,
      user: c.user,
      loyaltyPointsBalance: c.loyaltyPointsBalance,
      visitCount: c._count.appointments,
    })),
  });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export async function GET(
  _req: Request,
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
        take: 20,
        include: {
          services: { include: { service: true } },
          staff: { include: { user: { select: { name: true } } } },
        },
      },
      loyaltyTransactions: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  return NextResponse.json({ customer });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export async function GET() {
  const { response } = await requireRole("RECEPTIONIST", "ADMIN");
  if (response) return response;

  const orders = await prisma.order.findMany({
    include: {
      customer: { include: { user: { select: { name: true, email: true } } } },
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ orders });
}

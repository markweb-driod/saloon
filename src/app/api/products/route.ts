import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export async function GET() {
  const { response } = await requireRole("RECEPTIONIST", "ADMIN");
  if (response) return response;

  const products = await prisma.product.findMany({
    where: { stockQuantity: { gt: 0 } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ products });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const codes = await prisma.promoCode.findMany({
    where: {
      active: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { createdAt: "desc" },
    select: {
      code: true,
      discountType: true,
      discountValue: true,
      expiresAt: true,
      usageLimit: true,
      usedCount: true,
    },
  });

  const available = codes.filter(
    (c) => c.usageLimit === null || c.usedCount < c.usageLimit
  );

  return NextResponse.json({
    promoCodes: available.map((c) => ({
      code: c.code,
      discountType: c.discountType,
      discountValue: Number(c.discountValue),
      expiresAt: c.expiresAt,
    })),
  });
}

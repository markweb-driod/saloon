import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const stylists = await prisma.staff.findMany({
    where: { user: { role: "STYLIST" } },
    include: { user: { select: { name: true } } },
    orderBy: { user: { name: "asc" } },
  });

  return NextResponse.json({
    staff: stylists.map((s) => ({
      id: s.id,
      name: s.user.name,
      specialties: s.specialties,
    })),
  });
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

const adjustSchema = z.object({
  pointsDelta: z.coerce.number().int().refine((n) => n !== 0, "Must not be zero"),
  reason: z.string().min(1).max(200),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireRole("RECEPTIONIST", "ADMIN");
  if (response) return response;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = adjustSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }
  if (customer.loyaltyPointsBalance + parsed.data.pointsDelta < 0) {
    return NextResponse.json({ error: "Resulting balance cannot be negative" }, { status: 400 });
  }

  const [updated] = await prisma.$transaction([
    prisma.customer.update({
      where: { id },
      data: { loyaltyPointsBalance: { increment: parsed.data.pointsDelta } },
    }),
    prisma.loyaltyTransaction.create({
      data: { customerId: id, pointsDelta: parsed.data.pointsDelta, reason: parsed.data.reason },
    }),
  ]);

  return NextResponse.json({ customer: updated });
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

const adjustSchema = z.object({
  pointsDelta: z.coerce.number().int().refine((n) => n !== 0, "Points adjustment cannot be zero"),
  reason: z.string().min(1).max(200),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireRole("RECEPTIONIST", "ADMIN");
  if (response) return response;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = adjustSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const newBalance = customer.loyaltyPointsBalance + parsed.data.pointsDelta;
  if (newBalance < 0) {
    return NextResponse.json({ error: "Adjustment would make balance negative" }, { status: 400 });
  }

  const [, transaction] = await prisma.$transaction([
    prisma.customer.update({
      where: { id },
      data: { loyaltyPointsBalance: newBalance },
    }),
    prisma.loyaltyTransaction.create({
      data: {
        customerId: id,
        pointsDelta: parsed.data.pointsDelta,
        reason: parsed.data.reason,
      },
    }),
  ]);

  return NextResponse.json({ loyaltyPointsBalance: newBalance, transaction });
}

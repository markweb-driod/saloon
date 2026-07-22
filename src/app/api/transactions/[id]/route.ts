import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

const refundSchema = z.object({
  status: z.enum(["REFUNDED", "PARTIALLY_REFUNDED"]),
  refundAmount: z.coerce.number().positive().optional(),
});

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireRole("RECEPTIONIST", "ADMIN");
  if (response) return response;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = refundSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const transaction = await prisma.transaction.findUnique({ where: { id } });
  if (!transaction) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }
  if (!["PAID", "PARTIALLY_REFUNDED"].includes(transaction.status)) {
    return NextResponse.json(
      { error: `Cannot refund a transaction with status ${transaction.status}` },
      { status: 400 }
    );
  }

  const alreadyRefunded = Number(transaction.refundedAmount);
  const remaining = round2(Number(transaction.total) - alreadyRefunded);

  const refundAmount =
    parsed.data.status === "REFUNDED" ? remaining : round2(parsed.data.refundAmount ?? 0);

  if (refundAmount <= 0 || refundAmount > remaining + 0.01) {
    return NextResponse.json(
      { error: `Refund amount must be between 0 and ${remaining}` },
      { status: 400 }
    );
  }

  const newRefundedTotal = round2(alreadyRefunded + refundAmount);
  const isFullyRefunded = newRefundedTotal >= Number(transaction.total) - 0.01;

  const updated = await prisma.transaction.update({
    where: { id },
    data: {
      refundedAmount: newRefundedTotal,
      status: isFullyRefunded ? "REFUNDED" : "PARTIALLY_REFUNDED",
    },
  });

  return NextResponse.json({ transaction: updated });
}

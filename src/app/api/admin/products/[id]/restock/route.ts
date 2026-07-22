import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

const restockSchema = z.object({
  quantityDelta: z.coerce.number().int().refine((n) => n !== 0, "Must not be zero"),
  reason: z.enum(["RESTOCK", "ADJUSTMENT", "DAMAGE"]),
  note: z.string().max(500).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireRole("ADMIN");
  if (response) return response;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = restockSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  if (product.stockQuantity + parsed.data.quantityDelta < 0) {
    return NextResponse.json({ error: "Resulting stock cannot be negative" }, { status: 400 });
  }

  const [updated] = await prisma.$transaction([
    prisma.product.update({
      where: { id },
      data: { stockQuantity: { increment: parsed.data.quantityDelta } },
    }),
    prisma.inventoryMovement.create({
      data: {
        productId: id,
        quantityDelta: parsed.data.quantityDelta,
        reason: parsed.data.reason,
        note: parsed.data.note,
      },
    }),
  ]);

  return NextResponse.json({ product: updated });
}

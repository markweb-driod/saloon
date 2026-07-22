import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const patchSchema = z.object({
  status: z.enum(["PAID", "FULFILLED", "CANCELLED"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const nextStatus = parsed.data.status;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, customer: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (session.role === "CUSTOMER") {
    if (nextStatus !== "CANCELLED" || order.status !== "PENDING") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (order.customer.userId !== session.sub) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (!["RECEPTIONIST", "ADMIN"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (nextStatus === "CANCELLED" && order.status !== "CANCELLED") {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { increment: item.quantity } },
        });
        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            quantityDelta: item.quantity,
            reason: "ADJUSTMENT",
            note: `Order ${order.id} cancelled`,
          },
        });
      }
    }

    return tx.order.update({ where: { id }, data: { status: nextStatus } });
  });

  return NextResponse.json({ order: updated });
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const createSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.coerce.number().int().positive().max(50),
      })
    )
    .min(1),
  notes: z.string().max(1000).optional(),
});

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { items, notes } = parsed.data;

  const customer = await prisma.customer.findUnique({ where: { userId: session.sub } });
  if (!customer) {
    return NextResponse.json({ error: "Customer profile not found" }, { status: 404 });
  }

  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  if (products.length !== new Set(productIds).size) {
    return NextResponse.json({ error: "One or more products are invalid" }, { status: 400 });
  }

  const resolvedItems = items.map((item) => {
    const product = products.find((p) => p.id === item.productId)!;
    return {
      productId: product.id,
      productName: product.name,
      quantity: item.quantity,
      unitPrice: Number(product.unitPrice),
      lineTotal: round2(Number(product.unitPrice) * item.quantity),
    };
  });

  const subtotal = round2(resolvedItems.reduce((sum, l) => sum + l.lineTotal, 0));

  try {
    const order = await prisma.$transaction(async (tx) => {
      for (const item of resolvedItems) {
        await tx.$executeRaw`SELECT id FROM product WHERE id = ${item.productId} FOR UPDATE`;
        const product = await tx.product.findUniqueOrThrow({ where: { id: item.productId } });
        if (product.stockQuantity < item.quantity) {
          throw new Error(`OUT_OF_STOCK:${product.name}`);
        }
      }

      const created = await tx.order.create({
        data: {
          customerId: customer.id,
          subtotal,
          total: subtotal,
          notes,
          status: "PENDING",
          items: {
            create: resolvedItems,
          },
        },
        include: { items: true },
      });

      for (const item of resolvedItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { decrement: item.quantity } },
        });
        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            quantityDelta: -item.quantity,
            reason: "SALE",
            note: `Order ${created.id}`,
          },
        });
      }

      return created;
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("OUT_OF_STOCK:")) {
      return NextResponse.json(
        { error: `Not enough stock for ${err.message.split(":")[1]}` },
        { status: 409 }
      );
    }
    throw err;
  }
}

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const customer = await prisma.customer.findUnique({ where: { userId: session.sub } });
  if (!customer) {
    return NextResponse.json({ error: "Customer profile not found" }, { status: 404 });
  }

  const orders = await prisma.order.findMany({
    where: { customerId: customer.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ orders });
}

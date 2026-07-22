import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { endOfDay, parseISO, startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { amountToPointsEarned, pointsToDiscount } from "@/lib/loyalty";

const lineItemSchema = z.object({
  type: z.enum(["SERVICE", "PRODUCT"]),
  id: z.string().min(1),
  quantity: z.coerce.number().int().positive().max(50).default(1),
});

const createSchema = z.object({
  appointmentId: z.string().optional(),
  customerEmail: z.string().email().optional(),
  staffId: z.string().min(1),
  lineItems: z.array(lineItemSchema).min(1),
  tip: z.coerce.number().min(0).default(0),
  taxRate: z.coerce.number().min(0).max(1).default(0.08),
  paymentMethod: z.enum(["CASH", "CARD", "SPLIT"]),
  splitCashAmount: z.coerce.number().min(0).optional(),
  splitCardAmount: z.coerce.number().min(0).optional(),
  promoCode: z.string().min(1).max(32).optional(),
  redeemPoints: z.coerce.number().int().min(0).optional(),
});

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function POST(req: NextRequest) {
  const { response } = await requireRole("RECEPTIONIST", "ADMIN");
  if (response) return response;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const staff = await prisma.staff.findUnique({ where: { id: data.staffId } });
  if (!staff) {
    return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
  }

  let customerId: string | undefined;

  if (data.appointmentId) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: data.appointmentId },
      include: { transaction: true },
    });
    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }
    if (appointment.transaction) {
      return NextResponse.json(
        { error: "This appointment has already been checked out" },
        { status: 409 }
      );
    }
    customerId = appointment.customerId;
  } else if (data.customerEmail) {
    const customerUser = await prisma.user.findUnique({
      where: { email: data.customerEmail },
      include: { customer: true },
    });
    if (!customerUser?.customer) {
      return NextResponse.json(
        { error: "No customer account found with that email" },
        { status: 404 }
      );
    }
    customerId = customerUser.customer.id;
  }

  if (data.redeemPoints && !customerId) {
    return NextResponse.json(
      { error: "Cannot redeem loyalty points without a linked customer" },
      { status: 400 }
    );
  }

  const serviceIds = data.lineItems.filter((li) => li.type === "SERVICE").map((li) => li.id);
  const productIds = data.lineItems.filter((li) => li.type === "PRODUCT").map((li) => li.id);

  const [services, products] = await Promise.all([
    serviceIds.length
      ? prisma.service.findMany({ where: { id: { in: serviceIds } } })
      : Promise.resolve([]),
    productIds.length
      ? prisma.product.findMany({ where: { id: { in: productIds } } })
      : Promise.resolve([]),
  ]);

  if (services.length !== new Set(serviceIds).size) {
    return NextResponse.json({ error: "One or more services are invalid" }, { status: 400 });
  }
  if (products.length !== new Set(productIds).size) {
    return NextResponse.json({ error: "One or more products are invalid" }, { status: 400 });
  }

  type ResolvedLine = {
    serviceId?: string;
    productId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  };

  const resolvedLines: ResolvedLine[] = data.lineItems.map((li) => {
    if (li.type === "SERVICE") {
      const service = services.find((s) => s.id === li.id)!;
      return {
        serviceId: service.id,
        description: service.name,
        quantity: 1,
        unitPrice: Number(service.price),
        lineTotal: round2(Number(service.price)),
      };
    }
    const product = products.find((p) => p.id === li.id)!;
    return {
      productId: product.id,
      description: product.name,
      quantity: li.quantity,
      unitPrice: Number(product.unitPrice),
      lineTotal: round2(Number(product.unitPrice) * li.quantity),
    };
  });

  const rawSubtotal = round2(resolvedLines.reduce((sum, l) => sum + l.lineTotal, 0));

  let promoCode: Awaited<ReturnType<typeof prisma.promoCode.findUnique>> = null;
  let promoDiscount = 0;
  if (data.promoCode) {
    promoCode = await prisma.promoCode.findUnique({ where: { code: data.promoCode.toUpperCase() } });
    if (!promoCode || !promoCode.active) {
      return NextResponse.json({ error: "Invalid promo code" }, { status: 400 });
    }
    if (promoCode.expiresAt && promoCode.expiresAt < new Date()) {
      return NextResponse.json({ error: "This promo code has expired" }, { status: 400 });
    }
    if (promoCode.usageLimit !== null && promoCode.usedCount >= promoCode.usageLimit) {
      return NextResponse.json({ error: "This promo code has reached its usage limit" }, { status: 400 });
    }
    promoDiscount =
      promoCode.discountType === "PERCENT"
        ? round2((rawSubtotal * Number(promoCode.discountValue)) / 100)
        : round2(Number(promoCode.discountValue));
    promoDiscount = Math.min(promoDiscount, rawSubtotal);
  }

  let redemptionDiscount = 0;
  if (data.redeemPoints && customerId) {
    const customer = await prisma.customer.findUniqueOrThrow({ where: { id: customerId } });
    if (data.redeemPoints > customer.loyaltyPointsBalance) {
      return NextResponse.json({ error: "Not enough loyalty points" }, { status: 400 });
    }
    redemptionDiscount = Math.min(
      pointsToDiscount(data.redeemPoints),
      round2(rawSubtotal - promoDiscount)
    );
  }

  const subtotal = round2(Math.max(0, rawSubtotal - promoDiscount - redemptionDiscount));
  const tax = round2(subtotal * data.taxRate);
  const tip = round2(data.tip);
  const total = round2(subtotal + tax + tip);

  if (data.paymentMethod === "SPLIT") {
    const cash = round2(data.splitCashAmount ?? 0);
    const card = round2(data.splitCardAmount ?? 0);
    if (Math.abs(cash + card - total) > 0.01) {
      return NextResponse.json(
        { error: "Split cash + card amounts must add up to the total" },
        { status: 400 }
      );
    }
  }

  try {
    const transaction = await prisma.$transaction(async (tx) => {
      for (const line of resolvedLines) {
        if (line.productId) {
          await tx.$executeRaw`SELECT id FROM product WHERE id = ${line.productId} FOR UPDATE`;
          const product = await tx.product.findUniqueOrThrow({ where: { id: line.productId } });
          if (product.stockQuantity < line.quantity) {
            throw new Error(`OUT_OF_STOCK:${product.name}`);
          }
        }
      }

      const created = await tx.transaction.create({
        data: {
          appointmentId: data.appointmentId,
          staffId: data.staffId,
          subtotal,
          tax,
          tip,
          total,
          paymentMethod: data.paymentMethod,
          splitCashAmount: data.paymentMethod === "SPLIT" ? round2(data.splitCashAmount ?? 0) : null,
          splitCardAmount: data.paymentMethod === "SPLIT" ? round2(data.splitCardAmount ?? 0) : null,
          status: "PAID",
          lineItems: {
            create: resolvedLines.map((l) => ({
              serviceId: l.serviceId,
              productId: l.productId,
              description: l.description,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              lineTotal: l.lineTotal,
            })),
          },
        },
        include: { lineItems: true },
      });

      for (const line of resolvedLines) {
        if (line.productId) {
          await tx.product.update({
            where: { id: line.productId },
            data: { stockQuantity: { decrement: line.quantity } },
          });
          await tx.inventoryMovement.create({
            data: {
              productId: line.productId,
              quantityDelta: -line.quantity,
              reason: "SALE",
              note: `Transaction ${created.id}`,
            },
          });
        }
      }

      if (data.appointmentId) {
        await tx.appointment.update({
          where: { id: data.appointmentId },
          data: { status: "COMPLETED" },
        });
      }

      if (promoCode) {
        await tx.promoCode.update({
          where: { id: promoCode.id },
          data: { usedCount: { increment: 1 } },
        });
      }

      if (customerId) {
        await tx.$executeRaw`SELECT id FROM customer WHERE id = ${customerId} FOR UPDATE`;

        if (data.redeemPoints) {
          await tx.customer.update({
            where: { id: customerId },
            data: { loyaltyPointsBalance: { decrement: data.redeemPoints } },
          });
          await tx.loyaltyTransaction.create({
            data: {
              customerId,
              pointsDelta: -data.redeemPoints,
              reason: `Redeemed at checkout (transaction ${created.id})`,
            },
          });
        }

        const pointsEarned = amountToPointsEarned(subtotal);
        if (pointsEarned > 0) {
          await tx.customer.update({
            where: { id: customerId },
            data: { loyaltyPointsBalance: { increment: pointsEarned } },
          });
          await tx.loyaltyTransaction.create({
            data: {
              customerId,
              pointsDelta: pointsEarned,
              reason: `Earned from visit (transaction ${created.id})`,
            },
          });
        }
      }

      return created;
    });

    return NextResponse.json({ transaction }, { status: 201 });
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

const listQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function GET(req: NextRequest) {
  const { response } = await requireRole("RECEPTIONIST", "ADMIN");
  if (response) return response;

  const parsed = listQuerySchema.safeParse({ date: req.nextUrl.searchParams.get("date") });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }
  const day = parseISO(parsed.data.date);

  const transactions = await prisma.transaction.findMany({
    where: { createdAt: { gte: startOfDay(day), lte: endOfDay(day) } },
    include: {
      staff: { include: { user: { select: { name: true } } } },
      lineItems: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ transactions });
}

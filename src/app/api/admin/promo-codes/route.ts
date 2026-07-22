import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

const createSchema = z.object({
  code: z
    .string()
    .min(3)
    .max(32)
    .transform((s) => s.toUpperCase()),
  discountType: z.enum(["PERCENT", "FIXED"]),
  discountValue: z.coerce.number().positive(),
  usageLimit: z.coerce.number().int().positive().optional(),
  expiresAt: z.string().datetime().optional(),
});

export async function GET() {
  const { response } = await requireRole("ADMIN");
  if (response) return response;

  const promoCodes = await prisma.promoCode.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ promoCodes });
}

export async function POST(req: NextRequest) {
  const { response } = await requireRole("ADMIN");
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

  if (data.discountType === "PERCENT" && data.discountValue > 100) {
    return NextResponse.json({ error: "Percent discount cannot exceed 100" }, { status: 400 });
  }

  const existing = await prisma.promoCode.findUnique({ where: { code: data.code } });
  if (existing) {
    return NextResponse.json({ error: "A promo code with this code already exists" }, { status: 409 });
  }

  const promoCode = await prisma.promoCode.create({
    data: {
      code: data.code,
      discountType: data.discountType,
      discountValue: data.discountValue,
      usageLimit: data.usageLimit,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    },
  });

  return NextResponse.json({ promoCode }, { status: 201 });
}

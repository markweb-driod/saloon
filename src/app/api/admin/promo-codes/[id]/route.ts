import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

const updateSchema = z.object({
  active: z.boolean().optional(),
  discountValue: z.coerce.number().positive().optional(),
  usageLimit: z.coerce.number().int().positive().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireRole("ADMIN");
  if (response) return response;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const promoCode = await prisma.promoCode.findUnique({ where: { id } });
  if (!promoCode) {
    return NextResponse.json({ error: "Promo code not found" }, { status: 404 });
  }

  const updated = await prisma.promoCode.update({
    where: { id },
    data: {
      ...(parsed.data.active !== undefined ? { active: parsed.data.active } : {}),
      ...(parsed.data.discountValue !== undefined
        ? { discountValue: parsed.data.discountValue }
        : {}),
      ...(parsed.data.usageLimit !== undefined ? { usageLimit: parsed.data.usageLimit } : {}),
      ...(parsed.data.expiresAt !== undefined
        ? { expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null }
        : {}),
    },
  });

  return NextResponse.json({ promoCode: updated });
}

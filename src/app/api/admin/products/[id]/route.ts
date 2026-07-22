import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

const updateSchema = z.object({
  category: z.string().max(120).optional(),
  description: z.string().max(4000).optional(),
  imageUrl: z.string().url().max(2000).optional().or(z.literal("")),
  unitCost: z.coerce.number().min(0).optional(),
  unitPrice: z.coerce.number().min(0).optional(),
  reorderThreshold: z.coerce.number().int().min(0).optional(),
  supplierNote: z.string().max(2000).optional(),
  featured: z.coerce.boolean().optional(),
  homepagePosition: z.coerce.number().int().min(0).optional(),
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

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const { imageUrl, category, description, ...rest } = parsed.data;
  const updated = await prisma.product.update({
    where: { id },
    data: {
      ...rest,
      // Empty string from a cleared form field means "unset", not literal "".
      ...(imageUrl !== undefined ? { imageUrl: imageUrl || null } : {}),
      ...(category !== undefined ? { category: category || null } : {}),
      ...(description !== undefined ? { description: description || null } : {}),
    },
  });

  return NextResponse.json({ product: updated });
}

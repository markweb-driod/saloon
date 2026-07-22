import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  sku: z.string().min(1).max(64),
  category: z.string().max(120).optional(),
  description: z.string().max(4000).optional(),
  imageUrl: z.string().url().max(2000).optional().or(z.literal("")),
  stockQuantity: z.coerce.number().int().min(0).default(0),
  reorderThreshold: z.coerce.number().int().min(0).default(0),
  unitCost: z.coerce.number().min(0),
  unitPrice: z.coerce.number().min(0),
  supplierNote: z.string().max(2000).optional(),
  featured: z.coerce.boolean().default(false),
  homepagePosition: z.coerce.number().int().min(0).default(0),
});

export async function GET() {
  const { response } = await requireRole("ADMIN");
  if (response) return response;

  const products = await prisma.product.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ products });
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

  const existing = await prisma.product.findUnique({ where: { sku: data.sku } });
  if (existing) {
    return NextResponse.json({ error: "A product with this SKU already exists" }, { status: 409 });
  }

  const product = await prisma.product.create({
    data: {
      name: data.name,
      sku: data.sku,
      category: data.category || null,
      description: data.description || null,
      imageUrl: data.imageUrl || null,
      stockQuantity: data.stockQuantity,
      reorderThreshold: data.reorderThreshold,
      unitCost: data.unitCost,
      unitPrice: data.unitPrice,
      supplierNote: data.supplierNote,
      featured: data.featured,
      homepagePosition: data.homepagePosition,
    },
  });

  if (data.stockQuantity > 0) {
    await prisma.inventoryMovement.create({
      data: {
        productId: product.id,
        quantityDelta: data.stockQuantity,
        reason: "RESTOCK",
        note: "Initial stock on product creation",
      },
    });
  }

  return NextResponse.json({ product }, { status: 201 });
}

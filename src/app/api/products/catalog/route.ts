import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const products = await prisma.product.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      description: p.description,
      price: p.unitPrice.toString(),
      inStock: p.stockQuantity > 0,
      lowStock: p.stockQuantity > 0 && p.stockQuantity <= p.reorderThreshold,
    })),
  });
}

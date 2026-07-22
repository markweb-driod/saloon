import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { endOfDay, parseISO, startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { toCsv, csvResponse } from "@/lib/csv";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

const querySchema = z.object({
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  format: z.enum(["json", "csv"]).default("json"),
});

export async function GET(req: NextRequest) {
  const { response } = await requireRole("ADMIN");
  if (response) return response;

  const parsed = querySchema.safeParse({
    start: req.nextUrl.searchParams.get("start"),
    end: req.nextUrl.searchParams.get("end"),
    format: req.nextUrl.searchParams.get("format") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }
  const { start, end, format } = parsed.data;

  const [products, salesMovements] = await Promise.all([
    prisma.product.findMany({ orderBy: { name: "asc" } }),
    prisma.inventoryMovement.findMany({
      where: {
        reason: "SALE",
        createdAt: { gte: startOfDay(parseISO(start)), lte: endOfDay(parseISO(end)) },
      },
    }),
  ]);

  const soldByProduct = new Map<string, number>();
  for (const m of salesMovements) {
    soldByProduct.set(m.productId, (soldByProduct.get(m.productId) ?? 0) + Math.abs(m.quantityDelta));
  }

  const rows = products.map((p) => ({
    name: p.name,
    sku: p.sku,
    stockQuantity: p.stockQuantity,
    reorderThreshold: p.reorderThreshold,
    lowStock: p.stockQuantity <= p.reorderThreshold,
    costValue: round2(p.stockQuantity * Number(p.unitCost)),
    retailValue: round2(p.stockQuantity * Number(p.unitPrice)),
    unitsSoldInRange: soldByProduct.get(p.id) ?? 0,
  }));

  const totals = {
    totalCostValue: round2(rows.reduce((sum, r) => sum + r.costValue, 0)),
    totalRetailValue: round2(rows.reduce((sum, r) => sum + r.retailValue, 0)),
    lowStockCount: rows.filter((r) => r.lowStock).length,
  };

  const topSellers = [...rows]
    .filter((r) => r.unitsSoldInRange > 0)
    .sort((a, b) => b.unitsSoldInRange - a.unitsSoldInRange)
    .slice(0, 10);

  if (format === "csv") {
    return csvResponse(
      `inventory-${start}-to-${end}.csv`,
      toCsv(
        rows.map((r) => ({
          name: r.name,
          sku: r.sku,
          stockQuantity: r.stockQuantity,
          reorderThreshold: r.reorderThreshold,
          lowStock: r.lowStock ? "yes" : "no",
          costValue: r.costValue,
          retailValue: r.retailValue,
          unitsSoldInRange: r.unitsSoldInRange,
        }))
      )
    );
  }

  return NextResponse.json({ totals, products: rows, topSellers });
}

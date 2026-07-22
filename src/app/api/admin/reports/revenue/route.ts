import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { endOfDay, formatISO, parseISO, startOfDay } from "date-fns";
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

  const transactions = await prisma.transaction.findMany({
    where: { createdAt: { gte: startOfDay(parseISO(start)), lte: endOfDay(parseISO(end)) } },
    orderBy: { createdAt: "asc" },
  });

  const byDay = new Map<
    string,
    { gross: number; refunded: number; tax: number; tip: number; cash: number; card: number; count: number }
  >();

  for (const t of transactions) {
    const day = formatISO(t.createdAt, { representation: "date" });
    const entry = byDay.get(day) ?? {
      gross: 0,
      refunded: 0,
      tax: 0,
      tip: 0,
      cash: 0,
      card: 0,
      count: 0,
    };
    entry.gross = round2(entry.gross + Number(t.total));
    entry.refunded = round2(entry.refunded + Number(t.refundedAmount));
    entry.tax = round2(entry.tax + Number(t.tax));
    entry.tip = round2(entry.tip + Number(t.tip));
    if (t.paymentMethod === "CASH") entry.cash = round2(entry.cash + Number(t.total));
    if (t.paymentMethod === "CARD") entry.card = round2(entry.card + Number(t.total));
    if (t.paymentMethod === "SPLIT") {
      entry.cash = round2(entry.cash + Number(t.splitCashAmount ?? 0));
      entry.card = round2(entry.card + Number(t.splitCardAmount ?? 0));
    }
    entry.count += 1;
    byDay.set(day, entry);
  }

  const daily = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, e]) => ({
      date,
      grossSales: e.gross,
      refunded: e.refunded,
      netRevenue: round2(e.gross - e.refunded),
      tax: e.tax,
      tips: e.tip,
      cashCollected: e.cash,
      cardCollected: e.card,
      transactions: e.count,
    }));

  const totals = daily.reduce(
    (acc, d) => ({
      grossSales: round2(acc.grossSales + d.grossSales),
      refunded: round2(acc.refunded + d.refunded),
      netRevenue: round2(acc.netRevenue + d.netRevenue),
      tax: round2(acc.tax + d.tax),
      tips: round2(acc.tips + d.tips),
      cashCollected: round2(acc.cashCollected + d.cashCollected),
      cardCollected: round2(acc.cardCollected + d.cardCollected),
      transactions: acc.transactions + d.transactions,
    }),
    { grossSales: 0, refunded: 0, netRevenue: 0, tax: 0, tips: 0, cashCollected: 0, cardCollected: 0, transactions: 0 }
  );

  if (format === "csv") {
    return csvResponse(`revenue-${start}-to-${end}.csv`, toCsv(daily));
  }

  return NextResponse.json({ totals, daily });
}

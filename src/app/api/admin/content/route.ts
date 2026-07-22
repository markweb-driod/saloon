import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export async function GET() {
  const { response } = await requireRole("ADMIN");
  if (response) return response;

  const content = await prisma.siteContent.findMany({ orderBy: { key: "asc" } });
  return NextResponse.json({ content });
}

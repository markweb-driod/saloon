import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

const updateSchema = z.object({
  value: z.string().max(4000),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { response } = await requireRole("ADMIN");
  if (response) return response;

  const { key } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const content = await prisma.siteContent.findUnique({ where: { key } });
  if (!content) {
    return NextResponse.json({ error: "Content key not found" }, { status: 404 });
  }

  const updated = await prisma.siteContent.update({
    where: { key },
    data: { value: parsed.data.value },
  });

  return NextResponse.json({ content: updated });
}

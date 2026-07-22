import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { workingHoursSchema } from "@/app/api/admin/staff/route";

const updateSchema = z.object({
  commissionRate: z.coerce.number().min(0).max(100).optional(),
  specialties: z.string().max(500).optional(),
  workingHours: workingHoursSchema.optional(),
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

  const staff = await prisma.staff.findUnique({ where: { id } });
  if (!staff) {
    return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
  }

  const updated = await prisma.staff.update({
    where: { id },
    data: {
      ...(parsed.data.commissionRate !== undefined
        ? { commissionRate: parsed.data.commissionRate }
        : {}),
      ...(parsed.data.specialties !== undefined ? { specialties: parsed.data.specialties } : {}),
      ...(parsed.data.workingHours !== undefined
        ? { workingHours: JSON.stringify(parsed.data.workingHours) }
        : {}),
    },
  });

  return NextResponse.json({ staff: updated });
}

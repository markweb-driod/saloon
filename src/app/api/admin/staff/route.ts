import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { hashPassword } from "@/lib/auth";
import { parseWorkingHours } from "@/lib/availability";

const windowSchema = z.object({
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
});
const dayArray = z.array(windowSchema).default([]);
export const workingHoursSchema = z
  .object({
    sun: dayArray,
    mon: dayArray,
    tue: dayArray,
    wed: dayArray,
    thu: dayArray,
    fri: dayArray,
    sat: dayArray,
  })
  .partial();

const createSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  role: z.enum(["STYLIST", "RECEPTIONIST", "ADMIN"]),
  commissionRate: z.coerce.number().min(0).max(100).default(0),
  specialties: z.string().max(500).optional(),
  workingHours: workingHoursSchema.optional(),
});

export async function GET() {
  const { response } = await requireRole("ADMIN");
  if (response) return response;

  const staff = await prisma.staff.findMany({
    include: { user: { select: { id: true, name: true, email: true, phone: true, role: true } } },
    orderBy: { user: { name: "asc" } },
  });

  return NextResponse.json({
    staff: staff.map((s) => ({
      id: s.id,
      user: s.user,
      commissionRate: Number(s.commissionRate),
      specialties: s.specialties,
      workingHours: parseWorkingHours(s.workingHours),
    })),
  });
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

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(data.password);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      role: data.role,
      passwordHash,
      staff: {
        create: {
          commissionRate: data.commissionRate,
          specialties: data.specialties,
          workingHours: data.workingHours ? JSON.stringify(data.workingHours) : null,
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      staff: true,
    },
  });

  return NextResponse.json({ user }, { status: 201 });
}

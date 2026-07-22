import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import type { Role } from "@/generated/prisma";

const VALID_ROLES: Role[] = ["CUSTOMER", "STYLIST", "RECEPTIONIST", "ADMIN"];

export async function GET(req: NextRequest) {
  const { response } = await requireRole("ADMIN");
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const roleParam = searchParams.get("role");
  const role = roleParam && VALID_ROLES.includes(roleParam as Role) ? (roleParam as Role) : undefined;

  const users = await prisma.user.findMany({
    where: {
      ...(role ? { role } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { email: { contains: q } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ users });
}

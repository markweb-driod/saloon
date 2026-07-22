import { NextResponse } from "next/server";
import type { Role } from "@/generated/prisma";
import { getSession } from "@/lib/session";

export async function requireRole(...roles: Role[]) {
  const session = await getSession();
  if (!session) {
    return { session: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (!roles.includes(session.role)) {
    return { session, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session, response: null };
}

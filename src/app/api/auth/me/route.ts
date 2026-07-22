import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  const body = session
    ? {
        user: {
          id: session.sub,
          name: session.name,
          email: session.email,
          role: session.role,
        },
      }
    : { user: null };

  return NextResponse.json(body, {
    headers: { "Cache-Control": "no-store, must-revalidate" },
  });
}

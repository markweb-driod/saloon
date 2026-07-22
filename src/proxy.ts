import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

const STAFF_ROLES = ["STYLIST", "RECEPTIONIST", "ADMIN"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("next", pathname);

  if (pathname.startsWith("/account")) {
    if (!session) return NextResponse.redirect(loginUrl);
    return NextResponse.next();
  }

  if (pathname.startsWith("/dashboard")) {
    if (!session) return NextResponse.redirect(loginUrl);
    if (!STAFF_ROLES.includes(session.role)) {
      return NextResponse.redirect(new URL("/account", req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*", "/dashboard/:path*"],
};

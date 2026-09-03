import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET});
  const { pathname } = req.nextUrl;

  // Catch exact /reviewer URL hits
  if (pathname === "/reviewer") {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const rawDept = (token.department as string) || "";
    const normalizedDept = rawDept.trim().replace(/[\s-]+/g, "_").toUpperCase();

    if (normalizedDept.includes("ADVANCEMENT")) {
      return NextResponse.redirect(new URL("/reviewer/advancement", req.url));
    }
    if (normalizedDept.includes("SENATE")) {
      return NextResponse.redirect(new URL("/reviewer/senate", req.url));
    }
    if (normalizedDept.includes("COUNCIL")) {
      return NextResponse.redirect(new URL("/reviewer/council", req.url));
    }

    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 1. Protect reviewer routes
     * 2. Exclude api/upload, static files, images, etc.
     */
    "/reviewer/:path*",
    "/((?!api/upload|_next/static|_next/image|favicon.ico).*)",
  ],
};
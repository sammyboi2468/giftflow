import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Paths that must remain reachable even when a password change is pending --
// otherwise the redirect below would trap the user in a loop.
const EXEMPT_PREFIXES = ["/login", "/change-password", "/api/auth"];

function isExempt(pathname: string): boolean {
  return EXEMPT_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET });
  const { pathname } = req.nextUrl;

  // Force a password change before allowing access to anything else.
  if (token?.mustChangePassword && !isExempt(pathname)) {
    return NextResponse.redirect(new URL("/change-password", req.url));
  }

  // Catch exact /reviewer URL hits
  if (pathname === "/reviewer") {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const role = (token.role as string) || "";

    if (role === "ADVANCEMENT_OFFICE") {
      return NextResponse.redirect(new URL("/reviewer/advancement", req.url));
    }
    if (role === "SENATE_DIVISION") {
      return NextResponse.redirect(new URL("/reviewer/senate", req.url));
    }
    if (role === "COUNCIL") {
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
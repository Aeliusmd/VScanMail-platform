import { NextRequest, NextResponse } from "next/server";

/**
 * Edge middleware — runs before every request.
 * Protects /dashboard, /admin, /operator routes.
 * Public routes: /api/auth/*, /api/stripe/webhook, marketing pages.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // --- Public routes (no auth needed) ---
  const publicPaths = [
    "/api/auth/register",
    "/api/auth/login",
    "/api/auth/verify-email",
    "/api/auth/registration-plans",
    "/api/auth/registration-status",
    "/api/auth/registration-checkout",
    "/api/auth/registration-checkout-complete",
    "/api/stripe/webhook",
    "/api/quickbooks/callback",
  ];

  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // --- Skip non-API, non-protected routes ---
  const protectedPrefixes = ["/api/", "/dashboard", "/admin", "/operator"];
  if (!protectedPrefixes.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // --- Check Authorization header for API routes ---
  if (pathname.startsWith("/api/")) {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized — missing Bearer token" },
        { status: 401 }
      );
    }
    // Token validation happens in withAuth() inside route handlers.
    // Edge middleware just checks presence for fast rejection.
    return NextResponse.next();
  }

  // --- Check session cookie for page routes ---
  const sessionCookie = req.cookies.get("sb-access-token")?.value;
  if (!sessionCookie) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/:path*",
    "/dashboard/:path*",
    "/admin/:path*",
    "/operator/:path*",
  ],
};

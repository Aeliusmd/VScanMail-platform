import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/register/step-2",
  "/register/step-3",
  "/verify-email",
];

function decodeJwtPayload(token: string): any | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("sb-access-token")?.value;

  // 1. Allow public routes
  if (PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}?`))) {
    return NextResponse.next();
  }

  // 2. Allow static files, images, etc.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/images") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 3. Protect all other routes (dashboards)
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    // Only set redirect if it's not a root-level public-looking page
    if (pathname !== "/") {
      loginUrl.searchParams.set("redirect", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // 4. Optional role-based guards (if role is present in JWT payload)
  const payload = decodeJwtPayload(token);
  const role = payload?.role as string | undefined;

  if (pathname.startsWith("/customer")) {
    if (role && role !== "client") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/super-admin")) {
    if (role === "client") {
      return NextResponse.redirect(new URL("/customer/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};


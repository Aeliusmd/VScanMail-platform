import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = [
  "/login",
  "/register1",
  "/Register2",
  "/Register3",
  "/verify-email",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("sb-access-token")?.value;

  if (PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}?`))) {
    return NextResponse.next();
  }

  // Protect dashboard routes.
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
    "/register1",
    "/Register2",
    "/Register3",
    "/verify-email",
  ],
};


import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Define protected path prefixes
  const isProtectedPath =
    path.startsWith("/admin") ||
    path.startsWith("/seller") ||
    path.startsWith("/rider") ||
    path.startsWith("/buyer");

  if (isProtectedPath) {
    // Better Auth session cookie names
    const token =
      request.cookies.get("better-auth.session_token")?.value ||
      request.cookies.get("__secure-better-auth.session_token")?.value;

    if (!token) {
      // Redirect to login page if no session cookie exists
      const loginUrl = new URL("/login", request.url);
      // Optional: pass the original URL as a redirect query param
      loginUrl.searchParams.set("callbackUrl", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

// See Next.js Middleware Matcher docs
export const config = {
  matcher: [
    "/admin/:path*",
    "/seller/:path*",
    "/rider/:path*",
    "/buyer/:path*",
  ],
};

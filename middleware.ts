import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// ── Protected route prefixes ─────────────────────────────────────────
// Middleware only checks IF a session cookie exists.
// Actual role enforcement happens server-side in the Node.js runtime.
const PROTECTED_PREFIXES = [
  "/admin",
  "/seller",
  "/rider",
  "/account",
];

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // ── Check if this route requires authentication ──────────────────
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  // Not a protected route — allow through
  if (!isProtected) return NextResponse.next();

  // ── Lightweight cookie presence check ────────────────────────────
  // This does NOT validate the session — it only checks if the cookie exists.
  // The actual session validation and role check happens in the Node.js
  // runtime via auth.api.getSession() inside the page/route handler.
  const sessionCookie =
    request.cookies.get("better-auth.session_token") ||
    request.cookies.get("__secure-better-auth.session_token");

  if (!sessionCookie?.value) {
    // No session cookie at all — redirect to login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Cookie exists — allow through to Node.js runtime ─────────────
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/seller/:path*",
    "/rider/:path*",
    "/account/:path*",
    // Exclude static files, Next.js internals, and auth API
    "/((?!_next/static|_next/image|favicon.ico|api/auth).*)",
  ],
};


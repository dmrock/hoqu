import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const SESSION_COOKIE_NAMES = ["authjs.session-token", "__Secure-authjs.session-token"];
const PUBLIC_PATHS = new Set([
  "/",
  "/features",
  "/privacy",
  "/terms",
  "/forgot-password",
  "/reset-password",
  "/confirm-email",
  "/verify-email",
]);

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = SESSION_COOKIE_NAMES.some((name) => req.cookies.get(name)?.value);
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isPublic = PUBLIC_PATHS.has(pathname);

  if (hasSession && (isAuthPage || pathname === "/")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (!hasSession && !isAuthPage && !isPublic) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|opengraph-image|twitter-image|apple-icon|.*\\..*).*)",
  ],
};

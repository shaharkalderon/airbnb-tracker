import { NextResponse, type NextRequest } from "next/server";

const COOKIE = "airbnb_auth";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // public routes
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/login") ||
    pathname.startsWith("/api/keep-alive") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/public")
  ) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get(COOKIE)?.value;
  const expected = process.env.APP_PASSWORD;
  if (!expected) return NextResponse.next(); // misconfigured -> let through

  if (cookie === expected) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("from", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

import { type NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "better-auth.session_token";
const LOCALE_COOKIE = "locale";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Root path: redirect based on session cookie presence (edge, no origin hit)
  if (pathname === "/") {
    const hasSession = request.cookies.has(SESSION_COOKIE);
    const destination = hasSession ? "/chat" : "/home";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  // Marketing pages: propagate locale via response header for CDN Vary caching
  const response = NextResponse.next();
  const locale = request.cookies.get(LOCALE_COOKIE)?.value;

  if (locale === "en" || locale === "ja") {
    response.headers.set("x-locale", locale);
  } else {
    // Fallback: parse Accept-Language for ja, default to en
    const acceptLang = request.headers.get("accept-language") ?? "";
    const isJa = acceptLang
      .split(",")
      .some((entry) => entry.trim().toLowerCase().startsWith("ja"));
    response.headers.set("x-locale", isJa ? "ja" : "en");
  }

  return response;
}

export const config = {
  matcher: ["/", "/home", "/about", "/models", "/flixa", "/legal/:path*", "/migration"],
};

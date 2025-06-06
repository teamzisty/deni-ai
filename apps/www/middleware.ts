// middleware.ts (推奨されるアプローチ)
import { NextRequest, NextResponse } from "next/server";
import { CookieOptions, createServerClient } from "@supabase/ssr";
import createNextIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing"; // Ensure this path is correct

const intlMiddleware = createNextIntlMiddleware(routing);

export default async function middleware(
  request: NextRequest
): Promise<NextResponse> {
  // Early return for API routes - skip intl middleware for API endpoints
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // 1. next-intl ミドルウェアを実行し、国際化処理を行う
  //    これにより、ロケールが決定され、request.nextUrl.locale が設定されるか、
  //    必要に応じてリライト/リダイレクトが行われます。
  let response = intlMiddleware(request);
  // ここで response.nextUrl.locale を使用して、現在のロケールを取得できる
  // ただし、NextResponse.next() の場合のみ有効。リダイレクトだとここで止まる。

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 変更後
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("Supabase getSession error:", error);
  }
  const loggedIn = !!user;

  // next-intlによってロケールプレフィックスが既に処理されているため、
  // request.nextUrl.pathname はロケールプレフィックスを含んだURLになります。
  // 必要に応じて、ロケールプレフィックスを取り除いたパスで条件分岐します。
  // 例: /en/home -> /home
  const pathnameWithoutParameters = request.nextUrl.pathname.replace(
    /\?.*$/,
    ""
  ); // パラメータを削除
  const locale = pathnameWithoutParameters.split("/")[1];

  console.log(
    request.nextUrl.pathname,
    "loggedIn:",
    loggedIn,
    "locale:",
    locale
  );

  const pathnameWithoutLocale = request.nextUrl.pathname.replace(
    `/${locale}`,
    ""
  );
  // ルートパスの場合の調整: /en -> ""
  let adjustedPathname = pathnameWithoutLocale.replace(/\?.*$/, ""); // Delete ? parameter
  if (adjustedPathname === "") {
    adjustedPathname = "/";
  }

  console.log("adjustedPathname:", adjustedPathname);

  if (loggedIn) {
    // ログインしている場合
    if (adjustedPathname === "/") {
      // / へのアクセスは /chat/home の内容を表示 (URLは / のまま)
      // next-intlが生成したresponseをベースにrewriteする
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = `/chat/home`; // /chat/home にリライト
      response = NextResponse.rewrite(rewriteUrl); // `response` オブジェクトを直接操作
    } else if (adjustedPathname === "/home") {
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = `/`;
      response = NextResponse.rewrite(rewriteUrl);
    }
  } else {
    // ログインしていない場合
    if (adjustedPathname === "/") {
      // / へのアクセスはそのまま許可 (Heroを表示)
      // next-intlが生成したresponseをそのまま返す
    } else if (
      adjustedPathname === "/home" ||
      adjustedPathname.startsWith("/dashboard")
    ) {
      // /home または /dashboard へのアクセスは / (Hero) にリダイレクト
      // next-intlが生成したresponseをベースにredirectする
      return NextResponse.redirect(new URL(`/${locale}/`, request.url)); // 新しいNextResponseを返すため return
    }
  }

  // 最後に、intlMiddlewareから得られたレスポンス（または変更されたレスポンス）を返す
  return response;
}

export const config = {
  // next-intlのドキュメントに従って、ロケールプレフィックスを含む全てのパスにマッチさせる
  // matcherの最後の '.*' は任意のパスにマッチします
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ], // 例: ['/', '/(ja|en)/dashboard/:path*', '/(ja|en)/home/:path*']
};

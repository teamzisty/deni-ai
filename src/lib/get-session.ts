import { cache } from "react";
import { connection } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/**
 * Request-scoped session lookup. Shared across layout + page so auth is only
 * resolved once per RSC request (React.cache).
 *
 * `connection()` defers this past Cache Components prerender so Neon/auth
 * fetch() is not started (and then aborted) while building the static shell.
 * Call sites must sit under a <Suspense> boundary.
 */
export const getSession = cache(async () => {
  await connection();
  return auth.api.getSession({ headers: await headers() });
});

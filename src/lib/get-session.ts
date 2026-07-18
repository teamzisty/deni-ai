import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/**
 * Request-scoped session lookup. Shared across layout + page so auth is only
 * resolved once per RSC request (React.cache).
 */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

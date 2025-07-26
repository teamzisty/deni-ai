import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "../env";
import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client for server-side rendering (SSR) in Next.js.
 * This client is used to interact with Supabase services on the server side.
 *
 * @returns {Promise<SupabaseClient>} A promise that resolves to a Supabase client instance.
 */
export async function createServer() {
  const cookieStore = await cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );
}

/**
 * Creates a Supabase client for server-side operations.
 * This client is used to interact with Supabase services on the server side.
 *
 * @returns {Promise<SupabaseClient>} A promise that resolves to a Supabase client instance.
 */
export async function createSupabaseServer() {
  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export async function authCheck(req: Request) {
  let authorization = req.headers.get("Authorization");
  if (!authorization) {
    return { success: false }; // Unauthorized
  }
  authorization = authorization.replace("Bearer ", "");

  const supabase = await createSupabaseServer();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(authorization);
  if (error || !user) {
    return { success: false }; // Unauthorized
  }
  return { success: true, user }; // Authorized
}

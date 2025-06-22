import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "../env";
import { createClient } from "@supabase/supabase-js";

export async function createSupabaseServer() {
  const cookieStore = await cookies();

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
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

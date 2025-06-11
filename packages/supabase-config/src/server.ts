import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Define environment variables interface
interface Env {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

// Use process.env with type safety
const env: Env = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

let supabaseAdmin: SupabaseClient | undefined;

export const notAvailable = !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY;

if (!notAvailable) {
  try {
    supabaseAdmin = createClient(
      env.SUPABASE_URL!,
      env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  } catch (error) {
    console.error("Supabase admin initialization error:", error);
  }
} else {
  console.warn(
    "Supabase admin initialization skipped: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not defined",
  );
}

export { supabaseAdmin };

// Function to create a server client with a specific access token
export function createSupabaseServerClient(
  accessToken?: string,
): SupabaseClient {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase environment variables not configured");
  }

  if (accessToken) {
    // Create client with user token for authenticated requests
    return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  // Return admin client for server-side operations
  return supabaseAdmin!;
}

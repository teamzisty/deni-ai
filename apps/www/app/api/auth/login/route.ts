import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );

  try {
    const formData = await request.formData();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    const {
      data: { user, session },
      error,
    } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (!user || !session) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 },
      );
    }

    // Check if user has MFA enabled
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const hasMFA = factors?.all?.some((factor) => factor.status === "verified");

    // Check the Authentication Assurance Level (AAL)
    const aal = (session as any).aal || "aal1";

    if (hasMFA && aal === "aal1") {
      // User has MFA enrolled but hasn't completed 2FA challenge
      return NextResponse.json(
        {
          requiresMFA: true,
          message: "Two-factor authentication required",
          user: {
            id: user.id,
            email: user.email,
            aal: aal,
          },
        },
        { status: 200 },
      );
    } else if (hasMFA && aal === "aal2") {
      // User has completed 2FA challenge
      return NextResponse.json(
        {
          success: true,
          message: "Login successful with 2FA",
          user: user,
          aal: aal,
        },
        { status: 200 },
      );
    } else if (!hasMFA) {
      // User doesn't have MFA enrolled
      return NextResponse.json(
        {
          success: true,
          message: "Login successful",
          user: user,
          aal: aal,
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      { error: "Authentication state error" },
      { status: 500 },
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

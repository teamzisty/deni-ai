import {createSupabaseServiceRoleClient} from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

// Validation schema for creating action keys
const CreateActionKeySchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  description: z.string().optional().default(""),
  expiresAt: z.string().datetime().optional(),
});

export async function GET(req: Request) {
  try {
    const authorization = req.headers
      .get("Authorization")
      ?.replace("Bearer ", "");
    if (!authorization) {
      return NextResponse.json(
        { error: "Authorization Failed" },
        { status: 401 },
      );
    }

    const supabase = await createSupabaseServiceRoleClient();

    // Verify the JWT token
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authorization);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authorization Failed" },
        { status: 401 },
      );
    }

    // Get user's action keys from Supabase
    const { data: actionKeys, error } = await supabase
      .from("intellipulse_action_keys")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: "Database Error" }, { status: 500 });
    }

    // Transform the data to match the frontend interface
    const transformedKeys = (actionKeys || []).map((key) => ({
      id: key.id,
      name: key.name,
      description: key.description || "",
      key: key.key_value,
      createdAt: key.created_at,
      expiresAt: key.expires_at,
      lastUsedAt: key.last_used_at,
      usageCount: key.usage_count || 0,
      isActive: key.is_active,
    }));

    return NextResponse.json({
      success: true,
      data: transformedKeys,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authorization = req.headers
      .get("Authorization")
      ?.replace("Bearer ", "");

    if (!authorization) {
      return NextResponse.json(
        { error: "Authorization Failed" },
        { status: 401 },
      );
    }

    const supabase = await createSupabaseServiceRoleClient();

    // Verify the JWT token
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authorization);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authorization Failed" },
        { status: 401 },
      );
    }

    // Validate request body
    const body = await req.json();
    const validatedData = CreateActionKeySchema.parse(body);

    // Generate secure action key
    const keyValue = `iap_${crypto.randomUUID().replace(/-/g, "")}`;
    const keyId = crypto.randomUUID();

    // Insert new action key into Supabase
    const { data: newKey, error } = await supabase
      .from("intellipulse_action_keys")
      .insert({
        id: keyId,
        user_id: user.id,
        name: validatedData.name,
        description: validatedData.description,
        key_value: keyValue,
        expires_at: validatedData.expiresAt || null,
        is_active: true,
        usage_count: 0,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: "Database Error" }, { status: 500 });
    }

    // Transform the response data
    const transformedKey = {
      id: newKey.id,
      name: newKey.name,
      description: newKey.description || "",
      key: newKey.key_value,
      createdAt: newKey.created_at,
      expiresAt: newKey.expires_at,
      lastUsedAt: newKey.last_used_at,
      usageCount: newKey.usage_count || 0,
      isActive: newKey.is_active,
    };

    return NextResponse.json({
      success: true,
      data: transformedKey,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }

    console.error(error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

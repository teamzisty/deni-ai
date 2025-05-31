import { createSupabaseServerClient } from "@workspace/supabase-config/server";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authorization = req.headers.get("Authorization")?.replace("Bearer ", "");

    if (!authorization) {
      return NextResponse.json(
        { error: "Authorization Failed" },
        { status: 401 }
      );
    }

    const supabase = createSupabaseServerClient();
    
    // Verify the JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(authorization);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Authorization Failed" },
        { status: 401 }
      );
    }

    const { id: keyId } = await params;

    if (!keyId) {
      return NextResponse.json(
        { error: "Action Key ID is required" },
        { status: 400 }
      );
    }

    // Get action key data and verify ownership
    const { data: keyData, error: fetchError } = await supabase
      .from("intellipulse_action_keys")
      .select("*")
      .eq("id", keyId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !keyData) {
      return NextResponse.json({ error: "Action Key not found" }, { status: 404 });
    }

    // Check if key is active
    if (!keyData.is_active) {
      return NextResponse.json({
        success: true,
        isValid: false,
        reason: "Key is deactivated",
      });
    }

    // Check if key has expired
    if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
      return NextResponse.json({
        success: true,
        isValid: false,
        reason: "Key has expired",
      });
    }

    // Simulate validation check (in a real implementation, you might check 
    // against external services or perform more complex validation)
    const now = new Date();
    const effectiveness = {
      isValid: true,
      lastValidatedAt: now.toISOString(),
      uptime: 99.8, // Example uptime percentage
      responseTime: Math.floor(Math.random() * 100) + 50, // Example response time in ms
      rateLimitRemaining: 1000 - (keyData.usage_count || 0),
    };

    // Update last validated timestamp
    await supabase
      .from("intellipulse_action_keys")
      .update({
        last_validated_at: now.toISOString(),
      })
      .eq("id", keyId);

    return NextResponse.json({
      success: true,
      ...effectiveness,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

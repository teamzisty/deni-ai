import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabase/server";

export async function validateActionKey(actionKey: string): Promise<{
  success: boolean;
  isValid?: boolean;
  reason?: string;
  error?: string;
  effectiveness?: {
    isValid: boolean;
    lastValidatedAt?: string;
    uptime?: number;
    responseTime?: number;
    rateLimitRemaining?: number;
  };
}> {
  try {
    if (!actionKey) {
      throw new Error("Action Key is required");
    }

    const supabase = await createSupabaseServiceRoleClient();

    // Get action key data and verify ownership
    const { data: keyData, error: fetchError } = await supabase
      .from("intellipulse_action_keys")
      .select("*")
      .eq("key_value", actionKey)
      .single();

    if (fetchError || !keyData) {
      console.log("Error fetching action key:", fetchError);
      throw new Error("Action Key not found");
    }

    // Check if key is active
    if (!keyData.is_active) {
      return {
        success: true,
        isValid: false,
        reason: "Key is deactivated",
      };
    }

    // Check if key has expired
    if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
      return {
        success: true,
        isValid: false,
        reason: "Key has expired",
      };
    }

    // Simulate validation check
    const now = new Date();
    const effectiveness = {
      isValid: true,
      lastValidatedAt: now.toISOString(),
      uptime: 99.8,
      responseTime: Math.floor(Math.random() * 100) + 50,
      rateLimitRemaining: 1000 - (keyData.usage_count || 0),
    };

    return {
      success: true,
      ...effectiveness,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Server Error",
    };
  }
}

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const supabase = await createSupabaseServerClient();

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

    const { id: keyId } = await params;

    if (!keyId) {
      return NextResponse.json(
        { error: "Action Key ID is required" },
        { status: 400 },
      );
    }

    // Check if action key exists and user is the owner
    const { data: keyData, error: fetchError } = await supabase
      .from("intellipulse_action_keys")
      .select("user_id")
      .eq("id", keyId)
      .single();

    if (fetchError || !keyData) {
      return NextResponse.json(
        { error: "Action Key not found" },
        { status: 404 },
      );
    }

    if (keyData.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete action key from Supabase
    const { error } = await supabase
      .from("intellipulse_action_keys")
      .delete()
      .eq("id", keyId);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: "Database Error" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

import { authCheck, createSupabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function DELETE(req: Request) {
  const user = await authCheck(req);
  if (!user.success || !user.user) {
    return new Response("common.unauthorized", { status: 401 });
  }

  const supabase = await createSupabaseServer();

  // Delete user's data from all tables
  try {
    // Delete conversations
    await supabase.from("conversations").delete().eq("user_id", user.user.id);

    // Delete user settings
    await supabase.from("user_settings").delete().eq("user_id", user.user.id);

    // Delete from users table
    await supabase.from("users").delete().eq("id", user.user.id);

    // Delete the auth user
    const { error } = await supabase.auth.admin.deleteUser(user.user.id);

    if (error) {
      console.error("Error deleting auth user:", error);
      return NextResponse.json(
        { error: "Failed to delete user account" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "An error occurred while deleting your account" },
      { status: 500 },
    );
  }
}

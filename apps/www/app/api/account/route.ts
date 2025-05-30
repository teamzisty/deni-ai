import { createSupabaseServerClient } from "@workspace/supabase-config/server";
import { NextResponse } from "next/server";

export async function DELETE(req: Request) {
  const supabase = createSupabaseServerClient();

  let userId = null;
  const authorization = req.headers.get("Authorization");

  if (authorization) {
    try {
      // Extract token from Bearer format
      const token = authorization.replace("Bearer ", "");
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);
      if (error || !user) {
        return new NextResponse("Authorization failed", { status: 401 });
      }
      userId = user.id;
    } catch (error) {
      console.error(error);
      return new NextResponse("Authorization failed", { status: 401 });
    }
  }

  if (!userId) {
    return new NextResponse("Authorization failed", { status: 401 });
  }

  try {
    await supabase.auth.admin.deleteUser(userId, false);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting user:", error);
    return new NextResponse("Failed to delete user", { status: 500 });
  }
}

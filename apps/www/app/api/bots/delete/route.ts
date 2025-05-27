import { ServerBot } from "@/types/bot";
import { createSupabaseServerClient } from "@workspace/supabase-config/server";
import { NextResponse } from "next/server";

interface BotsCreateRequest extends ServerBot {
  id: string;
}

export async function DELETE(req: Request) {
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

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Bot ID is not specified" },
        { status: 400 }
      );
    }

    // Check if bot exists and user is the owner
    const { data: botData, error: fetchError } = await supabase
      .from('bots')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !botData) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 });
    }

    if (botData.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete bot from Supabase
    const { error } = await supabase
      .from('bots')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Database Error" },
        { status: 500 }
      );
    }    return NextResponse.json({
      success: true
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

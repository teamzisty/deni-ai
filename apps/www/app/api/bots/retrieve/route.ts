import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const authorization = req.headers.get("Authorization")?.replace("Bearer ", "");

    if (!authorization) {
      return NextResponse.json(
        { error: "Authorization Failed" },
        { status: 401 }
      );
    }

    const supabase = await createSupabaseServerClient();
    
    // Verify the JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(authorization);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Authorization Failed" },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const botId = url.searchParams.get("id");

    if (!botId) {
      return NextResponse.json(
        { error: "Bot ID is not specified" },
        { status: 400 }
      );
    }

    // Get bot data from Supabase
    const { data: botData, error } = await supabase
      .from('bots')
      .select('*')
      .eq('id', botId)
      .single();

    if (error || !botData) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 });
    }

    // Check if the user is the owner of the bot
    const isOwner = botData.user_id === user.id;

    const botUserData = await supabase.auth.admin.getUserById(botData.user_id);
    if (!botUserData.data.user) {
      return NextResponse.json({ error: "Bot owner not found" }, { status: 404 });
    }

    const botUser = botUserData.data.user;

    return NextResponse.json({
      success: true,
      data: {
        id: botId,
        name: botData.name,
        description: botData.description,
        instructions: botData.instructions,
        systemInstruction: isOwner ? botData.system_instruction : null,
        createdBy: {
          name: botUser.user_metadata.name || "No Name",
          verified: botUser.email_confirmed_at !== null,
          id: botData.user_id,
        },
        createdAt: new Date(botData.created_at).getTime(),
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

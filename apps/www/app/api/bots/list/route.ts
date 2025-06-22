import { ClientBot } from "@/types/bot";
import {createSupabaseServiceRoleClient} from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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

    // Get bots from Supabase (limit to 20)
    const { data: botsData, error } = await supabase
      .from("bots")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: "Database Error" }, { status: 500 });
    }

    const bots: ClientBot[] = [];

    for (const bot of botsData || []) {
      const botUserData = await supabase.auth.admin.getUserById(bot.user_id);
      if (!botUserData.data.user) {
        return;
      }

      const botUser = botUserData.data.user;

      bots.push({
        id: bot.id,
        name: bot.name,
        description: bot.description,
        instructions: bot.instructions,
        createdBy: {
          name:
            botUser.user_metadata?.full_name || botUser.email || "Unknown User",
          verified: botUser.email_confirmed_at !== null,
          id: botUser.id,
        },
        createdAt: new Date(bot.created_at).getTime(),
      });
    }

    return NextResponse.json({
      success: true,
      data: bots,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

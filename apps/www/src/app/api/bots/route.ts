import { ClientBot } from "@/lib/bot";
import { authCheck, createSupabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET(req: Request) {
  try {
    const auth = await authCheck(req);
    if (!auth.success || !auth.user) {
      return NextResponse.json(
        {
          success: false,
          error: "common.unauthorized",
        },
        { status: 401 },
      );
    }

    const supabase = await createSupabaseServer();

    // Get bots from Supabase (limit to 20)
    const { data: botsData, error } = await supabase
      .from("bots")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "common.internal_error" },
        { status: 500 },
      );
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
        created_by: {
          name:
            botUser.user_metadata?.full_name || botUser.email || "Unknown User",
          verified: botUser.email_confirmed_at !== null,
          id: botUser.id,
        },
        created_at: new Date(bot.created_at).getTime(),
      });
    }

    return NextResponse.json({
      success: true,
      data: bots,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "common.internal_error" },
      { status: 500 },
    );
  }
}

const botCreateRequestSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
});

export async function PUT(req: Request) {
  try {
    const auth = await authCheck(req);
    if (!auth.success || !auth.user) {
      return NextResponse.json(
        {
          success: false,
          error: "common.unauthorized",
        },
        { status: 401 },
      );
    }

    const supabase = await createSupabaseServer();

    // Get the bot data from the request body
    const body = await req.json();
    const parsedBody = botCreateRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "common.invalid_request" },
        { status: 400 },
      );
    }

    const { name, description } = parsedBody.data;

    // Create bot id (random UUID)
    const botId = crypto.randomUUID();

    // Save bot data to Supabase
    const { error } = await supabase.from("bots").insert({
      id: botId,
      name,
      description,
      user_id: auth.user?.id,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "common.internal_error" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      botId,
      botUrl: `/bots/${botId}`,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "common.internal_error" },
      { status: 500 },
    );
  }
}

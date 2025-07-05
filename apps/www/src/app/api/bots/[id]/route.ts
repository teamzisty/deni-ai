import { BotSchema } from "@/lib/bot";
import { authCheck, createSupabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

  const { id } = await params;
  const supabase = await createSupabaseServer();

  try {
    // Get bot data from Supabase
    const { data: botData, error } = await supabase
      .from("bots")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !botData) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 });
    }

    // Check if the user is the owner of the bot
    const isOwner = botData.user_id === auth.user.id;

    const botUserData = await supabase.auth.admin.getUserById(botData.user_id);
    if (!botUserData.data.user) {
      return NextResponse.json({ error: "common.not_found" }, { status: 404 });
    }

    const botUser = botUserData.data.user;

    return NextResponse.json({
      success: true,
      data: {
        id: id,
        name: botData.name,
        description: botData.description,
        instructions: botData.instructions,
        system_instruction: isOwner ? botData.system_instruction : null,
        created_by: {
          name: botUser.user_metadata.name || "No Name",
          verified: botUser.email_confirmed_at !== null,
          id: botData.user_id,
        },
        created_at: new Date(botData.created_at).getTime(),
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "common.internal_error" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authCheck(req);
    if (!auth.success || !auth.user) {
      return NextResponse.json(
        { error: "common.unauthorized" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const parsedBody = BotSchema.partial().safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "common.invalid_request" },
        { status: 400 },
      );
    }
    const { id } = await params;
    
    const { name, description, system_instruction, instructions } =
      parsedBody.data;

    const supabase = await createSupabaseServer();

    // Check if bot exists and user is the owner
    const { data: botData, error: fetchError } = await supabase
      .from("bots")
      .select("user_id")
      .eq("id", id)
      .single();

    if (fetchError || !botData) {
      return NextResponse.json({ error: "common.not_found" }, { status: 404 });
    }

    if (botData.user_id !== auth.user.id) {
      return NextResponse.json(
        { error: "common.unauthorized" },
        { status: 403 },
      );
    }

    // Update bot data in Supabase
    const { error } = await supabase
      .from("bots")
      .update({
        name,
        description,
        system_instruction,
        instructions,
      })
      .eq("id", id);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "common.internal_error" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "common.internal_error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authCheck(req);
  if (!auth.success || !auth.user) {
    return NextResponse.json({ error: "common.unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = await createSupabaseServer();

  try {
    // Check if bot exists and user is the owner
    const { data: botData, error: fetchError } = await supabase
      .from("bots")
      .select("user_id")
      .eq("id", id)
      .single();

    if (fetchError || !botData) {
      return NextResponse.json({ error: "common.not_found" }, { status: 404 });
    }

    if (botData.user_id !== auth.user.id) {
      return NextResponse.json(
        { error: "common.unauthorized" },
        { status: 403 },
      );
    }

    // Delete bot from Supabase
    const { error } = await supabase.from("bots").delete().eq("id", id);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "common.internal_error" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "common.internal_error" },
      { status: 500 },
    );
  }
}

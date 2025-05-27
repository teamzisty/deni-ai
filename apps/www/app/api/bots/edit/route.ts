import { ServerBot } from "@/types/bot";
import { createSupabaseServerClient } from "@workspace/supabase-config/server";
import { NextResponse } from "next/server";

interface BotsCreateRequest extends ServerBot {
  id: string;
}

export async function POST(req: Request) {
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

    const { id, name, description, systemInstruction, createdBy, instructions }: BotsCreateRequest = await req.json();

    if (!id || !name || !description || !systemInstruction || !createdBy) {
      return NextResponse.json({ error: "Invalid Request" }, { status: 400 });
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

    // Update bot data in Supabase
    const { error } = await supabase
      .from('bots')
      .update({
        name,
        description,
        system_instruction: systemInstruction,
        instructions
      })
      .eq('id', id);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Database Error" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

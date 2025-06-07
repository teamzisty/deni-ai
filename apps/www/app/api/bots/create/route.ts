import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

interface BotsCreateRequest {
  name: string;
  description: string;
}

export async function POST(req: Request) {
  try {
    const authorization = req.headers.get("Authorization")?.replace("Bearer ", "");

    if (!authorization) {
      return NextResponse.json(
        { error: "Authorization Failed" },
        { status: 401 }
      );
    }    const supabase = await createSupabaseServerClient();
    
    // Verify the JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(authorization);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Authorization Failed" },
        { status: 401 }
      );
    }

    const { name, description }: BotsCreateRequest = await req.json();

    if (!name || !description) {
      return NextResponse.json({ error: "Invalid Request" }, { status: 400 });
    }    // Create bot id (random UUID)
    const botId = crypto.randomUUID();

    // Save bot data to Supabase
    const { error } = await supabase
      .from('bots')
      .insert({
        id: botId,
        name,
        description,
        user_id: user.id,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Database Error" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      botId,
      botUrl: `/bots/${botId}`,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

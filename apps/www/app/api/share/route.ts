import { createSupabaseServerClient } from "@workspace/supabase-config/server";
import { NextResponse } from "next/server";
import { UIMessage } from "ai";

interface ShareRequest {
  sessionId: string;
  title: string;
  messages: UIMessage[];
}

export async function POST(req: Request) {
  try {
    const authorization = req.headers.get("Authorization")?.replace("Bearer ", "");
    
    if (!authorization) {
      return NextResponse.json({ error: "Authorization Failed" }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();
    
    // Verify the JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(authorization);
    
    if (authError || !user) {
      return NextResponse.json({ error: "Authorization Failed" }, { status: 401 });
    }

    const { sessionId, title, messages }: ShareRequest = await req.json();

    if (!sessionId || !title || !messages || messages.length === 0) {
      return NextResponse.json({ error: "Invalid Request" }, { status: 400 });
    }

    // 共有IDを生成（ランダムなID）
    const shareId = crypto.randomUUID();

    // Supabaseに共有データを保存
    const { error } = await supabase
      .from('shared_conversations')
      .insert({
        id: shareId,
        session_id: sessionId,
        title,
        messages,
        uid: user.id,
        created_at: new Date().toISOString(),
        view_count: 0,
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
      shareId,
      shareUrl: `/shared/${shareId}`
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const shareId = url.searchParams.get("id");

    if (!shareId) {
      return NextResponse.json({ error: "Share ID is not specified" }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();

    // Supabaseから共有データを取得
    const { data: sharedChatData, error: fetchError } = await supabase
      .from('shared_conversations')
      .select('*')
      .eq('id', shareId)
      .single();

    if (fetchError || !sharedChatData) {
      return NextResponse.json({ error: "Specified shared chat not found" }, { status: 404 });
    }

    // 閲覧数をインクリメント
    const { error: updateError } = await supabase
      .from('shared_conversations')
      .update({
        view_count: (sharedChatData.view_count || 0) + 1,
      })
      .eq('id', shareId);

    if (updateError) {
      console.error("Error updating view count:", updateError);
    }

    return NextResponse.json({
      success: true,
      data: {
        title: sharedChatData.title,
        messages: sharedChatData.messages,
        createdAt: sharedChatData.created_at,
        viewCount: (sharedChatData.view_count || 0) + 1,
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
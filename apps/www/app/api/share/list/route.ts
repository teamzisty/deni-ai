import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // 共有チャットの一覧を取得（最新の50件）
    const { data: chats, error } = await supabase
      .from('shared_conversations')
      .select('id, title, created_at, view_count, messages')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: "Database Error" }, { status: 500 });
    }
    
    const formattedChats = chats?.map((chat) => ({
      id: chat.id,
      title: chat.title || "無題の会話",
      createdAt: chat.created_at,
      viewCount: chat.view_count || 0,
      messageCount: chat.messages?.length || 0,
    })) || [];

    return NextResponse.json({ 
      success: true, 
      chats: formattedChats
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
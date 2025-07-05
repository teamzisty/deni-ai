import { createSupabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { UIMessage } from "ai";
import { getApiTranslations } from "@/lib/api-i18n";

interface ShareRequest {
  sessionId: string;
  title: string;
  messages: UIMessage[];
}

export async function POST(req: Request) {
  const t = await getApiTranslations(req, 'common');
  try {
    const authorization = req.headers
      .get("Authorization")
      ?.replace("Bearer ", "");

    if (!authorization) {
      return NextResponse.json(
        { error: t('unauthorized') },
        { status: 401 },
      );
    }
    const supabase = await createSupabaseServer();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authorization);

    if (authError || !user) {
      return NextResponse.json(
        { error: t('unauthorized') },
        { status: 401 },
      );
    }

    const { sessionId, title, messages }: ShareRequest = await req.json();

    if (!sessionId || !title || !messages || messages.length === 0) {
      return NextResponse.json({ error: t('invalid_request') }, { status: 400 });
    }

    const shareId = crypto.randomUUID();

    const { error } = await supabase.from("shared_conversations").insert({
      id: shareId,
      session_id: sessionId,
      title,
      messages,
      user_id: user.id,
      created_at: new Date().toISOString(),
      view_count: 0,
    });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: t('database_error') }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      shareId,
      shareUrl: `/shared/${shareId}`,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: t('internal_error') }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const t = await getApiTranslations(req, 'common');
  try {
    const url = new URL(req.url);
    const shareId = url.searchParams.get("id");

    if (!shareId) {
      return NextResponse.json(
        { error: t('share_id_required') },
        { status: 400 },
      );
    }
    const supabase = await createSupabaseServer();

    const { data: sharedChatData, error: fetchError } = await supabase
      .from("shared_conversations")
      .select("*")
      .eq("id", shareId)
      .single();

    if (fetchError || !sharedChatData) {
      return NextResponse.json(
        { error: t('shared_chat_not_found') },
        { status: 404 },
      );
    }

    const { error: updateError } = await supabase
      .from("shared_conversations")
      .update({
        view_count: (sharedChatData.view_count || 0) + 1,
      })
      .eq("id", shareId);

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
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: t('internal_error') }, { status: 500 });
  }
}
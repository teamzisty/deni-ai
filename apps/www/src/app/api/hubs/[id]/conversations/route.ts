import { authCheck, createSupabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiTranslations } from "@/lib/api-i18n";

const AddConversationSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID is required"),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const t = await getApiTranslations(req, 'common');
  try {
    const auth = await authCheck(req);
    if (!auth.success || !auth.user) {
      return NextResponse.json(
        { error: t('unauthorized') },
        { status: 401 },
      );
    }

    const { id: hubId } = await params;
    const body = await req.json();
    const parsedBody = AddConversationSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: t('invalid_request') },
        { status: 400 },
      );
    }

    const { conversationId } = parsedBody.data;
    const supabase = await createSupabaseServer();

    // Check if hub exists and user is the owner
    const { data: hubData, error: hubError } = await supabase
      .from("hubs")
      .select("user_id, conversations")
      .eq("id", hubId)
      .single();

    if (hubError || !hubData) {
      return NextResponse.json({ error: t('hub_not_found') }, { status: 404 });
    }

    if (hubData.user_id !== auth.user.id) {
      return NextResponse.json(
        { error: t('unauthorized') },
        { status: 403 },
      );
    }

    // Check if conversation exists and belongs to the user
    const { data: conversationData, error: conversationError } = await supabase
      .from("chat_sessions")
      .select("id, user_id")
      .eq("id", conversationId)
      .single();

    if (conversationError || !conversationData) {
      return NextResponse.json(
        { error: t('conversation_not_found') },
        { status: 404 },
      );
    }

    if (conversationData.user_id !== auth.user.id) {
      return NextResponse.json(
        { error: t('unauthorized') },
        { status: 403 },
      );
    }

    // Add conversation to hub's conversations array
    const currentConversations = hubData.conversations || [];
    
    // Check if conversation is already in the hub
    if (currentConversations.includes(conversationId)) {
      return NextResponse.json(
        { error: t('conversation_already_in_hub') },
        { status: 400 },
      );
    }

    const updatedConversations = [...currentConversations, conversationId];

    // Update hub with new conversation
    const { error: updateError } = await supabase
      .from("hubs")
      .update({
        conversations: updatedConversations,
        updated_at: new Date().toISOString(),
      })
      .eq("id", hubId);

    if (updateError) {
      console.error("Error updating hub:", updateError);
      return NextResponse.json(
        { error: t('internal_error') },
        { status: 500 },
      );
    }

    // Update conversation to reference the hub
    const { error: conversationUpdateError } = await supabase
      .from("chat_sessions")
      .update({
        hub_id: hubId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversationId);

    if (conversationUpdateError) {
      console.error("Error updating conversation:", conversationUpdateError);
      return NextResponse.json(
        { error: t('internal_error') },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: t('conversation_added_to_hub'),
    });
  } catch (error) {
    console.error("Error adding conversation to hub:", error);
    return NextResponse.json(
      { error: t('internal_error') },
      { status: 500 },
    );
  }
}

const RemoveConversationSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID is required"),
});

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const t = await getApiTranslations(req, 'common');
  try {
    const auth = await authCheck(req);
    if (!auth.success || !auth.user) {
      return NextResponse.json(
        { error: t('unauthorized') },
        { status: 401 },
      );
    }

    const { id: hubId } = await params;
    const body = await req.json();
    const parsedBody = RemoveConversationSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: t('invalid_request') },
        { status: 400 },
      );
    }

    const { conversationId } = parsedBody.data;
    const supabase = await createSupabaseServer();

    // Check if hub exists and user is the owner
    const { data: hubData, error: hubError } = await supabase
      .from("hubs")
      .select("user_id, conversations")
      .eq("id", hubId)
      .single();

    if (hubError || !hubData) {
      return NextResponse.json({ error: t('hub_not_found') }, { status: 404 });
    }

    if (hubData.user_id !== auth.user.id) {
      return NextResponse.json(
        { error: t('unauthorized') },
        { status: 403 },
      );
    }

    // Remove conversation from hub's conversations array
    const currentConversations = hubData.conversations || [];
    const updatedConversations = currentConversations.filter(
      (id: string) => id !== conversationId,
    );

    // Update hub
    const { error: updateError } = await supabase
      .from("hubs")
      .update({
        conversations: updatedConversations,
        updated_at: new Date().toISOString(),
      })
      .eq("id", hubId);

    if (updateError) {
      console.error("Error updating hub:", updateError);
      return NextResponse.json(
        { error: t('internal_error') },
        { status: 500 },
      );
    }

    // Remove hub reference from conversation
    const { error: conversationUpdateError } = await supabase
      .from("chat_sessions")
      .update({
        hub_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversationId);

    if (conversationUpdateError) {
      console.error("Error updating conversation:", conversationUpdateError);
      return NextResponse.json(
        { error: t('internal_error') },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: t('conversation_removed_from_hub'),
    });
  } catch (error) {
    console.error("Error removing conversation from hub:", error);
    return NextResponse.json(
      { error: t('internal_error') },
      { status: 500 },
    );
  }
}
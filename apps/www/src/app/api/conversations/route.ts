import {
    Conversation,
  ConversationSchema,
  createConversation,
  deleteAllConversations,
  getConversation,
  getConversations,
  updateConversation,
} from "@/lib/conversations";
import { authCheck } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const userData = await authCheck(req);
  if (!userData.success || !userData.user) {
    return NextResponse.json(
      {
        success: false,
        error: "common.unauthorized",
      },
      { status: 401 },
    );
  }

  const conversations = await getConversations(userData.user.id);
  return NextResponse.json({
    success: true,
    data: conversations,
  });
}

export async function PUT(req: Request) {
  const userData = await authCheck(req);

  if (!userData.success || !userData.user) {
    return NextResponse.json(
      {
        success: false,
        error: "common.unauthorized",
      },
      { status: 401 },
    );
  }

  const conversation = await createConversation(userData.user.id);
  if (!conversation) {
    return NextResponse.json(
      {
        success: false,
        error: "chat.failed",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    data: conversation,
  });
}

export async function POST(req: Request) {
  const userData = await authCheck(req);
  if (!userData.success || !userData.user) {
    return NextResponse.json(
      {
        success: false,
        error: "common.unauthorized",
      },
      { status: 401 },
    );
  }

  const body = await req.json() as Partial<Conversation>;

  const { id } = body;
  if (!id) {
    return NextResponse.json(
      {
        success: false,
        error: "common.invalid_request",
      },
      { status: 400 },
    );
  }

  const conversation = await getConversation(id);
  if (!conversation) {
    return NextResponse.json(
      {
        success: false,
        error: "common.invalid_request",
      },
      { status: 404 },
    );
  }

  const newConversation = await updateConversation(id, body);
  if (!newConversation) {
    return NextResponse.json(
      {
        success: false,
        error: "chat.failed",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    data: newConversation,
  });
}

export async function DELETE(req: Request) {
  const userData = await authCheck(req);
  if (!userData.success || !userData.user) {
    return NextResponse.json(
      {
        success: false,
        error: "common.unauthorized",
      },
      { status: 401 },
    );
  }

  const success = await deleteAllConversations(userData.user.id);
  if (!success) {
    return NextResponse.json(
      {
        success: false,
        error: "chat.failed",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
  });
}
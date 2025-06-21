import { deleteConversation, getConversation } from "@/lib/conversations";
import { authCheck } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { _params }: { _params: Promise<{ id: string }> },
) {
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

  const params = await _params;

  if (!params.id) {
    return NextResponse.json(
      {
        success: false,
        error: "common.invalid_request",
      },
      { status: 400 },
    );
  }

  const conversation = await getConversation(params.id);
  if (!conversation) {
    return NextResponse.json(
      {
        success: false,
        error: "chat.not_found",
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    success: true,
    data: conversation,
  });
}


export async function DELETE(
  req: Request,
  { params: _params }: { params: Promise<{ id: string }> },
) {
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

  const params = await _params;

  if (!params.id) {
    return NextResponse.json(
      {
        success: false,
        error: "common.invalid_request",
      },
      { status: 400 },
    );
  }

  // Implement delete logic here if needed
  const success = await deleteConversation(params.id);
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
    message: "chat.success",
  });
}
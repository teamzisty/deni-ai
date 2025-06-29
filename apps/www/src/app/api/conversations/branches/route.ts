import {
  createBranchConversation,
  getBranches,
  getBranchTree,
  getConversation,
} from "@/lib/conversations";
import { authCheck } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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

  const body = await req.json();
  const { parentSessionId, branchName, includeMessages } = body;

  if (!parentSessionId || !branchName) {
    return NextResponse.json(
      {
        success: false,
        error: "common.invalid_request",
      },
      { status: 400 },
    );
  }

  // Get parent conversation to inherit messages if requested
  let parentMessages = [];
  if (includeMessages) {
    const parentConversation = await getConversation(parentSessionId);
    if (parentConversation) {
      parentMessages = parentConversation.messages;
    }
  }

  const branchConversation = await createBranchConversation(
    userData.user.id,
    parentSessionId,
    branchName,
    parentMessages
  );

  if (!branchConversation) {
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
    data: branchConversation,
  });
}

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

  const url = new URL(req.url);
  const parentSessionId = url.searchParams.get("parentSessionId");
  const tree = url.searchParams.get("tree") === "true";

  if (!parentSessionId) {
    return NextResponse.json(
      {
        success: false,
        error: "common.invalid_request",
      },
      { status: 400 },
    );
  }

  if (tree) {
    const branchTree = await getBranchTree(parentSessionId);
    return NextResponse.json({
      success: true,
      data: branchTree,
    });
  } else {
    const branches = await getBranches(parentSessionId);
    return NextResponse.json({
      success: true,
      data: branches,
    });
  }
}
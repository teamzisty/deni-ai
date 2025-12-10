import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createChatFromRequest } from "@/server/chat-manager";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ message: string }> },
) {
  try {
    const headersList = await headers();

    // Create a new chat and redirect to its route with the provided message as a query parameter
    const chatId = await createChatFromRequest(headersList);

    const resolvedParams = await params;
    const baseUrl = new URL(request.url);
    const redirectUrl = new URL(
      `/chat/${chatId}?message=${encodeURIComponent(resolvedParams.message)}`,
      baseUrl.origin,
    );
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }
    console.error("[GET /new/[message]] Error creating chat:", error);
    return NextResponse.json(
      { error: "Failed to create chat" },
      { status: 500 },
    );
  }
}

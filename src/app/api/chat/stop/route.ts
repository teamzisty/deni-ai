import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { stopChatGeneration } from "@/lib/chat-generation";

export async function POST(req: Request) {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  const userId = session?.session?.userId;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsedBody = z
    .object({
      id: z.string().min(1),
    })
    .safeParse(await req.json());

  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  stopChatGeneration(parsedBody.data.id, userId);

  return NextResponse.json({ ok: true });
}

import type { UIMessage } from "ai";
import { safeValidateUIMessages } from "ai";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ChatInterface } from "@/components/chat/chat-interface";
import { db } from "@/db/drizzle";
import { chats } from "@/db/schema";
import { auth } from "@/lib/auth";

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.session?.userId;

  if (!userId) {
    redirect("/auth/sign-in");
  }

  const { id } = await params;

  const [chat] = await db
    .select()
    .from(chats)
    .where(and(eq(chats.id, id), eq(chats.uid, userId)));

  if (!chat) {
    redirect("/app");
  }

  const validatedMessages = await safeValidateUIMessages<UIMessage>({
    messages: (chat.messages as UIMessage[]) ?? [],
  });

  const initialMessages = validatedMessages.success ? validatedMessages.data : [];

  return <ChatInterface id={id} initialMessages={initialMessages} />;
}

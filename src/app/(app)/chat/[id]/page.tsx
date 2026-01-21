import type { UIMessage } from "ai";
import { safeValidateUIMessages } from "ai";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";

const ChatInterface = dynamic(
  () => import("@/components/chat/chat-interface").then((mod) => mod.ChatInterface),
  {
    loading: () => (
      <div className="flex min-h-[60vh] w-full items-center justify-center text-sm text-muted-foreground">
        Loading chat…
      </div>
    ),
  },
);
import { db } from "@/db/drizzle";
import { chats } from "@/db/schema";
import { auth } from "@/lib/auth";

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const headersPromise = headers();
  const sessionPromise = headersPromise.then((headersList) =>
    auth.api.getSession({ headers: headersList }),
  );
  const [session, resolvedParams] = await Promise.all([sessionPromise, params]);
  const userId = session?.session?.userId;

  if (!userId) {
    redirect("/auth/sign-in");
  }

  const { id } = resolvedParams;

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

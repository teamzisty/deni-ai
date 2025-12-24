import type { UIMessage } from "ai";
import { safeValidateUIMessages } from "ai";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { SharedChatInterface } from "@/components/chat/shared-chat-interface";
import { db } from "@/db/drizzle";
import { chatShareRecipients, chatShares, chats, user } from "@/db/schema";
import { auth } from "@/lib/auth";

export default async function SharedChatPage({
  params,
}: {
  params: Promise<{ shareId: string }>;
}) {
  const { shareId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.session?.userId;

  const [share] = await db
    .select()
    .from(chatShares)
    .where(eq(chatShares.id, shareId));

  if (!share) {
    notFound();
  }

  // Private shares require authentication
  if (share.visibility === "private") {
    if (!userId) {
      redirect("/auth/sign-in");
    }

    if (userId !== share.ownerId) {
      const [recipient] = await db
        .select()
        .from(chatShareRecipients)
        .where(
          and(
            eq(chatShareRecipients.shareId, share.id),
            eq(chatShareRecipients.recipientId, userId),
          ),
        );

      if (!recipient) {
        notFound();
      }
    }
  }

  const [chat] = await db
    .select()
    .from(chats)
    .where(eq(chats.id, share.chatId));

  if (!chat) {
    notFound();
  }

  const [owner] = await db
    .select({ id: user.id, name: user.name, image: user.image })
    .from(user)
    .where(eq(user.id, share.ownerId));

  const validatedMessages = await safeValidateUIMessages<UIMessage>({
    messages: (chat.messages as UIMessage[]) ?? [],
  });

  const messages = validatedMessages.success ? validatedMessages.data : [];

  return (
    <SharedChatInterface
      shareId={shareId}
      chat={chat}
      messages={messages}
      owner={owner}
      allowFork={share.allowFork}
      isOwner={userId === share.ownerId}
      isLoggedIn={!!userId}
    />
  );
}

import type { UIMessage } from "ai";
import { safeValidateUIMessages } from "ai";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import dynamic from "next/dynamic";

const SharedChatInterface = dynamic(
  () => import("@/components/chat/shared-chat-interface").then((mod) => mod.SharedChatInterface),
  {
    loading: () => (
      <div className="flex min-h-[60vh] w-full items-center justify-center text-sm text-muted-foreground">
        Loading shared chat…
      </div>
    ),
  },
);
import { db } from "@/db/drizzle";
import { chatShareRecipients, chatShares, chats, user } from "@/db/schema";
import { auth } from "@/lib/auth";

export default async function SharedChatPage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;
  const headersPromise = headers();
  const sharePromise = db.select().from(chatShares).where(eq(chatShares.id, shareId));
  const sessionPromise = headersPromise.then((headersList) =>
    auth.api.getSession({ headers: headersList }),
  );

  const [session, shareRows] = await Promise.all([sessionPromise, sharePromise]);
  const userId = session?.session?.userId;
  const [share] = shareRows;

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

  const [chatRows, ownerRows] = await Promise.all([
    db.select().from(chats).where(eq(chats.id, share.chatId)),
    db
      .select({ id: user.id, name: user.name, image: user.image })
      .from(user)
      .where(eq(user.id, share.ownerId)),
  ]);

  const [chat] = chatRows;
  const [owner] = ownerRows;

  if (!chat) {
    notFound();
  }

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

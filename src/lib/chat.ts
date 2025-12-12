import "server-only";

import type { UIMessage } from "ai";
import { eq } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { chats } from "@/db/schema";

type ChatUpdateFields = Partial<typeof chats.$inferInsert>;

export async function updateChat(id: string, messages: UIMessage[]) {
  const updates: ChatUpdateFields = {
    // structuredClone keeps parts/metadata intact while ensuring the payload is serializable for JSONB
    messages: structuredClone(messages),
    updated_at: new Date(),
  };

  const [updatedChat] = await db
    .update(chats)
    .set(updates)
    .where(eq(chats.id, id))
    .returning({ id: chats.id });

  if (!updatedChat) {
    throw new Error("Chat not found");
  }

  return updatedChat.id;
}

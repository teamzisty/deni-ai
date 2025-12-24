import "server-only";

import { groq } from "@ai-sdk/groq";
import { generateText, type UIMessage } from "ai";
import { eq } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { chats } from "@/db/schema";

type ChatUpdateFields = Partial<typeof chats.$inferInsert>;

export async function generateTitle(messages: UIMessage[]): Promise<string> {
  const userMessage = messages.find((m) => m.role === "user");
  if (!userMessage) {
    return "New Chat";
  }

  // Extract text content from parts
  const textParts = userMessage.parts
    .filter(
      (part): part is { type: "text"; text: string } => part.type === "text",
    )
    .map((part) => part.text)
    .join(" ");

  if (!textParts) {
    return "New Chat";
  }

  const { text } = await generateText({
    model: groq("openai/gpt-oss-20b"),
    system:
      "You are a title generator. Generate a short, concise title (max 50 characters) for the conversation based on the user's first message. Output only the title, nothing else. No quotes, no explanation.",
    prompt: textParts.slice(0, 500),
  });

  return text.trim().slice(0, 50) || "New Chat";
}

export async function getChatById(id: string) {
  const [chat] = await db.select().from(chats).where(eq(chats.id, id));
  return chat;
}

export async function updateChat(
  id: string,
  messages: UIMessage[],
  title?: string,
) {
  const updates: ChatUpdateFields = {
    // structuredClone keeps parts/metadata intact while ensuring the payload is serializable for JSONB
    messages: structuredClone(messages),
    updated_at: new Date(),
  };

  if (title) {
    updates.title = title;
  }

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

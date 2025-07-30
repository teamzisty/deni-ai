import { UIMessage } from "@ai-sdk/react";
import { db, chatSessions, ChatSession, NewChatSession } from "./db";
import { BotSchema, ClientBot } from "./bot";
import { eq, desc, asc } from "drizzle-orm";
import z from "zod/v4";

export interface Conversation {
  id: string;
  userId: string | null;
  title: string | null;
  messages: UIMessage[];
  createdAt: Date;
  updatedAt: Date;
  bot?: ClientBot;
  parentSessionId?: string | null;
  branchName?: string | null;
  hubId?: string | null;
}

export const ConversationSchema = z.object({
  id: z.string(),
  userId: z.string().nullable(),
  title: z.string().nullable(),
  messages: z.array(z.any()),
  createdAt: z.date(),
  updatedAt: z.date(),
  bot: BotSchema.optional(),
  parentSessionId: z.string().nullable().optional(),
  branchName: z.string().nullable().optional(),
  hubId: z.string().nullable().optional(),
});

export async function updateConversation(
  id: string,
  updates: Partial<Conversation>,
): Promise<Conversation | null> {
  try {
    const updateData: Partial<NewChatSession> = {};
    
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.messages !== undefined) updateData.messages = updates.messages;
    if (updates.bot !== undefined) updateData.bot = updates.bot;
    if (updates.parentSessionId !== undefined) updateData.parentSessionId = updates.parentSessionId;
    if (updates.branchName !== undefined) updateData.branchName = updates.branchName;
    if (updates.hubId !== undefined) updateData.hubId = updates.hubId;
    
    updateData.updatedAt = new Date();

    const [conversation] = await db
      .update(chatSessions)
      .set(updateData)
      .where(eq(chatSessions.id, id))
      .returning();

    if (!conversation) return null;

    return {
      id: conversation.id,
      userId: conversation.userId,
      title: conversation.title,
      messages: (conversation.messages as UIMessage[]) || [],
      createdAt: conversation.createdAt!,
      updatedAt: conversation.updatedAt!,
      bot: conversation.bot as ClientBot | undefined,
      parentSessionId: conversation.parentSessionId,
      branchName: conversation.branchName,
      hubId: conversation.hubId,
    };
  } catch (error) {
    console.error("Error updating conversation:", error);
    return null;
  }
}

export async function updateConversationMessages(
  id: string,
  messages: UIMessage[],
): Promise<Conversation | null> {
  try {
    const [conversation] = await db
      .update(chatSessions)
      .set({
        messages: messages,
        updatedAt: new Date(),
      })
      .where(eq(chatSessions.id, id))
      .returning();

    if (!conversation) return null;

    return {
      id: conversation.id,
      userId: conversation.userId,
      title: conversation.title,
      messages: (conversation.messages as UIMessage[]) || [],
      createdAt: conversation.createdAt!,
      updatedAt: conversation.updatedAt!,
      bot: conversation.bot as ClientBot | undefined,
      parentSessionId: conversation.parentSessionId,
      branchName: conversation.branchName,
      hubId: conversation.hubId,
    };
  } catch (error) {
    console.error("Error updating conversation messages:", error);
    return null;
  }
}

export async function getConversation(
  id: string,
): Promise<Conversation | null> {
  try {
    const [session] = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.id, id))
      .limit(1);

    if (!session) return null;

    return {
      id: session.id,
      userId: session.userId,
      title: session.title,
      messages: (session.messages as UIMessage[]) || [],
      createdAt: session.createdAt!,
      updatedAt: session.updatedAt!,
      bot: session.bot as ClientBot | undefined,
      parentSessionId: session.parentSessionId,
      branchName: session.branchName,
      hubId: session.hubId,
    };
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return null;
  }
}

export async function getConversations(
  userId: string,
): Promise<Conversation[]> {
  try {
    const sessions = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.userId, userId))
      .orderBy(desc(chatSessions.createdAt));

    return sessions.map(session => ({
      id: session.id,
      userId: session.userId,
      title: session.title,
      messages: (session.messages as UIMessage[]) || [],
      createdAt: session.createdAt!,
      updatedAt: session.updatedAt!,
      bot: session.bot as ClientBot | undefined,
      parentSessionId: session.parentSessionId,
      branchName: session.branchName,
      hubId: session.hubId,
    }));
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return [];
  }
}

export async function deleteConversation(id: string): Promise<boolean> {
  try {
    await db
      .delete(chatSessions)
      .where(eq(chatSessions.id, id));

    return true;
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return false;
  }
}

export async function deleteAllConversations(userId: string): Promise<boolean> {
  try {
    await db
      .delete(chatSessions)
      .where(eq(chatSessions.userId, userId));

    return true;
  } catch (error) {
    console.error("Error deleting all conversations:", error);
    return false;
  }
}

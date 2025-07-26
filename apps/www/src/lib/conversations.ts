import { Message, UIMessage } from "ai";
import { createSupabaseServer } from "./supabase/server";
import { BotSchema, ClientBot } from "./bot";
import z from "zod/v4";

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  messages: UIMessage[];
  created_at: string;
  updated_at: string;
  bot?: ClientBot;
  parentSessionId?: string;
  branchName?: string;
  hub_id?: string;
}

export const ConversationSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  title: z.string(),
  messages: z.array(z.any()),
  created_at: z.string(),
  updated_at: z.string(),
  bot: BotSchema.optional(),
  parentSessionId: z.string().optional(),
  branchName: z.string().optional(),
  hub_id: z.string().optional(),
});

export async function createConversation(
  userId: string,
  bot?: ClientBot,
): Promise<Conversation | null> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("chat_sessions")
    .insert({
      user_id: userId,
      title: "New Session",
      messages: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      bot,
    })
    .select("*")
    .single();

  if (error) {
    console.error("Error creating conversation:", error);
    return null;
  }

  return data;
}

export async function createBranchConversation(
  userId: string,
  parentSessionId: string,
  branchName: string,
  parentMessages?: any[],
): Promise<Conversation | null> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("chat_sessions")
    .insert({
      user_id: userId,
      title: `Branch: ${branchName}`,
      messages: parentMessages || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      parentSessionId,
      branchName,
    })
    .select("*")
    .single();
  if (error) {
    console.error("Error creating branch conversation:", error);
    return null;
  }
  return data;
}

export async function getBranches(
  parentSessionId: string,
): Promise<Conversation[]> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("parentSessionId", parentSessionId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching branches:", error);
    return [];
  }

  return data || [];
}

export async function getBranchTree(conversationId: string): Promise<{
  root: Conversation | null;
  branches: Conversation[];
}> {
  const supabase = await createSupabaseServer();

  // Get the root conversation
  const rootConversation = await getConversation(conversationId);

  // Get all branches for this conversation
  const branches = await getBranches(conversationId);

  return {
    root: rootConversation,
    branches,
  };
}

export async function updateConversation(
  id: string,
  updates: Partial<Conversation>,
): Promise<Conversation | null> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("chat_sessions")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("Error updating conversation:", error);
    return null;
  }

  return data;
}

export async function updateConversationMessages(
  id: string,
  messages: Message[],
): Promise<Conversation | null> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("chat_sessions")
    .update({
      messages: messages,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    console.error("Error updating conversation messages:", error);
    return null;
  }
  return data;
}

export async function getConversation(
  id: string,
): Promise<Conversation | null> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching conversation:", error);
    return null;
  }

  return data;
}

export async function getConversations(
  userId: string,
): Promise<Conversation[]> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching conversations:", error);
    return [];
  }

  return data;
}

export async function deleteConversation(id: string): Promise<boolean> {
  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("chat_sessions").delete().eq("id", id);

  if (error) {
    console.error("Error deleting conversation:", error);
    return false;
  }

  return true;
}

export async function deleteAllConversations(userId: string): Promise<boolean> {
  const supabase = await createSupabaseServer();
  const { error } = await supabase
    .from("chat_sessions")
    .delete()
    .eq("user_id", userId);

  if (error) {
    console.error("Error deleting all conversations:", error);
    return false;
  }

  return true;
}

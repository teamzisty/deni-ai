import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabase/server";

interface StreamRecord {
  chatId: string;
  streamId: string;
  createdAt: Date;
}

/**
 * Check if Redis is available for resumable streams
 */
export function isRedisAvailable(): boolean {
  return !!process.env.REDIS_URL;
}

/**
 * Load all stream IDs for a given chat ID
 * Returns empty array if Redis is not available
 */
export async function loadStreams(chatId: string): Promise<string[]> {
  if (!isRedisAvailable()) {
    console.log("Redis not available, skipping stream loading");
    return [];
  }

  try {
    const supabase = await createSupabaseServiceRoleClient();

    const { data, error } = await supabase
      .from("chat_streams")
      .select("stream_id")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading streams:", error);
      return [];
    }

    return data?.map((record) => record.stream_id) || [];
  } catch (error) {
    console.error("Error in loadStreams:", error);
    return [];
  }
}

/**
 * Append a new stream ID to a chat
 * Does nothing if Redis is not available
 */
export async function appendStreamId({
  chatId,
  streamId,
}: {
  chatId: string;
  streamId: string;
}): Promise<void> {
  if (!isRedisAvailable()) {
    console.log("Redis not available, skipping stream ID recording");
    return;
  }

  try {
    const supabase = await createSupabaseServiceRoleClient();

    const { error } = await supabase.from("chat_streams").insert({
      chat_id: chatId,
      stream_id: streamId,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error appending stream ID:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in appendStreamId:", error);
    throw error;
  }
}

/**
 * Get messages by chat ID
 */
export async function getMessagesByChatId({
  id,
}: {
  id: string;
}): Promise<any[]> {
  try {
    const supabase = await createSupabaseServiceRoleClient();

    const { data, error } = await supabase
      .from("chat_sessions")
      .select("messages")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error getting messages by chat ID:", error);
      return [];
    }

    return data?.messages || [];
  } catch (error) {
    console.error("Error in getMessagesByChatId:", error);
    return [];
  }
}

/**
 * Save a chat session
 */
export async function saveChat({
  id,
  messages,
}: {
  id: string;
  messages: any[];
}): Promise<void> {
  try {
    const supabase = await createSupabaseServiceRoleClient();

    const { error } = await supabase.from("chat_sessions").upsert({
      id,
      messages,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error saving chat:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in saveChat:", error);
    throw error;
  }
}

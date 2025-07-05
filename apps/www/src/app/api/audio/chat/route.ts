import { openai } from "@ai-sdk/openai";
import {
  convertToCoreMessages,
  createDataStreamResponse,
  streamText,
} from "ai";
import { authCheck } from "@/lib/supabase/server";
import z from "zod/v4";
import { Bot } from "@/lib/bot";

const chatRequestSchema = z.object({
  messages: z.any(),
});

export async function POST(request: Request) {
  const { user, success } = await authCheck(request);
  if (!success && !user) {
    return new Response("common.unauthorized", { status: 401 });
  }

  const body = await request.json();

  if (!body.messages || !Array.isArray(body.messages)) {
    return new Response("common.invalid_request", { status: 400 });
  }

  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    console.error("Invalid request body:", parsed.error);
    return new Response("common.invalid_request", { status: 400 });
  }
  const {
    messages,
  } = parsed.data;

  const coreMessages = convertToCoreMessages(messages);

  // Process the chat request here
  return createDataStreamResponse({
    execute: async (dataStream) => {
      const response = streamText({
        messages: coreMessages,
        model: openai("gpt-4.1-nano"),
      });

      response.consumeStream();

      response.mergeIntoDataStream(dataStream, {
        sendReasoning: true,
        sendUsage: false,
      });
    },
    onError: (error) => {
      if (process.env.NODE_ENV === "development") {
        console.error("Error: " + error);
        return "Error: " + error;
      } else {
        console.error("Error in chat response:", error);
        return "An error occurred while processing your request.";
      }
    },
  });
}

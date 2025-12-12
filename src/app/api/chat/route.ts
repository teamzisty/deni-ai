import { anthropic } from "@ai-sdk/anthropic";
import { type GoogleGenerativeAIProviderOptions, google } from "@ai-sdk/google";
import {
  createOpenAI,
  type OpenAIResponsesProviderOptions,
  openai,
} from "@ai-sdk/openai";
import {
  convertToModelMessages,
  type LanguageModel,
  safeValidateUIMessages,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
} from "ai";
import { checkBotId } from "botid/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { searchDuckDuckGo } from "ts-duckduckgo-search";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { updateChat } from "@/lib/chat";
import { models } from "@/lib/constants";
import {
  consumeUsage,
  getUsageSummary,
  type UsageCategory,
  UsageLimitError,
} from "@/lib/usage";

const UIMessagesSchema = z
  .array(z.record(z.string(), z.unknown()))
  .transform((value) => value as unknown as UIMessage[]);

export async function POST(req: Request) {
  const verification = await checkBotId();

  if (verification.isBot) {
    return NextResponse.json(
      { error: "Could not verify you are human." },
      { status: 403 },
    );
  }

  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  const userId = session?.session?.userId;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsedBody = z
    .object({
      id: z.string().min(1),
      messages: UIMessagesSchema.optional(),
      model: z.string(),
      webSearch: z.boolean().optional(),
    })
    .safeParse(body);

  if (!parsedBody.success) {
    console.log(parsedBody.error);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const { id, messages: rawMessages = [], model: baseModel } = parsedBody.data;

  const validatedMessages = await safeValidateUIMessages<UIMessage>({
    messages: rawMessages,
  });

  if (!validatedMessages.success) {
    return NextResponse.json(
      { error: "Invalid messages payload" },
      { status: 400 },
    );
  }

  const messages = validatedMessages.data;
  const voids = createOpenAI({
    apiKey:
      "do you want to know the api key? this application is working without the api key",
    baseURL: "https://capi.voids.top/v2",
  });

  const selectedModel = models.find((m) => m.value === baseModel);
  const usageCategory: UsageCategory = selectedModel?.premium
    ? "premium"
    : "basic";

  try {
    const usageSummary = await getUsageSummary({ userId });
    const categoryUsage = usageSummary.usage.find(
      (usage) => usage.category === usageCategory,
    );

    if (categoryUsage?.remaining && categoryUsage.remaining <= 0) {
      throw new UsageLimitError("You've hit the usage limit for your plan.");
    }
  } catch (error) {
    if (error instanceof UsageLimitError) {
      return NextResponse.json(
        { error: error.message, reason: "usage_limit" },
        { status: 402 },
      );
    }

    console.error("Failed to check usage", error);
    return NextResponse.json(
      { error: "Unable to check usage" },
      { status: 500 },
    );
  }

  let model: LanguageModel;
  switch (selectedModel?.author) {
    case "openai":
      model = openai(selectedModel.value);
      break;
    case "anthropic":
      model = anthropic(selectedModel.value);
      break;
    case "google":
      model = google(selectedModel.value);
      break;
    default:
      model = voids.chat(selectedModel?.value ?? "gpt-5.1-2025-11-13");
      break;
  }

  const result = streamText({
    model: model,
    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(50),
    tools: {
      search: tool({
        description: "Surf web and get page summary",
        inputSchema: z.object({
          query: z.string().describe("Search query"),
          amount: z
            .number()
            .min(5)
            .max(15)
            .describe("Number of search pages (min 5, max 15)"),
        }),
        execute: async ({ query, amount }) => {
          console.log(query, amount);
          const searchResults = await searchDuckDuckGo(query, {
            maxResults: amount || 5,
          });

          return searchResults;
        },
      }),
    },
    providerOptions: {
      openai: {
        reasoningEffort: "high",
        reasoningSummary: "detailed",
      } satisfies OpenAIResponsesProviderOptions,
      google: {
        thinkingConfig: {
          thinkingLevel: "high",
          includeThoughts: true,
        },
      } satisfies GoogleGenerativeAIProviderOptions,
    },
    system:
      "You are a helpful assistant that can answer questions and help with tasks",
  });

  // send sources and reasoning back to the client
  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    sendSources: true,
    sendReasoning: true,
    onFinish: async ({ messages: updatedMessages }) => {
      await updateChat(id, updatedMessages);

      try {
        await consumeUsage({
          userId,
          category: usageCategory,
        });
      } catch (error) {
        console.error("Failed to record usage", error);
      }
    },
  });
}

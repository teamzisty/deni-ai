import { internalModels, models } from "@/lib/constants";
import {
  getConversation,
  updateConversation,
  updateConversationMessages,
} from "@/lib/conversations";
import { search as baseSearch, canvas } from "@/lib/tools";
import { openai, OpenAIResponsesProviderOptions } from "@ai-sdk/openai";
import { anthropic, AnthropicProviderOptions } from "@ai-sdk/anthropic";
import { google, GoogleGenerativeAIProviderOptions } from "@ai-sdk/google";
import { xai } from "@ai-sdk/xai";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { groq } from "@ai-sdk/groq";
import {
  appendResponseMessages,
  convertToCoreMessages,
  createDataStreamResponse,
  generateText,
  LanguageModelV1,
  streamText,
} from "ai";
import { authCheck } from "@/lib/supabase/server";
import { canUseModel, recordUsage } from "@/lib/usage";
import z from "zod/v4";
import { Bot, getBot } from "@/lib/bot";

const chatRequestSchema = z.object({
  id: z.string(),
  messages: z.any(),
  model: z.string(),
  botId: z.string().optional(),
  thinkingEffort: z.string().optional(),
  canvas: z.boolean().optional(),
  search: z.boolean().optional(),
  researchMode: z.enum(["disabled", "shallow", "deep", "deeper"]),
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
    id,
    messages,
    botId,
    model: _model,
    thinkingEffort,
    canvas: enableCanvas,
    search: enableSearch,
    researchMode,
  } = parsed.data;
  const model = models[_model];
  if (!model) {
    return new Response("common.invalid_request", { status: 404 });
  }
  const modelId = model.id;

  let sdkModel: LanguageModelV1;
  switch (model.provider) {
    case "openai":
      sdkModel = openai.responses(modelId);
      break;
    case "anthropic":
      sdkModel = anthropic(modelId);
      break;
    case "google":
      sdkModel = google(modelId);
      break;
    case "xai":
      sdkModel = xai(modelId);
      break;
    case "openrouter":
      sdkModel = openrouter(modelId);
      break;
    case "groq":
      sdkModel = groq(modelId);
      break;
    default:
      return new Response("common.invalid_request", { status: 400 });
  }

  const coreMessages = convertToCoreMessages(messages);
  try {
    const canUse = await canUseModel(user!.id, _model);
    if (!canUse) {
      return new Response("chat.model_limit_reached", { status: 403 });
    }
  } catch (error) {
    return new Response("common.internal_error", { status: 500 });
  }

  // Only fetch conversation if we need to check the title
  let shouldGenerateTitle = false;
  let bot: Bot | undefined | null;
  let titleGeneration: Promise<string> | undefined;

  if (id) {
    try {
      const conversation = await getConversation(id);
      if (!conversation) {
        return new Response("common.invalid_request", { status: 404 });
      }

      shouldGenerateTitle =
        conversation.title === "New Session" && coreMessages.length > 0;
    } catch (error) {
      console.error("Error fetching conversation:", error);
      return new Response("common.internal_error", { status: 500 });
    }
  } else {
    return new Response("common.invalid_request", { status: 404 });
  }

  if (botId) {
    try {
      bot = await getBot(botId);
      if (!bot) {
        return new Response("common.invalid_request", { status: 404 });
      }
    } catch (error) {
      console.error("Error fetching bot:", error);
      return new Response("common.internal_error", { status: 500 });
    }
  }

  if (shouldGenerateTitle) {
    const lastMessageContent = coreMessages[coreMessages.length - 1]?.content;
    const promptText =
      typeof lastMessageContent === "string"
        ? lastMessageContent
        : Array.isArray(lastMessageContent)
          ? lastMessageContent
              .map((part) => ("text" in part ? part.text : ""))
              .join(" ")
          : "Simple conversation";

    // Generate title asynchronously to avoid blocking the stream
    titleGeneration = generateText({
      prompt: promptText || "Simple conversation",
      model: google(
        internalModels["title-model"]?.id ||
          "gemini-2.5-flash-lite-preview-06-17",
      ),
      system:
        "generates titles for conversations. simple and concise, no more than 5 words. no punctuation. no sorry, generate a title related user message.",
    })
      .then(async (generatedTitle) => {
        await updateConversation(id, {
          title: generatedTitle.text,
        });
        return generatedTitle.text;
      })
      .catch(() => "Untitled Conversation");
  }

  const thinkingBudget = thinkingEffort
    ? thinkingEffort === "disabled"
      ? 0
      : thinkingEffort === "low"
        ? 2500
        : thinkingEffort === "medium"
          ? 5000
          : 10000
    : 0;

  // Process the chat request here
  return createDataStreamResponse({
    execute: async (dataStream) => {
      // Send title when it's ready
      if (shouldGenerateTitle && titleGeneration) {
        titleGeneration.then((generatedTitle) => {
          dataStream.writeData({ title: generatedTitle });
        });
      }

      // Configure tools based on user settings
      const tools: any = {};
      if (enableSearch || researchMode !== "disabled") {
        // Create a search tool that automatically uses the research mode depth
        tools.search = {
          ...baseSearch,
          execute: async (params: any, options: any) => {
            const depth =
              researchMode !== "disabled" ? researchMode : undefined;
            return baseSearch.execute({ ...params, depth }, options);
          },
        };
      }
      if (enableCanvas) {
        tools.canvas = canvas;
      }

      // Add research-specific system prompts
      let systemPrompt = "You are Deni AI.";

      coreMessages.unshift({
        role: "system",
        content: systemPrompt,
      });

      const response = streamText({
        messages: coreMessages,
        model: sdkModel,
        tools,
        toolCallStreaming: true,
        maxSteps: 30,
        providerOptions: {
          openai: {
            thinkingEffort: thinkingEffort || "medium",
            reasoningSummary: "detailed",
          } as OpenAIResponsesProviderOptions,
          google: {
            thinkingConfig: {
              thinkingBudget: thinkingBudget,
              includeThoughts: true,
            },
          } as GoogleGenerativeAIProviderOptions,
          anthropic: {
            thinking: {
              type: thinkingEffort === "disabled" ? "disabled" : "enabled",
              budgetTokens: thinkingBudget,
            },
          } as AnthropicProviderOptions,
        },
        onFinish: async ({ response: result }) => {
          await updateConversationMessages(
            id,
            appendResponseMessages({
              messages,
              responseMessages: result.messages,
            }),
          );
          await recordUsage(user!.id, _model);
        },
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

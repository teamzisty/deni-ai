import { createModel, getSystemPrompt, internalModels, models, SYSTEM_PROMPT } from "@/lib/constants";
import {
  getConversation,
  updateConversation,
} from "@/lib/conversations";
import { search as baseSearch, canvas } from "@/lib/tools";
import { VoidsAI } from "@workspace/voids-ai-provider"
import { openrouter } from "@openrouter/ai-sdk-provider";
import { groq } from "@ai-sdk/groq";
import { openai, OpenAIResponsesProviderOptions } from "@ai-sdk/openai";
import { anthropic, AnthropicProviderOptions } from "@ai-sdk/anthropic";
import { google, GoogleGenerativeAIProviderOptions } from "@ai-sdk/google";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  extractReasoningMiddleware,
  generateId,
  generateText,
  LanguageModel,
  stepCountIs,
  streamText,
  wrapLanguageModel,
  smoothStream,
} from "ai";
import { auth } from "@/lib/auth";
import { canUseModel } from "@/lib/usage";
import z from "zod/v4";
import { Bot, getBot } from "@/lib/bot";
import { features } from "process";

const chatRequestSchema = z.object({
  conversationId: z.string(),
  messages: z.any(),
  model: z.string(),
  botId: z.string().optional(),
  thinkingEffort: z.string().optional(),
  canvas: z.boolean().optional(),
  search: z.boolean().optional(),
  researchMode: z.enum(["disabled", "shallow", "deep", "deeper"]),
});

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  if (!session?.user) {
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
    conversationId,
    messages,
    botId,
    model: _model,
    thinkingEffort,
    canvas: enableCanvas,
    search: enableSearch,
    researchMode,
  } = parsed.data;
  console.log("Received model from client:", _model);
  const model = models[_model];
  if (!model) {
    console.log("Model not found in models object:", _model);
    return new Response("common.invalid_request", { status: 404 });
  }
  const modelId = model.id;

  let sdkModel: LanguageModel;
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
    case "openrouter":
      sdkModel = openrouter(modelId);
      break;
    case "groq":
      sdkModel = groq(modelId);
      break;
    case "voids":
      sdkModel = VoidsAI(modelId);
      break;
    default:
      sdkModel = VoidsAI(modelId);
  }

  const coreMessages = convertToModelMessages(messages);
  try {
    const canUse = await canUseModel(session.user.id, _model);
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

  if (conversationId) {
    try {
      const conversation = await getConversation(conversationId);
      if (!conversation) {
        console.log("conversation not found", conversationId);
        return new Response("common.invalid_request", { status: 404 });
      }

      shouldGenerateTitle =
        conversation.title === "New Conversation" && coreMessages.length >= 1;
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

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
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
        const titleModelId = internalModels["title-model"];
        if (!titleModelId || !models[titleModelId]) {
          console.error("Title model not found");
          return;
        }
        
        titleGeneration = generateText({
          prompt: promptText || "Simple conversation",
          model: createModel(models[titleModelId]),
          system:
            "generates titles for conversations. simple and concise, no more than 5 words. no punctuation. no sorry, generate a title related user message.",
        })
          .then(async (generatedTitle) => {
            await updateConversation(conversationId, {
              title: generatedTitle.text,
            });


            const statusId = generateId();
            writer.write({
              type: "data-status",
              id: statusId,
              data: [{ title: generatedTitle.text }],
            });

            return generatedTitle.text;
          })
          .catch(() => "Untitled Conversation");
      }

      const thinkingBudget = model.features?.includes("reasoning") && thinkingEffort
        ? thinkingEffort === "disabled"
          ? 0
          : thinkingEffort === "low"
            ? 2500
            : thinkingEffort === "medium"
              ? 5000
              : 10000
        : 0; // If model doesn't support reasoning, set thinking budget to 0

      // Configure tools based on user settings
      const tools: any = {};
      // Create a search tool that automatically uses the research mode depth
      tools.search = {
        ...baseSearch,
        execute: async (params: any, options: any) => {
          const depth =
            researchMode !== "disabled" ? researchMode : undefined;
          return baseSearch.execute?.({ ...params, depth }, options) || [];
        },
      };
      tools.canvas = canvas;

      const features = {
        search: enableSearch || false,
        canvas: enableCanvas || false,
      }
      let systemPrompt = getSystemPrompt(researchMode, features, bot);

      coreMessages.unshift({
        role: "system",
        content: systemPrompt,
      });

      const wrappedModel = wrapLanguageModel({
        model: sdkModel,
        middleware: extractReasoningMiddleware({ tagName: "think" })
      })

      const response = streamText({
        messages: coreMessages,
        model: wrappedModel,
        tools,
        stopWhen: stepCountIs(30),
        experimental_transform: smoothStream({
          delayInMs: 5,
        }),
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
      });

      writer.merge(response.toUIMessageStream());
    },
    originalMessages: messages,
    onFinish: async ({ messages }) => {
      await updateConversation(conversationId, {
        messages: messages,
      });
    },
  });

  return createUIMessageStreamResponse({
    stream
  });
}

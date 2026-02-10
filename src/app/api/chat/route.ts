import { type AnthropicProviderOptions, createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI, type GoogleGenerativeAIProviderOptions } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { createXai } from "@ai-sdk/xai";
import { createOpenAI, type OpenAIResponsesProviderOptions } from "@ai-sdk/openai";
import { createOpenRouter, type OpenRouterProviderOptions } from "@openrouter/ai-sdk-provider";
import {
  convertToModelMessages,
  type LanguageModel,
  safeValidateUIMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/drizzle";
import { apiKey, customModel, providerKey, providerSetting } from "@/db/schema";
import { env } from "@/env";
import { hashApiKey } from "@/lib/api-key-utils";
import { auth } from "@/lib/auth";
import { generateTitle, getChatById, updateChat } from "@/lib/chat";
import { createChatTools } from "@/lib/chat-tools";
import { models } from "@/lib/constants";
import { decryptFromB64 } from "@/lib/crypto";
import { consumeUsage, getUsageSummary, type UsageCategory, UsageLimitError } from "@/lib/usage";
import { checkRateLimit } from "@/lib/rate-limit";

const UIMessagesSchema = z
  .array(z.record(z.string(), z.unknown()))
  .transform((value) => value as unknown as UIMessage[]);

export async function POST(req: Request) {
  const headersList = await headers();
  const bodyPromise = req.json();

  // Check for Flixa API key in Authorization header
  const authHeader = headersList.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const isDeniApiKey = bearerToken?.startsWith("deni_") ?? false;

  let userId: string | undefined;
  let isAnonymous = false;

  if (isDeniApiKey && bearerToken) {
    const keyHash = await hashApiKey(bearerToken);
    const [row] = await db
      .select({ userId: apiKey.userId, expiresAt: apiKey.expiresAt, id: apiKey.id })
      .from(apiKey)
      .where(eq(apiKey.keyHash, keyHash))
      .limit(1);

    if (!row) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    if (row.expiresAt && row.expiresAt < new Date()) {
      return NextResponse.json({ error: "API key has expired" }, { status: 401 });
    }

    userId = row.userId;

    // Update lastUsedAt asynchronously
    db.update(apiKey)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKey.id, row.id))
      .catch(() => {});
  } else {
    const session = await auth.api.getSession({ headers: headersList });
    userId = session?.session?.userId;
    isAnonymous = Boolean(session?.user?.isAnonymous);
  }

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await bodyPromise;

  const rateCheck = checkRateLimit({ key: `chat:${userId}`, windowMs: 60_000, maxRequests: 30 });
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": String(rateCheck.retryAfter) } },
    );
  }

  const parsedBody = z
    .object({
      id: z.string().min(1),
      messages: UIMessagesSchema.optional(),
      model: z.string(),
      webSearch: z.boolean().optional(),
      reasoningEffort: z.enum(["low", "medium", "high"]).optional(),
      video: z.boolean().optional(),
      image: z.boolean().optional(),
    })
    .safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const {
    id,
    messages: rawMessages = [],
    model: baseModel,
    reasoningEffort = "high",
    video: videoMode = false,
    image: imageMode = false,
  } = parsedBody.data;

  const validatedMessages = await safeValidateUIMessages<UIMessage>({
    messages: rawMessages,
  });

  if (!validatedMessages.success) {
    return NextResponse.json({ error: "Invalid messages payload" }, { status: 400 });
  }

  const messages = validatedMessages.data;
  const voids = createOpenAI({
    apiKey: "no_api_key_needed",
    baseURL: "https://capi.voids.top/v2", // safe custom openai-compatible api
  });
  const isCustomModel = baseModel.startsWith("custom:");
  const customModelId = isCustomModel ? baseModel.slice("custom:".length) : null;
  const selectedModel = models.find((m) => m.value === baseModel);
  const customEntry = customModelId
    ? await db
        .select()
        .from(customModel)
        .where(and(eq(customModel.userId, userId), eq(customModel.id, customModelId)))
        .limit(1)
        .then((rows) => rows[0] ?? null)
    : null;

  if (!selectedModel && !customEntry) {
    return NextResponse.json({ error: "Unknown model" }, { status: 400 });
  }

  const isPremiumModel = Boolean(customEntry?.premium ?? selectedModel?.premium ?? false);

  if (isAnonymous && isPremiumModel) {
    return NextResponse.json(
      { error: "Premium models are not available for guest sessions." },
      { status: 403 },
    );
  }

  const usageCategory: UsageCategory = isPremiumModel ? "premium" : "basic";

  const [providerKeys, providerSettings] = await Promise.all([
    db.select().from(providerKey).where(eq(providerKey.userId, userId)),
    db.select().from(providerSetting).where(eq(providerSetting.userId, userId)),
  ]);

  const providerKeyMap = new Map(providerKeys.map((entry) => [entry.provider, entry.keyEnc]));
  const providerSettingMap = new Map(providerSettings.map((entry) => [entry.provider, entry]));

  const providerId = customEntry
    ? "openai_compatible"
    : (selectedModel?.provider ?? selectedModel?.author);
  if (!providerId) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  }

  let useByok = false;
  let byokApiKey: string | undefined;
  let byokBaseUrl: string | undefined;
  let byokApiStyle: "chat" | "responses" = "responses";

  if (providerId === "openai_compatible") {
    const compatKey = providerKeyMap.get("openai_compatible");
    const compatSetting = providerSettingMap.get("openai_compatible");
    const compatBaseUrl = compatSetting?.baseUrl ?? null;
    if (!compatKey || !compatBaseUrl) {
      return NextResponse.json(
        { error: "OpenAI-compatible endpoint not configured.", reason: "byok" },
        { status: 400 },
      );
    }
    byokApiKey = await decryptFromB64(compatKey);
    byokBaseUrl = compatBaseUrl;
    byokApiStyle = compatSetting?.apiStyle === "chat" ? "chat" : "responses";
    useByok = true;
  } else {
    const keyEnc = providerKeyMap.get(providerId);
    const setting = providerSettingMap.get(providerId);
    const preferByok = setting?.preferByok ?? false;
    if (preferByok && keyEnc) {
      byokApiKey = await decryptFromB64(keyEnc);
      byokBaseUrl = setting?.baseUrl ?? undefined;
      byokApiStyle =
        setting?.apiStyle === "chat" ? "chat" : providerId === "xai" ? "chat" : "responses";
      useByok = true;
    }
  }

  if (providerId === "xai" && useByok && !byokBaseUrl) {
    byokBaseUrl = "https://api.x.ai/v1";
  }

  if (!useByok) {
    try {
      const usageSummary = await getUsageSummary({ userId, isAnonymous });
      const categoryUsage = usageSummary.usage.find((usage) => usage.category === usageCategory);

      // Allow if Max Mode is enabled, even if remaining is 0
      const isLimitReached =
        categoryUsage?.remaining !== null &&
        categoryUsage?.remaining !== undefined &&
        categoryUsage.remaining <= 0;

      if (isLimitReached && !usageSummary.maxModeEnabled) {
        throw new UsageLimitError(
          "You've hit the usage limit for your plan.",
          usageSummary.maxModeEligible,
        );
      }

      // Consume usage upfront (atomic increment) to prevent TOCTOU race
      await consumeUsage({
        userId,
        category: usageCategory,
        isAnonymous,
      });
    } catch (error) {
      if (error instanceof UsageLimitError) {
        return NextResponse.json({ error: error.message, reason: "usage_limit" }, { status: 402 });
      }

      console.error("Failed to check usage", error);
      return NextResponse.json({ error: "Unable to check usage" }, { status: 500 });
    }
  }

  const resolvedModelId = customEntry?.modelId ?? selectedModel?.value;
  if (!resolvedModelId) {
    return NextResponse.json({ error: "Unknown model" }, { status: 400 });
  }

  let model: LanguageModel;
  const openrouter = createOpenRouter({
    apiKey: env.OPENROUTER_API_KEY,
    headers: {
      "X-Title": "Deni AI",
      "HTTP-Referer": "https://deniai.app",
    },
  });
  const getOpenRouterModel = () => {
    return openrouter.chat(`${providerId}/${resolvedModelId}`, {
      provider: {
        allow_fallbacks: false,
        only: ["openai", "anthropic", "google", "groq", "xai"],
      },
    });
  };
  switch (providerId) {
    case "openai": {
      if (useByok) {
        const provider = createOpenAI({
          apiKey: byokApiKey,
          baseURL: byokBaseUrl,
        });
        model =
          byokApiStyle === "chat"
            ? provider.chat(resolvedModelId)
            : provider.responses(resolvedModelId);
      } else {
        model = getOpenRouterModel();
      }
      break;
    }
    case "anthropic": {
      if (useByok) {
        const provider = createAnthropic({
          apiKey: byokApiKey,
          baseURL: byokBaseUrl,
        });
        model = provider(resolvedModelId.replace(".", "-")); // fix ex. "claude-sonnet-4.5" (openrouter id) to ex. "claude-sonnet-4-5" (anthropic id)
      } else {
        model = getOpenRouterModel();
      }
      break;
    }
    case "google": {
      if (useByok) {
        const provider = createGoogleGenerativeAI({
          apiKey: byokApiKey,
          baseURL: byokBaseUrl,
        });
        model = provider(resolvedModelId);
      } else {
        model = getOpenRouterModel();
      }
      break;
    }
    case "xai": {
      if (useByok) {
        const provider = createXai({
          apiKey: byokApiKey,
          baseURL: byokBaseUrl,
        });
        model = provider.chat(resolvedModelId.replace("xai.", ""));
      } else {
        model = voids.chat(resolvedModelId);
      }
      break;
    }
    case "openrouter": {
      model = getOpenRouterModel();
      break;
    }
    case "groq": {
      if (useByok) {
        const provider = createGroq({
          apiKey: byokApiKey,
          baseURL: byokBaseUrl,
        });
        model = provider(resolvedModelId);
      } else {
        model = createGroq({
          apiKey: env.GROQ_API_KEY,
        })(resolvedModelId);
      }
      break;
    }
    case "openai_compatible": {
      const provider = createOpenAI({
        apiKey: byokApiKey,
        baseURL: byokBaseUrl,
      });
      model =
        byokApiStyle === "chat"
          ? provider.chat(resolvedModelId.replace(".", "-"))
          : provider.responses(resolvedModelId.replace(".", "-"));
      // fix claude model ids for openai-compatible claude endpoints

      break;
    }
    default:
      model = voids.chat(resolvedModelId);
      break;
  }

  const tools = createChatTools({ videoMode, imageMode });

  const modelMessages = await convertToModelMessages(messages);
  const currentDate = new Date().toISOString().split("T")[0];
  const systemPrompt = videoMode
    ? [
        "You are a helpful AI assistant.",
        `Current date: ${currentDate}.`,
        "Video mode is enabled. Always call the `video` tool exactly once using the user's message as the prompt.",
        "Do not call other tools. After the tool returns, provide a short caption for the video.",
      ].join(" ")
    : [
        "You are a helpful AI assistant.",
        `Current date: ${currentDate}.`,
        "Guidelines:",
        "- Provide accurate, helpful, and concise responses.",
        "- Use the search tool when you need current information or when the user asks about recent events.",
        "- Always cite sources when using information from search results.",
        "- If you're unsure about something, acknowledge the uncertainty rather than making up information.",
        "- Format code blocks with appropriate syntax highlighting.",
        "- Use markdown formatting for better readability.",
      ].join(" ");

  const result = streamText({
    model: model,
    messages: modelMessages,
    stopWhen: stepCountIs(50),
    tools,
    toolChoice: videoMode
      ? { type: "tool", toolName: "video" }
      : imageMode
        ? { type: "tool", toolName: "image" }
        : undefined,
    providerOptions: {
      openai: {
        reasoningEffort,
        reasoningSummary: "detailed",
      } satisfies OpenAIResponsesProviderOptions,
      anthropic: {
        effort: reasoningEffort,
        thinking: {
          type: "enabled",
          budgetTokens:
            reasoningEffort === "low" ? 1024 : reasoningEffort === "high" ? 16000 : 8192,
        },
      } satisfies AnthropicProviderOptions,
      google: {
        thinkingConfig: {
          thinkingLevel: reasoningEffort,
          includeThoughts: true,
        },
      } satisfies GoogleGenerativeAIProviderOptions,
      openrouter: {
        reasoning: {
          enabled: true,
          effort: reasoningEffort,
        },
      } satisfies OpenRouterProviderOptions,
    },
    system: systemPrompt,
  });

  // send sources and reasoning back to the client
  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    sendSources: true,
    sendReasoning: true,
    onFinish: async ({ messages: updatedMessages }) => {
      let newTitle: string | undefined;

      try {
        const chat = await getChatById(id, userId);
        if (chat?.title === "New Chat") {
          newTitle = await generateTitle(updatedMessages);
        }
      } catch (error) {
        console.error("Failed to generate title", error);
      }

      await updateChat(id, userId, updatedMessages, newTitle);
    },
  });
}

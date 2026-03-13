import { type AnthropicProviderOptions, createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI, type GoogleGenerativeAIProviderOptions } from "@ai-sdk/google";
import type { GatewayLanguageModelOptions } from "@ai-sdk/gateway";
import { createGroq } from "@ai-sdk/groq";
import { createXai, type XaiProviderOptions } from "@ai-sdk/xai";
import { createOpenAI, type OpenAIResponsesProviderOptions } from "@ai-sdk/openai";
import {
  consumeStream,
  convertToModelMessages,
  createGateway,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateId,
  readUIMessageStream,
  type LanguageModel,
  safeValidateUIMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { checkBotId } from "botid/server";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/drizzle";
import { customModel, providerKey, providerSetting } from "@/db/schema";
import { env } from "@/env";
import { auth } from "@/lib/auth";
import { generateTitle, getChatById, updateChat } from "@/lib/chat";
import { clearChatGeneration, startChatGeneration } from "@/lib/chat-generation";
import { createChatTools } from "@/lib/chat-tools";
import { models, resolveReasoningEffort } from "@/lib/constants";
import { decryptFromB64 } from "@/lib/crypto";
import { buildMemoryPrompt, getUserMemoryState, maybeAutoSaveMemories } from "@/lib/memory";
import { buildProjectPrompt } from "@/lib/project-context";
import { consumeUsage, getUsageSummary, type UsageCategory, UsageLimitError } from "@/lib/usage";
import { checkRateLimit } from "@/lib/rate-limit";

function isPrivateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return true;
    }
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname === "[::1]" ||
      hostname.startsWith("10.") ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("169.254.") ||
      hostname.endsWith(".internal") ||
      hostname.endsWith(".local")
    ) {
      return true;
    }
    const match172 = hostname.match(/^172\.(\d+)\./);
    if (match172) {
      const second = Number.parseInt(match172[1], 10);
      if (second >= 16 && second <= 31) {
        return true;
      }
    }
    return false;
  } catch {
    return true;
  }
}

const UIMessagesSchema = z
  .array(z.record(z.string(), z.unknown()))
  .transform((value) => value as unknown as UIMessage[]);

type PendingMessageMetadata = {
  pending?: boolean;
  [key: string]: unknown;
};

function setPendingState(message: UIMessage, pending: boolean): UIMessage {
  const metadata =
    typeof message.metadata === "object" && message.metadata !== null
      ? ({ ...message.metadata } as PendingMessageMetadata)
      : ({} as PendingMessageMetadata);

  if (pending) {
    metadata.pending = true;
  } else {
    delete metadata.pending;
  }

  return {
    ...message,
    metadata,
  };
}

export async function POST(req: Request) {
  const headersList = await headers();
  const bodyPromise = req.json();
  const session = await auth.api.getSession({ headers: headersList });
  const userId = session?.session?.userId;
  const isAnonymous = Boolean(session?.user?.isAnonymous);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const verification = await checkBotId();

  if (verification.isBot) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const body = await bodyPromise;

  const rateCheck = await checkRateLimit({
    key: `chat:${userId}`,
    windowMs: 60_000,
    maxRequests: 30,
  });
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
      reasoningEffort: z
        .enum(["none", "minimal", "low", "medium", "high", "xhigh", "max"])
        .optional(),
      video: z.boolean().optional(),
      image: z.boolean().optional(),
      deepResearch: z.boolean().optional(),
      responseStyle: z.enum(["retry", "detailed", "concise"]).optional(),
      forceWebSearch: z.boolean().optional(),
      additionalInstruction: z.string().trim().min(1).optional(),
    })
    .safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const {
    id,
    messages: rawMessages = [],
    model: baseModel,
    webSearch = true,
    reasoningEffort = "high",
    video: videoMode = false,
    image: imageMode = false,
    deepResearch = false,
    responseStyle = "retry",
    forceWebSearch = false,
    additionalInstruction,
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

  const [providerKeys, providerSettings, memoryState] = await Promise.all([
    db.select().from(providerKey).where(eq(providerKey.userId, userId)),
    db.select().from(providerSetting).where(eq(providerSetting.userId, userId)),
    getUserMemoryState(userId),
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

  // Validate BYOK base URL is not pointing to a private network
  if (byokBaseUrl && isPrivateUrl(byokBaseUrl)) {
    return NextResponse.json(
      { error: "BYOK endpoints to private networks are not allowed." },
      { status: 400 },
    );
  }

  if (!useByok) {
    try {
      const usageSummary = await getUsageSummary({ userId, isAnonymous });
      const categoryUsage = usageSummary.usage.find((usage) => usage.category === usageCategory);

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

  const resolvedReasoningEffort = resolveReasoningEffort(
    selectedModel?.efforts ?? false,
    reasoningEffort,
  );
  const openaiEffortOptions = ["none", "minimal", "low", "medium", "high", "xhigh"] as const;
  const anthropicEffortOptions = ["low", "medium", "high", "max"] as const;
  const googleThinkingLevels = ["minimal", "low", "medium", "high"] as const;
  const anthropicBudgetModelIds = new Set(["claude-opus-4.1", "claude-opus-4", "claude-sonnet-4"]);
  const openaiReasoningEffort =
    providerId === "openai" &&
    resolvedReasoningEffort &&
    openaiEffortOptions.includes(resolvedReasoningEffort as (typeof openaiEffortOptions)[number])
      ? (resolvedReasoningEffort as (typeof openaiEffortOptions)[number])
      : undefined;
  const anthropicReasoningEffort =
    providerId === "anthropic" &&
    !anthropicBudgetModelIds.has(selectedModel?.value ?? "") &&
    resolvedReasoningEffort &&
    anthropicEffortOptions.includes(
      resolvedReasoningEffort as (typeof anthropicEffortOptions)[number],
    )
      ? (resolvedReasoningEffort as (typeof anthropicEffortOptions)[number])
      : undefined;
  const anthropicThinkingBudget =
    providerId === "anthropic" &&
    anthropicBudgetModelIds.has(selectedModel?.value ?? "") &&
    resolvedReasoningEffort
      ? resolvedReasoningEffort === "low"
        ? 5_000
        : resolvedReasoningEffort === "medium"
          ? 10_000
          : resolvedReasoningEffort === "high"
            ? 15_000
            : undefined
      : undefined;
  const googleThinkingLevel =
    providerId === "google" &&
    resolvedReasoningEffort &&
    googleThinkingLevels.includes(resolvedReasoningEffort as (typeof googleThinkingLevels)[number])
      ? (resolvedReasoningEffort as (typeof googleThinkingLevels)[number])
      : undefined;
  const xaiReasoningEffort =
    providerId === "xai" &&
    (resolvedReasoningEffort === "low" || resolvedReasoningEffort === "high")
      ? resolvedReasoningEffort
      : undefined;

  let model: LanguageModel;
  const gateway = createGateway({
    apiKey: env.AI_GATEWAY_API_KEY,
  });
  const selectedGatewayModelId = selectedModel
    ? selectedModel.value.includes("/")
      ? selectedModel.value
      : `${selectedModel.author}/${selectedModel.value}`
    : null;
  const getGatewayModel = () => {
    if (!selectedGatewayModelId) {
      throw new Error("Gateway model is not available for the selected model.");
    }
    return gateway(selectedGatewayModelId);
  };
  const gatewayOptions = {
    tags: ["chat"],
    user: userId,
    ...(selectedModel?.provider
      ? { only: [selectedModel.provider] }
      : selectedModel
        ? { only: [selectedModel.author] }
        : {}),
  } satisfies GatewayLanguageModelOptions;

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
        model = getGatewayModel();
      }
      break;
    }
    case "anthropic": {
      if (useByok) {
        const provider = createAnthropic({
          apiKey: byokApiKey,
          baseURL: byokBaseUrl,
        });
        model = provider(resolvedModelId.replace(".", "-")); // Anthropic SDK uses dashes instead of dots in Claude model ids.
      } else {
        model = getGatewayModel();
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
        model = getGatewayModel();
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
        model = getGatewayModel();
      }
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
          ? provider.chat(resolvedModelId)
          : provider.responses(resolvedModelId);
      break;
    }
    default:
      model = voids.chat(resolvedModelId);
      break;
  }

  const webSearchEnabled = webSearch || forceWebSearch || deepResearch;
  const tools = createChatTools({ videoMode, imageMode, webSearch: webSearchEnabled });

  const modelMessages = await convertToModelMessages(messages);
  const currentDate = new Date().toISOString().split("T")[0];
  const persistentMemory = buildMemoryPrompt(memoryState);
  const chat = await getChatById(id, userId);
  if (!chat) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  const responseMessageId = generateId();
  const pendingAssistantMessage = setPendingState(
    {
      id: responseMessageId,
      role: "assistant",
      parts: [],
    } as UIMessage,
    true,
  );

  let generationAbortController: AbortController | undefined;
  let pendingStateRolledBack = false;

  const rollbackPendingAssistantState = async () => {
    if (pendingStateRolledBack) {
      return;
    }

    pendingStateRolledBack = true;

    try {
      await updateChat(id, userId, messages);
    } catch (error) {
      console.error("Failed to rollback pending chat response", error);
    }
  };

  const clearGenerationLock = () => {
    if (!generationAbortController) {
      return;
    }

    clearChatGeneration(id, generationAbortController);
    generationAbortController = undefined;
  };

  await updateChat(id, userId, [...messages, pendingAssistantMessage]);

  let projectPrompt: string | null;

  try {
    projectPrompt = await buildProjectPrompt(chat.projectId, userId);
    generationAbortController = startChatGeneration(id, userId);
    if (!useByok) {
      await consumeUsage({
        userId,
        category: usageCategory,
        isAnonymous,
      });
    }
  } catch (error) {
    await rollbackPendingAssistantState();
    clearGenerationLock();
    if (error instanceof UsageLimitError) {
      return NextResponse.json({ error: error.message, reason: "usage_limit" }, { status: 402 });
    }
    throw error;
  }

  const responseStyleInstruction =
    responseStyle === "detailed"
      ? "The user asked to regenerate the previous answer with more detail. Keep the same intent, but expand the explanation, include more useful specifics, and improve completeness."
      : responseStyle === "concise"
        ? "The user asked to regenerate the previous answer more concisely. Keep the same intent, but shorten the response, reduce repetition, and prioritize the most important points."
        : "The user asked for a fresh retry of the previous answer. Preserve the intent, but vary the phrasing and structure while keeping the response accurate and useful.";
  const forceWebSearchInstruction =
    forceWebSearch && !videoMode && !imageMode
      ? "Web search is required for this response. Use the search tool at least once before answering, then cite the sources you used."
      : null;
  const researchInstruction =
    deepResearch && !videoMode && !imageMode
      ? [
          "Deep research mode is enabled.",
          "Use the search tool multiple times when helpful.",
          "Cross-check claims before concluding.",
          "Return a structured report with: Summary, Key Findings, Risks or Unknowns, and Sources.",
        ].join(" ")
      : null;
  const additionalInstructionPrompt = additionalInstruction
    ? `Additional regeneration instruction from the user: ${additionalInstruction}`
    : null;
  const systemPrompt = videoMode
    ? [
        "You are a helpful AI assistant.",
        `Current date: ${currentDate}.`,
        persistentMemory,
        projectPrompt,
        additionalInstructionPrompt,
        "Video mode is enabled. Always call the `video` tool exactly once using the user's message as the prompt.",
        "Do not call other tools. After the tool returns, provide a short caption for the video.",
      ].join(" ")
    : [
        "You are a helpful AI assistant.",
        `Current date: ${currentDate}.`,
        persistentMemory,
        projectPrompt,
        "Guidelines:",
        "- Provide accurate, helpful, and concise responses.",
        "- Use the search tool when you need current information or when the user asks about recent events.",
        "- Always cite sources when using information from search results.",
        "- If you're unsure about something, acknowledge the uncertainty rather than making up information.",
        "- Format code blocks with appropriate syntax highlighting.",
        "- Use markdown formatting for better readability.",
        additionalInstructionPrompt,
        responseStyleInstruction,
        researchInstruction,
        forceWebSearchInstruction,
      ].join(" ");

  let result: ReturnType<typeof streamText>;

  try {
    result = streamText({
      model: model,
      messages: modelMessages,
      abortSignal: generationAbortController.signal,
      stopWhen: stepCountIs(50),
      tools,
      toolChoice: videoMode
        ? { type: "tool", toolName: "video" }
        : imageMode
          ? { type: "tool", toolName: "image" }
          : undefined,
      providerOptions: {
        ...(openaiReasoningEffort
          ? {
              openai: {
                reasoningEffort: openaiReasoningEffort,
                reasoningSummary: "detailed",
              } satisfies OpenAIResponsesProviderOptions,
            }
          : {}),
        ...(anthropicReasoningEffort
          ? {
              anthropic: {
                effort: anthropicReasoningEffort,
              } satisfies AnthropicProviderOptions,
            }
          : {}),
        ...(anthropicThinkingBudget
          ? {
              anthropic: {
                thinking: {
                  type: "enabled",
                  budgetTokens: anthropicThinkingBudget,
                },
              } satisfies AnthropicProviderOptions,
            }
          : {}),
        ...(googleThinkingLevel
          ? {
              google: {
                thinkingConfig: {
                  thinkingLevel: googleThinkingLevel,
                  includeThoughts: true,
                },
              } satisfies GoogleGenerativeAIProviderOptions,
            }
          : {}),
        ...(xaiReasoningEffort
          ? {
              xai: {
                reasoningEffort: xaiReasoningEffort,
              } satisfies XaiProviderOptions,
            }
          : {}),
        gateway: gatewayOptions,
      },
      system: systemPrompt,
    });
  } catch (error) {
    await rollbackPendingAssistantState();
    clearGenerationLock();
    throw error;
  }

  let lastPersistedSignature = "";
  let latestPersistedMessage: UIMessage = pendingAssistantMessage;
  let partialPersistPromise: Promise<void> = Promise.resolve();
  let lastPersistAt = 0;

  const queuePartialPersist = (message: UIMessage, force: boolean = false) => {
    const pendingMessage = setPendingState(message, true);
    const signature = JSON.stringify(pendingMessage.parts);
    const now = Date.now();

    if (!force) {
      if (signature === lastPersistedSignature) {
        return;
      }

      if (now - lastPersistAt < 750) {
        latestPersistedMessage = pendingMessage;
        return;
      }
    }

    latestPersistedMessage = pendingMessage;
    lastPersistedSignature = signature;
    lastPersistAt = now;

    partialPersistPromise = partialPersistPromise
      .catch(() => undefined)
      .then(async () => {
        if (!latestPersistedMessage) {
          return;
        }

        try {
          await updateChat(id, userId, [...messages, latestPersistedMessage]);
        } catch (error) {
          console.error("Failed to persist partial chat response", error);
        }
      });
  };

  const stream = createUIMessageStream<UIMessage>({
    originalMessages: messages,
    execute: async ({ writer }) => {
      try {
        writer.write({
          type: "start",
          messageId: responseMessageId,
        });

        const uiStream = result.toUIMessageStream<UIMessage>({
          sendReasoning: true,
          sendSources: true,
          sendStart: false,
        });
        const [clientStream, persistenceStream] = uiStream.tee();

        writer.merge(clientStream);

        for await (const message of readUIMessageStream<UIMessage>({
          stream: persistenceStream,
        })) {
          queuePartialPersist(message);
        }

        queuePartialPersist(latestPersistedMessage, true);

        await partialPersistPromise;
      } catch (error) {
        await rollbackPendingAssistantState();
        clearGenerationLock();
        throw error;
      }
    },
    onFinish: async ({ messages: updatedMessages, isAborted }) => {
      try {
        await partialPersistPromise;

        let newTitle: string | undefined;

        try {
          const chat = await getChatById(id, userId);
          if (chat?.title === "New Chat") {
            newTitle = await generateTitle(updatedMessages);
          }
        } catch (error) {
          console.error("Failed to generate title", error);
        }

        await updateChat(
          id,
          userId,
          updatedMessages.map((message) =>
            message.id === responseMessageId ? setPendingState(message, false) : message,
          ),
          newTitle,
        );

        pendingStateRolledBack = true;

        if (isAborted) {
          return;
        }

        try {
          await maybeAutoSaveMemories({
            userId,
            messages: updatedMessages,
            enabled: memoryState.profile.autoMemory,
          });
        } catch (error) {
          console.error("Failed to auto-save memories", error);
        }
      } catch (error) {
        await rollbackPendingAssistantState();
        throw error;
      } finally {
        clearGenerationLock();
      }
    },
  });

  return createUIMessageStreamResponse({
    stream,
    consumeSseStream: consumeStream,
  });
}

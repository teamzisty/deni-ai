import {
  consumeStream,
  convertToModelMessages,
  generateId,
  safeValidateUIMessages,
  stepCountIs,
  streamText,
  type ModelMessage,
  type SystemModelMessage,
  type UIMessage,
} from "ai";
import { headers } from "next/headers";
import { after, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  clearChatGenerationState,
  generateTitle,
  getChatById,
  isChatGenerationActive,
  updateChat,
} from "@/lib/chat";
import {
  clearChatGeneration,
  isCurrentChatGeneration,
  startChatGeneration,
} from "@/lib/chat-generation";
import { createChatTools } from "@/lib/chat-tools";
import {
  getEffectiveTokenMultiplier,
  getModelContextWindow,
  getModelDefinition,
  OPENAI_LONG_CONTEXT_INPUT_THRESHOLD,
  supportsOpenAILongContextPricing,
} from "@/lib/constants";
import { buildMemoryPrompt, getUserMemoryState, maybeAutoSaveMemories } from "@/lib/memory";
import { buildProjectPrompt } from "@/lib/project-context";
import { reportMaxModeUsageToStripe } from "@/lib/max-mode";
import { consumeUsage, refundUsage, UsageLimitError } from "@/lib/usage";
import {
  computeWeightedUsageFromLanguageModelUsage,
  type TokenUsageBreakdown,
} from "@/lib/token-weighting";
import { checkRateLimit } from "@/lib/rate-limit";
import { addOpenRouterCacheControl, ChatRouteError, resolveChatModelContext } from "./_lib/model";
import { buildChatSystemPrompt } from "./_lib/prompt";
import { ChatRequestSchema, setPendingState } from "./_lib/schema";

// Note: `export const dynamic` is incompatible with nextConfig.cacheComponents.
export const runtime = "nodejs";
export const maxDuration = 300;

function getErrorMessage(error: unknown): string | undefined {
  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object") {
    const message = "message" in error ? error.message : undefined;
    if (typeof message === "string" && message.trim()) {
      return message;
    }

    const cause = "cause" in error ? error.cause : undefined;
    if (cause) {
      const causeMessage = getErrorMessage(cause);
      if (causeMessage) {
        return causeMessage;
      }
    }
  }

  return undefined;
}

function formatChatStreamError(error: unknown, modelId: string): string {
  const rawMessage = getErrorMessage(error) ?? "An unexpected error occurred.";
  const normalizedMessage = rawMessage.toLowerCase();
  const isContextOverflow =
    normalizedMessage.includes("context window") ||
    normalizedMessage.includes("maximum context length") ||
    normalizedMessage.includes("model_context_window_exceeded") ||
    normalizedMessage.includes("prompt is too long") ||
    normalizedMessage.includes("too many input tokens") ||
    normalizedMessage.includes("input is too long");

  if (!isContextOverflow) {
    return rawMessage;
  }

  const modelName = getModelDefinition(modelId)?.name ?? modelId;
  const contextWindow = getModelContextWindow(modelId);

  if (contextWindow) {
    return `${modelName} exceeded its context window (${new Intl.NumberFormat("en-US").format(contextWindow)} tokens). Start a new chat or trim earlier messages/files.`;
  }

  return `${modelName} exceeded its context window. Start a new chat or trim earlier messages/files.`;
}

/** Uncapped prompt-size estimate (chars/4). Used for long-context preflight. */
function estimatePromptInputTokens({
  modelMessages,
  systemPrompt,
}: {
  modelMessages: unknown;
  systemPrompt: string;
}): number {
  const serializedMessages = JSON.stringify(modelMessages);
  return Math.ceil((serializedMessages.length + systemPrompt.length) / 4);
}

/**
 * Reserve a bounded token budget for short chats. Long-context sessions
 * (>200K estimated input on OpenAI 1M models) reserve using the uncapped
 * estimate so the 2× premium is held before streaming starts.
 */
function estimateTokenReservation({
  modelMessages,
  systemPrompt,
  modelId,
  proMode = false,
}: {
  modelMessages: unknown;
  systemPrompt: string;
  modelId: string;
  proMode?: boolean;
}) {
  const estimatedPromptTokens = estimatePromptInputTokens({ modelMessages, systemPrompt });
  const effectiveMultiplier = getEffectiveTokenMultiplier(modelId, estimatedPromptTokens, {
    proMode,
  });
  const isLongContext =
    supportsOpenAILongContextPricing(modelId) &&
    estimatedPromptTokens > OPENAI_LONG_CONTEXT_INPUT_THRESHOLD;

  const baseUnits = isLongContext
    ? Math.max(512, estimatedPromptTokens + 1_024)
    : Math.max(512, Math.min(8_192, estimatedPromptTokens + 1_024));

  return Math.ceil(baseUnits * effectiveMultiplier);
}

function getUsageInputTokens(
  usage: {
    inputTokens?: number | null;
  },
  breakdown: TokenUsageBreakdown | null,
): number {
  if (breakdown) {
    return breakdown.input + breakdown.cacheRead + breakdown.cacheWrite;
  }
  return typeof usage.inputTokens === "number" && Number.isFinite(usage.inputTokens)
    ? Math.max(0, usage.inputTokens)
    : 0;
}

const TOKEN_RECONCILE_OVERFLOW_BUFFER = 256;

export async function POST(req: Request) {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  const userId = session?.session?.userId;
  const isAnonymous = Boolean(session?.user?.isAnonymous);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

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

  const parsedBody = ChatRequestSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const {
    id,
    messages: rawMessages = [],
    model: baseModel,
    webSearch = true,
    reasoningEffort = "high",
    proMode: requestedProMode = false,
    video: videoMode = false,
    image: imageMode = false,
    deepResearch = false,
    responseStyle = "retry",
    forceWebSearch = false,
    additionalInstruction,
  } = parsedBody.data;

  const chat = await getChatById(id, userId);
  if (!chat) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  const validatedMessages = await safeValidateUIMessages<UIMessage>({
    messages: rawMessages,
  });

  if (!validatedMessages.success) {
    return NextResponse.json({ error: "Invalid messages payload" }, { status: 400 });
  }

  const messages = validatedMessages.data;

  let memoryState: Awaited<ReturnType<typeof getUserMemoryState>>;
  let modelContext: Awaited<ReturnType<typeof resolveChatModelContext>>;

  try {
    [memoryState, modelContext] = await Promise.all([
      getUserMemoryState(userId),
      resolveChatModelContext({
        userId,
        isAnonymous,
        baseModel,
        reasoningEffort,
        proMode: requestedProMode,
      }),
    ]);
  } catch (error) {
    if (error instanceof ChatRouteError) {
      return NextResponse.json(error.body, { status: error.status });
    }
    throw error;
  }

  const { model, providerOptions, usageCategory, usageUnit, useByok, usesOpenRouter } =
    modelContext;

  // Pro mode: BYOK OpenAI or OpenRouter platform OpenAI (not voids.top).
  const modelDef = getModelDefinition(baseModel);
  const proMode = Boolean(
    requestedProMode &&
    modelDef?.supportsProMode &&
    modelDef.author === "openai" &&
    (useByok || usesOpenRouter),
  );

  const webSearchEnabled = webSearch || forceWebSearch || deepResearch;
  const tools = createChatTools({
    userId,
    videoMode,
    imageMode,
    webSearch: webSearchEnabled,
  });

  const modelMessages = await convertToModelMessages(messages);
  const currentDate = new Date().toISOString().split("T")[0];
  const persistentMemory = buildMemoryPrompt(memoryState);

  const responseMessageId = generateId();
  const generationId = generateId();
  const shouldGenerateTitle = chat.title === "New Chat";
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
  let usageConsumed = false;
  let usageRefunded = false;
  let generationWatch: ReturnType<typeof setInterval> | undefined;
  let hasAssistantOutput = false;
  let consumedUsageAmount = 0;
  let finalUsageAmount = 0;
  // Net Max Mode overage for this request. Reported to Stripe once, after
  // reconciliation, because meter events cannot be reduced after the fact.
  let pendingMaxModeAmount = 0;

  // Sync check only — safe for the stream hot path (no DB).
  const ownsCurrentGenerationSync = () => isCurrentChatGeneration(id, generationId);

  // Includes a DB check for stop/replace races. Use only off the hot path
  // (throttled persist / finish), never per stream chunk.
  const ownsCurrentGeneration = async () => {
    return ownsCurrentGenerationSync() && (await isChatGenerationActive(id, userId, generationId));
  };

  const refundConsumedUsage = async () => {
    if (useByok || !usageConsumed || usageRefunded || hasAssistantOutput) {
      return;
    }

    usageRefunded = true;

    try {
      const refunded = await refundUsage({
        userId,
        category: usageCategory,
        amount: consumedUsageAmount,
      });
      pendingMaxModeAmount = Math.max(pendingMaxModeAmount - refunded.maxModeRefunded, 0);
    } catch (error) {
      console.error("Failed to refund chat usage", error);
    }
  };

  const reconcileConsumedUsage = async (targetAmount: number) => {
    if (useByok || usageUnit !== "tokens") {
      return;
    }

    const normalizedTargetAmount = Math.max(targetAmount, hasAssistantOutput ? 1 : 0);
    if (normalizedTargetAmount === consumedUsageAmount) {
      return;
    }

    if (!usageConsumed) {
      if (normalizedTargetAmount <= 0) {
        return;
      }

      const consumed = await consumeUsage({
        userId,
        category: usageCategory,
        isAnonymous,
        amount: normalizedTargetAmount,
        allowLimitOverflow: normalizedTargetAmount <= TOKEN_RECONCILE_OVERFLOW_BUFFER,
      });
      pendingMaxModeAmount += consumed.maxModeAmount;
      consumedUsageAmount = normalizedTargetAmount;
      usageConsumed = true;
      usageRefunded = false;
      return;
    }

    const delta = normalizedTargetAmount - consumedUsageAmount;
    if (delta > 0) {
      const consumed = await consumeUsage({
        userId,
        category: usageCategory,
        isAnonymous,
        amount: delta,
        allowLimitOverflow: delta <= TOKEN_RECONCILE_OVERFLOW_BUFFER,
      });
      pendingMaxModeAmount += consumed.maxModeAmount;
    } else if (delta < 0) {
      const refunded = await refundUsage({
        userId,
        category: usageCategory,
        amount: Math.abs(delta),
      });
      pendingMaxModeAmount = Math.max(pendingMaxModeAmount - refunded.maxModeRefunded, 0);
    }

    consumedUsageAmount = normalizedTargetAmount;
    usageConsumed = normalizedTargetAmount > 0;
    usageRefunded = normalizedTargetAmount === 0;
  };

  /**
   * Sends the reconciled Max Mode overage to Stripe. Runs exactly once at the end
   * of the request: meter events are append-only, so reporting the up-front
   * estimate and reconciling down afterwards would leave the customer overbilled.
   */
  let maxModeReported = false;
  const flushMaxModeUsage = async () => {
    if (maxModeReported) {
      return;
    }
    maxModeReported = true;

    if (pendingMaxModeAmount <= 0) {
      return;
    }

    try {
      await reportMaxModeUsageToStripe(userId, usageCategory, pendingMaxModeAmount);
    } catch (error) {
      console.error("Failed to report Max Mode usage", error);
    }
  };

  const rollbackPendingAssistantState = async () => {
    if (pendingStateRolledBack) {
      return;
    }

    pendingStateRolledBack = true;

    try {
      if (!(await ownsCurrentGeneration())) {
        return;
      }
      await updateChat(id, userId, messages, undefined, {
        expectedGenerationId: generationId,
      });
    } catch (error) {
      console.error("Failed to rollback pending chat response", error);
    }
  };

  const clearGenerationLock = () => {
    if (generationWatch) {
      clearInterval(generationWatch);
      generationWatch = undefined;
    }

    if (!generationAbortController) {
      return;
    }

    clearChatGeneration(id, generationId);
    generationAbortController = undefined;
  };

  let projectPrompt: string | null;

  try {
    ({ abortController: generationAbortController } = startChatGeneration(id, generationId));
    await updateChat(id, userId, [...messages, pendingAssistantMessage], undefined, {
      nextGenerationId: generationId,
    });
    projectPrompt = await buildProjectPrompt(chat.projectId, userId);
    if (!useByok) {
      if (usageUnit === "requests") {
        consumedUsageAmount = 1;
        const consumed = await consumeUsage({
          userId,
          category: usageCategory,
          isAnonymous,
          amount: consumedUsageAmount,
        });
        pendingMaxModeAmount += consumed.maxModeAmount;
        usageConsumed = true;
      }
    }
  } catch (error) {
    await rollbackPendingAssistantState();
    await refundConsumedUsage();
    clearGenerationLock();
    if (error instanceof UsageLimitError) {
      return NextResponse.json({ error: error.message, reason: "usage_limit" }, { status: 402 });
    }
    throw error;
  }

  const systemPrompt = buildChatSystemPrompt({
    currentDate,
    persistentMemory,
    projectPrompt,
    additionalInstruction,
    responseStyle,
    deepResearch,
    forceWebSearch,
    videoMode,
    imageMode,
  });

  let requestMessages: ModelMessage[] = modelMessages;
  let requestSystem: string | SystemModelMessage = systemPrompt;

  if (usesOpenRouter) {
    const cachedPrompt = addOpenRouterCacheControl(modelMessages, systemPrompt);
    requestMessages = cachedPrompt.messages;
    requestSystem = cachedPrompt.system;
  }

  generationWatch = setInterval(() => {
    void isChatGenerationActive(id, userId, generationId).then((isActive) => {
      if (!isActive) {
        generationAbortController?.abort("stopped");
      }
    });
  }, 1000);

  let result: ReturnType<typeof streamText>;

  try {
    if (!useByok && usageUnit === "tokens") {
      consumedUsageAmount = estimateTokenReservation({
        modelMessages,
        systemPrompt,
        modelId: baseModel,
        proMode,
      });
      const consumed = await consumeUsage({
        userId,
        category: usageCategory,
        isAnonymous,
        amount: consumedUsageAmount,
      });
      pendingMaxModeAmount += consumed.maxModeAmount;
      usageConsumed = true;
      usageRefunded = false;
    }

    result = streamText({
      model: model,
      messages: requestMessages,
      abortSignal: generationAbortController.signal,
      stopWhen: stepCountIs(50),
      tools,
      toolChoice: videoMode
        ? { type: "tool", toolName: "video" }
        : imageMode
          ? { type: "tool", toolName: "image" }
          : undefined,
      onFinish: ({ totalUsage }) => {
        const { weighted, breakdown } = computeWeightedUsageFromLanguageModelUsage(totalUsage);
        const inputTokens = getUsageInputTokens(totalUsage, breakdown);
        finalUsageAmount = Math.ceil(
          weighted * getEffectiveTokenMultiplier(baseModel, inputTokens, { proMode }),
        );
      },
      providerOptions,
      system: requestSystem,
    });
  } catch (error) {
    await rollbackPendingAssistantState();
    await refundConsumedUsage();
    // Nothing streamed, so there is no reconciliation left to wait for.
    await flushMaxModeUsage();
    clearGenerationLock();
    throw new Error(formatChatStreamError(error, baseModel));
  }

  // Use the SDK's direct UI stream response path (no createUIMessageStream
  // push-buffer / custom tee). This is the well-tested progressive SSE path.
  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    generateMessageId: () => responseMessageId,
    sendReasoning: true,
    sendSources: true,
    sendStart: true,
    sendFinish: true,
    onError: (error) => formatChatStreamError(error, baseModel),
    // Keep the Node process alive until the stream is fully consumed without
    // blocking the client-facing branch of the SSE tee more than necessary.
    consumeSseStream: consumeStream,
    headers: {
      // Prevent proxies / gzip layers from buffering the full body.
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      Connection: "keep-alive",
    },
    onFinish: ({ messages: updatedMessages, isAborted, responseMessage }) => {
      const assistantParts = responseMessage?.parts ?? [];
      hasAssistantOutput = assistantParts.some((part) => {
        if (part.type === "text" || part.type === "reasoning") {
          return Boolean(part.text?.trim());
        }
        return (
          part.type === "file" ||
          part.type === "source-url" ||
          part.type.startsWith("tool-")
        );
      });

      // Heavy work off the stream flush path so the HTTP response can end ASAP.
      after(async () => {
        try {
          if (!(await ownsCurrentGeneration())) {
            pendingStateRolledBack = true;
            return;
          }

          const finalizedMessages = updatedMessages.map((message) =>
            message.id === responseMessageId ? setPendingState(message, false) : message,
          );

          const cleared = await clearChatGenerationState(
            id,
            userId,
            generationId,
            finalizedMessages,
            undefined,
          );

          if (!cleared) {
            pendingStateRolledBack = true;
            return;
          }

          pendingStateRolledBack = true;

          if (shouldGenerateTitle) {
            try {
              const newTitle = await generateTitle(finalizedMessages);
              if (newTitle) {
                await updateChat(id, userId, finalizedMessages, newTitle);
              }
            } catch (error) {
              console.error("Failed to generate title", error);
            }
          }

          if (isAborted) {
            if (!hasAssistantOutput) {
              await refundConsumedUsage();
            } else if (!useByok && usageUnit === "tokens") {
              await reconcileConsumedUsage(finalUsageAmount);
            }
            return;
          }

          if (!useByok && usageUnit === "tokens") {
            await reconcileConsumedUsage(finalUsageAmount);
          }

          if (memoryState.profile.autoMemory) {
            await maybeAutoSaveMemories({
              userId,
              messages: finalizedMessages,
              enabled: true,
            }).catch((error) => {
              console.error("Failed to auto-save memories", error);
            });
          }
        } catch (error) {
          await rollbackPendingAssistantState();
          await refundConsumedUsage();
          console.error("Failed to finalize chat generation", error);
        } finally {
          await flushMaxModeUsage();
          clearGenerationLock();
        }
      });
    },
  });
}

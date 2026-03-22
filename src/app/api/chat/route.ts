import {
  consumeStream,
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateId,
  readUIMessageStream,
  safeValidateUIMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
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
import { getModelContextWindow, getModelDefinition } from "@/lib/constants";
import { buildMemoryPrompt, getUserMemoryState, maybeAutoSaveMemories } from "@/lib/memory";
import { buildProjectPrompt } from "@/lib/project-context";
import { consumeUsage, refundUsage, UsageLimitError } from "@/lib/usage";
import { checkRateLimit } from "@/lib/rate-limit";
import { ChatRouteError, resolveChatModelContext } from "./_lib/model";
import { buildChatSystemPrompt } from "./_lib/prompt";
import { ChatRequestSchema, setPendingState } from "./_lib/schema";

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
      }),
    ]);
  } catch (error) {
    if (error instanceof ChatRouteError) {
      return NextResponse.json(error.body, { status: error.status });
    }
    throw error;
  }

  const { model, providerOptions, usageCategory, usageUnit, useByok } = modelContext;

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
  const chat = await getChatById(id, userId);
  if (!chat) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  const responseMessageId = generateId();
  const generationId = generateId();
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

  const ownsCurrentGeneration = async () => {
    return (
      isCurrentChatGeneration(id, generationId) &&
      (await isChatGenerationActive(id, userId, generationId))
    );
  };

  const refundConsumedUsage = async () => {
    if (useByok || !usageConsumed || usageRefunded || hasAssistantOutput) {
      return;
    }

    usageRefunded = true;

    try {
      await refundUsage({
        userId,
        category: usageCategory,
        amount: consumedUsageAmount,
      });
    } catch (error) {
      console.error("Failed to refund chat usage", error);
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
        await consumeUsage({
          userId,
          category: usageCategory,
          isAnonymous,
          amount: consumedUsageAmount,
        });
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

  generationWatch = setInterval(() => {
    void isChatGenerationActive(id, userId, generationId).then((isActive) => {
      if (!isActive) {
        generationAbortController?.abort("stopped");
      }
    });
  }, 1000);

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
      onFinish: ({ totalUsage }) => {
        finalUsageAmount = Math.max(
          totalUsage.totalTokens ?? (totalUsage.inputTokens ?? 0) + (totalUsage.outputTokens ?? 0),
          0,
        );
      },
      providerOptions,
      system: systemPrompt,
    });
  } catch (error) {
    await rollbackPendingAssistantState();
    await refundConsumedUsage();
    clearGenerationLock();
    throw new Error(formatChatStreamError(error, baseModel));
  }

  let lastPersistedSignature = "";
  let latestPersistedMessage: UIMessage = pendingAssistantMessage;
  let partialPersistPromise: Promise<void> = Promise.resolve();
  let lastPersistAt = 0;

  const queuePartialPersist = (message: UIMessage, force: boolean = false) => {
    const pendingMessage = setPendingState(message, true);
    if (pendingMessage.parts.length > 0) {
      hasAssistantOutput = true;
    }
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
        try {
          if (!(await ownsCurrentGeneration())) {
            return;
          }
          await updateChat(id, userId, [...messages, latestPersistedMessage], undefined, {
            expectedGenerationId: generationId,
          });
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
          onError: (error) => formatChatStreamError(error, baseModel),
        });
        const [clientStream, persistenceStream] = uiStream.tee();

        writer.merge(clientStream);

        for await (const message of readUIMessageStream<UIMessage>({
          stream: persistenceStream,
        })) {
          if (!(await ownsCurrentGeneration())) {
            break;
          }
          queuePartialPersist(message);
        }

        queuePartialPersist(latestPersistedMessage, true);

        await partialPersistPromise;
      } catch (error) {
        await rollbackPendingAssistantState();
        await refundConsumedUsage();
        clearGenerationLock();
        throw new Error(formatChatStreamError(error, baseModel));
      }
    },
    onFinish: async ({ messages: updatedMessages, isAborted }) => {
      try {
        await partialPersistPromise;

        if (!(await ownsCurrentGeneration())) {
          pendingStateRolledBack = true;
          return;
        }

        let newTitle: string | undefined;

        try {
          const chat = await getChatById(id, userId);
          if (chat?.title === "New Chat") {
            newTitle = await generateTitle(updatedMessages);
          }
        } catch (error) {
          console.error("Failed to generate title", error);
        }

        const cleared = await clearChatGenerationState(
          id,
          userId,
          generationId,
          updatedMessages.map((message) =>
            message.id === responseMessageId ? setPendingState(message, false) : message,
          ),
          newTitle,
        );

        if (!cleared) {
          pendingStateRolledBack = true;
          return;
        }

        pendingStateRolledBack = true;

        if (isAborted) {
          if (!hasAssistantOutput) {
            await refundConsumedUsage();
          } else if (!useByok && usageUnit === "tokens") {
            consumedUsageAmount = Math.max(finalUsageAmount, 1);
            await consumeUsage({
              userId,
              category: usageCategory,
              isAnonymous,
              amount: consumedUsageAmount,
              allowLimitOverflow: true,
            });
            usageConsumed = true;
          }
          return;
        }

        if (!useByok && usageUnit === "tokens") {
          consumedUsageAmount = Math.max(finalUsageAmount, hasAssistantOutput ? 1 : 0);
          if (consumedUsageAmount > 0) {
            await consumeUsage({
              userId,
              category: usageCategory,
              isAnonymous,
              amount: consumedUsageAmount,
              allowLimitOverflow: true,
            });
            usageConsumed = true;
          }
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
        await refundConsumedUsage();
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

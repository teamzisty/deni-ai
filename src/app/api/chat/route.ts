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
import { checkBotId } from "botid/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateTitle, getChatById, updateChat } from "@/lib/chat";
import { clearChatGeneration, startChatGeneration } from "@/lib/chat-generation";
import { createChatTools } from "@/lib/chat-tools";
import { getModelContextWindow, getModelDefinition } from "@/lib/constants";
import { buildMemoryPrompt, getUserMemoryState, maybeAutoSaveMemories } from "@/lib/memory";
import { buildProjectPrompt } from "@/lib/project-context";
import { consumeUsage, UsageLimitError } from "@/lib/usage";
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

  const { model, providerOptions, usageCategory, useByok } = modelContext;

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
      providerOptions,
      system: systemPrompt,
    });
  } catch (error) {
    await rollbackPendingAssistantState();
    clearGenerationLock();
    throw new Error(formatChatStreamError(error, baseModel));
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
          onError: (error) => formatChatStreamError(error, baseModel),
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
        throw new Error(formatChatStreamError(error, baseModel));
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

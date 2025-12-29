import {
  type AnthropicProviderOptions,
  anthropic,
  createAnthropic,
} from "@ai-sdk/anthropic";
import {
  createGoogleGenerativeAI,
  type GoogleGenerativeAIProviderOptions,
  google,
} from "@ai-sdk/google";
import { createGroq, groq } from "@ai-sdk/groq";
import {
  createOpenAI,
  type OpenAIResponsesProviderOptions,
  openai,
} from "@ai-sdk/openai";
import {
  convertToModelMessages,
  generateText,
  type LanguageModel,
  safeValidateUIMessages,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
} from "ai";
import { checkBotId } from "botid/server";
import { load } from "cheerio";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/drizzle";
import { customModel, providerKey, providerSetting } from "@/db/schema";
import { env } from "@/env";
import { auth } from "@/lib/auth";
import { generateTitle, getChatById, updateChat } from "@/lib/chat";
import { models } from "@/lib/constants";
import { decryptFromB64 } from "@/lib/crypto";
import {
  consumeUsage,
  getUsageSummary,
  type UsageCategory,
  UsageLimitError,
} from "@/lib/usage";
import {
  veoAspectRatios,
  veoDurations,
  veoModelValues,
  veoResolutions,
} from "@/lib/veo";

const VEO_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const VEO_POLL_INTERVAL_MS = 5000;
const VEO_MAX_POLL_ATTEMPTS = 90;

const UIMessagesSchema = z
  .array(z.record(z.string(), z.unknown()))
  .transform((value) => value as unknown as UIMessage[]);

type SearchResult = {
  title: string;
  url: string;
  description: string;
};

const veoToolInputSchema = z.object({
  prompt: z.string().min(1).max(4000).describe("Video prompt"),
  model: z.enum(veoModelValues).optional().describe("Veo model"),
  negativePrompt: z.string().max(2000).optional().describe("Negative prompt"),
  aspectRatio: z.enum(veoAspectRatios).optional().describe("Aspect ratio"),
  resolution: z.enum(veoResolutions).optional().describe("Resolution"),
  durationSeconds: z
    .number()
    .int()
    .refine((value) => veoDurations.some((duration) => duration === value), {
      message: "Invalid duration",
    })
    .optional()
    .describe("Duration in seconds"),
  seed: z
    .number()
    .int()
    .min(0)
    .max(2_147_483_647)
    .optional()
    .describe("Optional seed"),
});

function extractVeoErrorMessage(
  responseData: unknown,
  fallback: string,
): string {
  if (typeof responseData === "object" && responseData !== null) {
    const message = (responseData as { error?: { message?: string } }).error
      ?.message;
    return message || fallback;
  }
  return fallback;
}

async function pollVeoOperation(operationName: string) {
  for (let attempt = 0; attempt < VEO_MAX_POLL_ATTEMPTS; attempt += 1) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${operationName}`,
      {
        headers: {
          "x-goog-api-key": env.GOOGLE_GENERATIVE_AI_API_KEY,
        },
      },
    );

    let responseData: unknown = null;
    try {
      responseData = await response.json();
    } catch {
      responseData = null;
    }

    if (!response.ok) {
      throw new Error(
        extractVeoErrorMessage(responseData, "Failed to check video status."),
      );
    }

    const done =
      typeof responseData === "object" && responseData !== null
        ? Boolean((responseData as { done?: boolean }).done)
        : false;
    const errorMessage =
      typeof responseData === "object" && responseData !== null
        ? (responseData as { error?: { message?: string } }).error?.message
        : null;
    const videoUri =
      typeof responseData === "object" && responseData !== null
        ? ((
            responseData as {
              response?: {
                generateVideoResponse?: {
                  generatedSamples?: Array<{ video?: { uri?: string } }>;
                };
              };
            }
          ).response?.generateVideoResponse?.generatedSamples?.[0]?.video
            ?.uri ?? null)
        : null;

    if (done) {
      if (errorMessage) {
        throw new Error(errorMessage);
      }

      if (!videoUri) {
        throw new Error("Video generation finished without a file.");
      }

      return videoUri;
    }

    await new Promise((resolve) => setTimeout(resolve, VEO_POLL_INTERVAL_MS));
  }

  throw new Error("Timed out waiting for the video.");
}

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
  const isAnonymous = Boolean(session?.user?.isAnonymous);

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
      reasoningEffort: z.enum(["low", "medium", "high"]).optional(),
      video: z.boolean().optional(),
    })
    .safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const {
    id,
    messages: rawMessages = [],
    model: baseModel,
    reasoningEffort = "high",
    video: videoMode = false,
  } = parsedBody.data;

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
    apiKey: "no_api_key_needed",
    baseURL: "https://capi.voids.top/v2", // safe custom openai-compatible api
  });
  const isCustomModel = baseModel.startsWith("custom:");
  const customModelId = isCustomModel
    ? baseModel.slice("custom:".length)
    : null;
  const selectedModel = models.find((m) => m.value === baseModel);
  const customEntry = customModelId
    ? await db
        .select()
        .from(customModel)
        .where(
          and(
            eq(customModel.userId, userId),
            eq(customModel.id, customModelId),
          ),
        )
        .limit(1)
        .then((rows) => rows[0] ?? null)
    : null;

  if (!selectedModel && !customEntry) {
    return NextResponse.json({ error: "Unknown model" }, { status: 400 });
  }

  const isPremiumModel = Boolean(
    customEntry?.premium ?? selectedModel?.premium ?? false,
  );

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

  const providerKeyMap = new Map(
    providerKeys.map((entry) => [entry.provider, entry.keyEnc]),
  );
  const providerSettingMap = new Map(
    providerSettings.map((entry) => [entry.provider, entry]),
  );

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
        setting?.apiStyle === "chat"
          ? "chat"
          : providerId === "xai"
            ? "chat"
            : "responses";
      useByok = true;
    }
  }

  if (providerId === "xai" && useByok && !byokBaseUrl) {
    byokBaseUrl = "https://api.x.ai/v1";
  }

  if (!useByok) {
    try {
      const usageSummary = await getUsageSummary({ userId, isAnonymous });
      const categoryUsage = usageSummary.usage.find(
        (usage) => usage.category === usageCategory,
      );

      if (
        categoryUsage?.remaining !== null &&
        categoryUsage?.remaining !== undefined &&
        categoryUsage.remaining <= 0
      ) {
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
  }

  const resolvedModelId = customEntry?.modelId ?? selectedModel?.value;
  if (!resolvedModelId) {
    return NextResponse.json({ error: "Unknown model" }, { status: 400 });
  }

  let model: LanguageModel;
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
        model = openai(resolvedModelId);
      }
      break;
    }
    case "anthropic": {
      if (useByok) {
        const provider = createAnthropic({
          apiKey: byokApiKey,
          baseURL: byokBaseUrl,
        });
        model = provider(resolvedModelId);
      } else {
        model = anthropic(resolvedModelId);
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
        model = google(resolvedModelId);
      }
      break;
    }
    case "xai": {
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
        model = voids.chat(resolvedModelId);
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

  const tools = {
    search: tool({
      description: "Surf web and get page summary",
      inputSchema: z.object({
        query: z.string().min(1).describe("Search query"),
        amount: z
          .number()
          .int()
          .min(5)
          .max(15)
          .optional()
          .describe("Number of search pages (min 5, max 15)"),
      }),
      execute: async ({ query, amount }) => {
        const maxResults = Math.min(Math.max(amount ?? 10, 5), 15);
        try {
          const BRAVE_API_KEY = env.BRAVE_SEARCH_API_KEY;
          if (!BRAVE_API_KEY) {
            throw new Error("Brave Search API key not configured");
          }

          const params = new URLSearchParams({
            q: query,
            count: maxResults.toString(),
          });

          const response = await fetch(
            `https://api.search.brave.com/res/v1/web/search?${params.toString()}`,
            {
              headers: {
                Accept: "application/json",
                "Accept-Encoding": "gzip",
                "X-Subscription-Token": BRAVE_API_KEY,
              },
            },
          );

          if (!response.ok) {
            throw new Error(`Brave Search API error: ${response.status}`);
          }

          const data = await response.json();
          const results: SearchResult[] = (data.web?.results ?? []).map(
            (item: { title: string; url: string; description: string }) => ({
              title: item.title,
              url: item.url,
              description: item.description,
            }),
          );

          console.log("Brave search results:", results);

          // Fetch and summarize each page
          const summarizer = groq("openai/gpt-oss-20b");
          const summarizedResults = await Promise.all(
            results.map(async (result) => {
              try {
                const pageResponse = await fetch(result.url, {
                  headers: {
                    "User-Agent": "Mozilla/5.0 (compatible; DeniAI/1.0)",
                  },
                });

                if (!pageResponse.ok) {
                  return { ...result, summary: result.description };
                }

                const html = await pageResponse.text();
                const $ = load(html);

                // Extract text content
                $("script, style, nav, footer, header").remove();
                const textContent = $("body")
                  .text()
                  .replace(/\s+/g, " ")
                  .trim()
                  .slice(0, 8000); // Limit to 8000 chars

                if (!textContent) {
                  return { ...result, summary: result.description };
                }

                // Generate summary with AI
                const { text: summary } = await generateText({
                  model: summarizer,
                  prompt: `Summarize the following webpage content detailed:\n\n${textContent}`,
                  maxOutputTokens: 2000,
                });

                return { ...result, summary: summary.trim() };
              } catch (error) {
                console.error(`Failed to summarize ${result.url}:`, error);
                return { ...result, summary: result.description };
              }
            }),
          );

          return summarizedResults;
        } catch (error) {
          console.error("Search tool error:", error);
          throw new Error("Web search failed. Please try again later.");
        }
      },
    }),
    ...(videoMode
      ? {
          video: tool({
            description:
              "Generate a short video with Veo. Provide a vivid visual prompt and optional settings.",
            inputSchema: veoToolInputSchema,
            execute: async ({
              prompt,
              model: requestedModel,
              negativePrompt,
              aspectRatio,
              resolution,
              durationSeconds,
              seed,
            }) => {
              const model = requestedModel ?? veoModelValues[0];
              const finalAspectRatio = aspectRatio ?? "16:9";
              const finalResolution = resolution ?? "720p";
              const finalDuration =
                finalResolution === "1080p" ? 8 : (durationSeconds ?? 6);
              const trimmedNegative = negativePrompt?.trim() || undefined;

              const instances: Record<string, unknown>[] = [
                {
                  prompt,
                },
              ];

              const parameters: Record<string, unknown> = {
                aspectRatio: finalAspectRatio,
                resolution: finalResolution,
                durationSeconds: finalDuration,
              };

              if (trimmedNegative) {
                parameters.negativePrompt = trimmedNegative;
              }
              if (seed !== undefined) {
                parameters.seed = seed;
              }

              const response = await fetch(
                `${VEO_BASE_URL}/models/${model}:predictLongRunning`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": env.GOOGLE_GENERATIVE_AI_API_KEY,
                  },
                  body: JSON.stringify({ instances, parameters }),
                },
              );

              let responseData: unknown = null;
              try {
                responseData = await response.json();
              } catch {
                responseData = null;
              }

              if (!response.ok) {
                throw new Error(
                  extractVeoErrorMessage(
                    responseData,
                    "Failed to start video generation.",
                  ),
                );
              }

              const operationName =
                typeof responseData === "object" && responseData !== null
                  ? (responseData as { name?: string }).name
                  : undefined;

              if (!operationName) {
                throw new Error("Missing operation name.");
              }

              const videoUri = await pollVeoOperation(operationName);
              const proxyUrl = `/api/veo/file?uri=${encodeURIComponent(
                videoUri,
              )}`;
              const modelLabel = model;

              return {
                videoUrl: proxyUrl,
                operationName,
                model,
                modelLabel,
                aspectRatio: finalAspectRatio,
                resolution: finalResolution,
                durationSeconds: finalDuration,
                seed: seed ?? null,
                negativePrompt: trimmedNegative ?? null,
              };
            },
          }),
        }
      : {}),
  };

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
    toolChoice: videoMode ? { type: "tool", toolName: "video" } : undefined,
    providerOptions: {
      openai: {
        reasoningEffort,
        reasoningSummary: "detailed",
      } satisfies OpenAIResponsesProviderOptions,
      anthropic: {
        thinking: {
          type: "enabled",
          budgetTokens:
            reasoningEffort === "low"
              ? 1024
              : reasoningEffort === "high"
                ? 16000
                : 8192,
        },
      } satisfies AnthropicProviderOptions,
      google: {
        thinkingConfig: {
          thinkingLevel: reasoningEffort,
          includeThoughts: true,
        },
      } satisfies GoogleGenerativeAIProviderOptions,
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
        const chat = await getChatById(id);
        if (chat?.title === "New Chat") {
          newTitle = await generateTitle(updatedMessages);
        }
      } catch (error) {
        console.error("Failed to generate title", error);
      }

      await updateChat(id, updatedMessages, newTitle);

      if (!useByok) {
        try {
          await consumeUsage({
            userId,
            category: usageCategory,
            isAnonymous,
          });
        } catch (error) {
          console.error("Failed to record usage", error);
        }
      }
    },
  });
}

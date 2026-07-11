import { type AnthropicProviderOptions, createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI, type GoogleGenerativeAIProviderOptions } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { createXai, type XaiProviderOptions } from "@ai-sdk/xai";
import { createOpenAI, type OpenAIResponsesProviderOptions } from "@ai-sdk/openai";
import type { LanguageModel, ModelMessage, SystemModelMessage } from "ai";
import { streamText } from "ai";
import { eq } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { providerKey, providerSetting } from "@/db/schema";
import { env } from "@/env";
import { decryptFromB64 } from "@/lib/crypto";
import { models, resolveReasoningEffort } from "@/lib/constants";
import { assertSafePublicHttpUrl } from "@/lib/network-security";
import { createDeniOpenRouter } from "@/lib/openrouter-provider";
import { getUsageSummary, type UsageCategory, UsageLimitError } from "@/lib/usage";

const voids = createOpenAI({
  apiKey: "no_api_key_needed",
  baseURL: "https://capi.voids.top/v2",
});

const openaiEffortOptions = ["none", "minimal", "low", "medium", "high", "xhigh", "max"] as const;
const anthropicEffortOptions = ["low", "medium", "high", "max"] as const;
const googleThinkingLevels = ["minimal", "low", "medium", "high"] as const;
const anthropicBudgetModelIds = new Set(["claude-opus-4.1", "claude-opus-4", "claude-sonnet-4"]);

export class ChatRouteError extends Error {
  status: number;
  body: Record<string, unknown>;

  constructor(status: number, body: Record<string, unknown>) {
    super(typeof body.error === "string" ? body.error : "Chat route error");
    this.status = status;
    this.body = body;
  }
}

const OPENROUTER_CACHE_CONTROL = {
  type: "ephemeral",
  ttl: "1h",
} as const;

type ResolveChatModelContextParams = {
  userId: string;
  isAnonymous: boolean;
  baseModel: string;
  reasoningEffort: "none" | "minimal" | "low" | "medium" | "high" | "xhigh" | "max";
  /** GPT-5.6 Pro reasoning mode (`reasoning.mode: "pro"`). */
  proMode?: boolean;
};

type ChatProviderOptions = NonNullable<Parameters<typeof streamText>[0]["providerOptions"]>;

type ResolvedChatModelContext = {
  model: LanguageModel;
  useByok: boolean;
  usesOpenRouter: boolean;
  usageCategory: UsageCategory;
  usageUnit: "requests" | "tokens";
  providerOptions: ChatProviderOptions;
};

function mergeProviderOptions(
  existing: ChatProviderOptions | undefined,
  additions: ChatProviderOptions,
): ChatProviderOptions {
  return {
    ...existing,
    ...additions,
  };
}

export function addOpenRouterCacheControl(
  messages: ModelMessage[],
  system: string,
): { messages: ModelMessage[]; system: SystemModelMessage } {
  const cacheProviderOptions = {
    openrouter: {
      cacheControl: OPENROUTER_CACHE_CONTROL,
    },
  } satisfies ChatProviderOptions;

  return {
    system: {
      role: "system",
      content: system,
      providerOptions: cacheProviderOptions,
    },
    messages: messages.map((message) => {
      if (typeof message.content === "string") {
        return {
          ...message,
          providerOptions: mergeProviderOptions(message.providerOptions, cacheProviderOptions),
        } as ModelMessage;
      }

      return {
        ...message,
        content: message.content.map((part) =>
          part.type === "text"
            ? {
                ...part,
                providerOptions: mergeProviderOptions(part.providerOptions, cacheProviderOptions),
              }
            : part,
        ),
      } as ModelMessage;
    }),
  };
}

export async function resolveChatModelContext({
  userId,
  isAnonymous,
  baseModel,
  reasoningEffort,
  proMode = false,
}: ResolveChatModelContextParams): Promise<ResolvedChatModelContext> {
  const selectedModel = models.find((model) => model.value === baseModel);

  if (!selectedModel) {
    throw new ChatRouteError(400, { error: "Unknown model" });
  }

  const useProMode = Boolean(proMode && selectedModel.supportsProMode);
  const isPremiumModel = Boolean(selectedModel.premium);
  // Pro mode always bills against premium quota (even when the base model is basic).
  const usageCategory: UsageCategory = isPremiumModel || useProMode ? "premium" : "basic";

  if (isAnonymous && usageCategory === "premium") {
    throw new ChatRouteError(403, {
      error: useProMode
        ? "Pro mode is not available for guest sessions."
        : "Premium models are not available for guest sessions.",
    });
  }
  let usageUnit: "requests" | "tokens" = "requests";
  const [providerKeys, providerSettings] = await Promise.all([
    db.select().from(providerKey).where(eq(providerKey.userId, userId)),
    db.select().from(providerSetting).where(eq(providerSetting.userId, userId)),
  ]);

  const providerKeyMap = new Map(providerKeys.map((entry) => [entry.provider, entry.keyEnc]));
  const providerSettingMap = new Map(providerSettings.map((entry) => [entry.provider, entry]));
  const providerId = selectedModel.provider ?? selectedModel.author;

  if (!providerId) {
    throw new ChatRouteError(400, { error: "Unknown provider" });
  }

  let useByok = false;
  let byokApiKey: string | undefined;
  let byokBaseUrl: string | undefined;

  const keyEnc = providerKeyMap.get(providerId);
  const setting = providerSettingMap.get(providerId);
  const preferByok = setting?.preferByok ?? false;

  if (preferByok && keyEnc) {
    byokApiKey = await decryptFromB64(keyEnc);
    byokBaseUrl = setting?.baseUrl ?? undefined;
    useByok = true;
  }

  if (providerId === "xai" && useByok && !byokBaseUrl) {
    byokBaseUrl = "https://api.x.ai/v1";
  }

  if (byokBaseUrl) {
    try {
      await assertSafePublicHttpUrl(byokBaseUrl);
    } catch {
      throw new ChatRouteError(400, {
        error: "BYOK endpoints to private networks are not allowed.",
      });
    }
  }

  if (!useByok) {
    try {
      const usageSummary = await getUsageSummary({ userId, isAnonymous });
      const categoryUsage = usageSummary.usage.find((usage) => usage.category === usageCategory);
      usageUnit = categoryUsage?.unit ?? "requests";
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
        throw new ChatRouteError(402, {
          error: error.message,
          reason: "usage_limit",
        });
      }

      console.error("Failed to check usage", error);
      throw new ChatRouteError(500, { error: "Unable to check usage" });
    }
  }

  // OpenRouter exposes GPT-5.6 Pro as a `*-pro` model slug. BYOK OpenAI uses
  // the base model id with `reasoning.mode: "pro"` instead.
  const resolvedModelId =
    useProMode && !useByok ? `${selectedModel.value}-pro` : selectedModel.value;

  const resolvedReasoningEffort = resolveReasoningEffort(
    selectedModel?.efforts ?? false,
    reasoningEffort,
  );
  const openaiReasoningEffort =
    providerId === "openai" &&
    resolvedReasoningEffort &&
    openaiEffortOptions.includes(resolvedReasoningEffort as (typeof openaiEffortOptions)[number])
      ? (resolvedReasoningEffort as (typeof openaiEffortOptions)[number])
      : undefined;
  const openaiReasoningMode =
    providerId === "openai" && useProMode && useByok ? ("pro" as const) : undefined;
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

  const selectedOpenRouterModelId = selectedModel
    ? resolvedModelId.includes("/")
      ? resolvedModelId
      : `${selectedModel.author}/${resolvedModelId}`
    : null;
  const getOpenRouterModel = () => {
    if (!selectedOpenRouterModelId) {
      throw new Error("OpenRouter model is not available for the selected model.");
    }

    const openrouter = createDeniOpenRouter({
      apiKey: env.OPENROUTER_API_KEY,
    });

    return openrouter.chat(selectedOpenRouterModelId, {
      provider: {
        allow_fallbacks: false,
        only: ["openai", "anthropic", "google", "xai"],
      },
    });
  };
  const getAnthropicModel = (apiKey: string | undefined, baseURL?: string) => {
    const provider = createAnthropic({
      apiKey,
      baseURL,
    });

    return provider(resolvedModelId.replace(".", "-"));
  };

  const anthropicOptions: AnthropicProviderOptions = {};
  if (anthropicReasoningEffort) {
    anthropicOptions.effort = anthropicReasoningEffort;
  }
  if (anthropicThinkingBudget) {
    anthropicOptions.thinking = {
      type: "enabled",
      budgetTokens: anthropicThinkingBudget,
    };
  }

  let model: LanguageModel;
  switch (providerId) {
    case "openai": {
      if (useByok) {
        const provider = createOpenAI({
          apiKey: byokApiKey,
          baseURL: byokBaseUrl,
        });
        model = provider.responses(resolvedModelId);
      } else {
        model = getOpenRouterModel();
      }
      break;
    }
    case "anthropic": {
      if (useByok) {
        model = getAnthropicModel(byokApiKey, byokBaseUrl);
      } else {
        model = getAnthropicModel(env.ANTHROPIC_API_KEY);
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
        model = getOpenRouterModel();
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
    default:
      model = voids.chat(resolvedModelId);
      break;
  }

  const openaiProviderOptions: OpenAIResponsesProviderOptions | undefined =
    openaiReasoningEffort || openaiReasoningMode
      ? {
          ...(openaiReasoningEffort
            ? {
                reasoningEffort: openaiReasoningEffort,
                reasoningSummary: "detailed" as const,
              }
            : {}),
          ...(openaiReasoningMode ? { reasoningMode: openaiReasoningMode } : {}),
        }
      : undefined;

  const directProviderOptions = {
    ...(openaiProviderOptions
      ? {
          openai: openaiProviderOptions,
        }
      : {}),
    ...(Object.keys(anthropicOptions).length > 0
      ? {
          anthropic: anthropicOptions,
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
  };

  // When routing through OpenRouter, wrap provider-specific options so they are
  // forwarded in OpenRouter-compatible format.
  const providerOptions: ChatProviderOptions = (
    useByok || providerId === "anthropic"
      ? directProviderOptions
      : Object.keys(directProviderOptions).length > 0
        ? { openrouter: { providerOptions: directProviderOptions } }
        : {}
  ) as ChatProviderOptions;

  return {
    model,
    useByok,
    usesOpenRouter: !useByok && ["openai", "google", "xai"].includes(providerId),
    usageCategory,
    usageUnit,
    providerOptions,
  };
}

import { type AnthropicProviderOptions, createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI, type GoogleGenerativeAIProviderOptions } from "@ai-sdk/google";
import type { GatewayLanguageModelOptions } from "@ai-sdk/gateway";
import { createGroq } from "@ai-sdk/groq";
import { createXai, type XaiProviderOptions } from "@ai-sdk/xai";
import { createOpenAI, type OpenAIResponsesProviderOptions } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import { createGateway, streamText } from "ai";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { customModel, providerKey, providerSetting } from "@/db/schema";
import { env } from "@/env";
import { decryptFromB64 } from "@/lib/crypto";
import { models, resolveReasoningEffort } from "@/lib/constants";
import { assertSafePublicHttpUrl } from "@/lib/network-security";
import { getUsageSummary, type UsageCategory, UsageLimitError } from "@/lib/usage";

const voids = createOpenAI({
  apiKey: "no_api_key_needed",
  baseURL: "https://capi.voids.top/v2",
});

const openaiEffortOptions = ["none", "minimal", "low", "medium", "high", "xhigh"] as const;
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

type ResolveChatModelContextParams = {
  userId: string;
  isAnonymous: boolean;
  baseModel: string;
  reasoningEffort: "none" | "minimal" | "low" | "medium" | "high" | "xhigh" | "max";
};

type ChatProviderOptions = NonNullable<Parameters<typeof streamText>[0]["providerOptions"]>;

type ResolvedChatModelContext = {
  model: LanguageModel;
  useByok: boolean;
  usageCategory: UsageCategory;
  usageUnit: "requests" | "tokens";
  providerOptions: ChatProviderOptions;
};

export async function resolveChatModelContext({
  userId,
  isAnonymous,
  baseModel,
  reasoningEffort,
}: ResolveChatModelContextParams): Promise<ResolvedChatModelContext> {
  const isCustomModel = baseModel.startsWith("custom:");
  const customModelId = isCustomModel ? baseModel.slice("custom:".length) : null;
  const selectedModel = models.find((model) => model.value === baseModel);
  const customEntry = customModelId
    ? await db
        .select()
        .from(customModel)
        .where(and(eq(customModel.userId, userId), eq(customModel.id, customModelId)))
        .limit(1)
        .then((rows) => rows[0] ?? null)
    : null;

  if (!selectedModel && !customEntry) {
    throw new ChatRouteError(400, { error: "Unknown model" });
  }

  const isPremiumModel = Boolean(customEntry?.premium ?? selectedModel?.premium ?? false);

  if (isAnonymous && isPremiumModel) {
    throw new ChatRouteError(403, {
      error: "Premium models are not available for guest sessions.",
    });
  }

  const usageCategory: UsageCategory = isPremiumModel ? "premium" : "basic";
  let usageUnit: "requests" | "tokens" = "requests";
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
    throw new ChatRouteError(400, { error: "Unknown provider" });
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
      throw new ChatRouteError(400, {
        error: "OpenAI-compatible endpoint not configured.",
        reason: "byok",
      });
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
        throw new ChatRouteError(402, { error: error.message, reason: "usage_limit" });
      }

      console.error("Failed to check usage", error);
      throw new ChatRouteError(500, { error: "Unable to check usage" });
    }
  }

  const resolvedModelId = customEntry?.modelId ?? selectedModel?.value;
  if (!resolvedModelId) {
    throw new ChatRouteError(400, { error: "Unknown model" });
  }

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
        model = provider(resolvedModelId.replace(".", "-"));
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

  const providerOptions = {
    ...(openaiReasoningEffort
      ? {
          openai: {
            reasoningEffort: openaiReasoningEffort,
            reasoningSummary: "detailed",
          } satisfies OpenAIResponsesProviderOptions,
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
    gateway: gatewayOptions,
  } satisfies ChatProviderOptions;

  return {
    model,
    useByok,
    usageCategory,
    usageUnit,
    providerOptions,
  };
}

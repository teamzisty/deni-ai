import { useExtracted } from "next-intl";
import { useMemo } from "react";
import type { ModelOption } from "@/components/chat/chat-composer";
import { trpc } from "@/lib/trpc/react";

type ProviderSetting = {
  provider: string;
  preferByok: boolean;
  baseUrl: string | null;
  apiStyle: string;
};

export function useUsageStatus(params: {
  model: string;
  availableModels: ModelOption[];
  providerKeys: Set<string>;
  providerSettings: Map<string, ProviderSetting>;
}) {
  const t = useExtracted();
  const { model, availableModels, providerKeys, providerSettings } = params;

  const usageQuery = trpc.billing.usage.useQuery(undefined, {
    refetchOnWindowFocus: true,
    staleTime: 30000,
  });

  const selectedModel = availableModels.find((m) => m.value === model);
  const usageCategory = selectedModel?.premium ? "premium" : "basic";
  const categoryUsage = usageQuery.data?.usage.find((usage) => usage.category === usageCategory);
  const remainingUsage = categoryUsage?.remaining;
  const usageLimit = categoryUsage?.limit;
  const usageTier = usageQuery.data?.tier ?? "free";

  const lowUsageThreshold = useMemo(() => {
    if (
      remainingUsage === null ||
      remainingUsage === undefined ||
      usageLimit === null ||
      usageLimit === undefined
    ) {
      return null;
    }
    const computed = Math.ceil(usageLimit * 0.1);
    return Math.max(3, Math.min(20, computed));
  }, [remainingUsage, usageLimit]);

  const selectedProvider = selectedModel?.author ?? null;
  const openAiCompatSetting = providerSettings.get("openai_compatible");
  const openAiCompatReady =
    providerKeys.has("openai_compatible") && Boolean(openAiCompatSetting?.baseUrl);

  const isByokActive = (() => {
    if (!selectedProvider) return false;
    if (selectedProvider === "openai_compatible") {
      return openAiCompatReady;
    }
    const prefer = providerSettings.get(selectedProvider)?.preferByok ?? false;
    return prefer && providerKeys.has(selectedProvider);
  })();

  const isByokMissingConfig = selectedProvider === "openai_compatible" && !openAiCompatReady;

  const maxModeEnabled = usageQuery.data?.maxModeEnabled ?? false;
  const isUsageLow =
    !isByokActive &&
    !maxModeEnabled &&
    remainingUsage !== null &&
    remainingUsage !== undefined &&
    usageLimit !== null &&
    usageLimit !== undefined &&
    lowUsageThreshold !== null &&
    remainingUsage > 0 &&
    remainingUsage <= lowUsageThreshold;
  const isUsageBlocked =
    !isByokActive &&
    !maxModeEnabled &&
    remainingUsage !== null &&
    remainingUsage !== undefined &&
    remainingUsage <= 0;
  const usageCategoryLabel = usageCategory === "premium" ? t("Premium") : t("Basic");
  const usageTierLabel =
    usageTier === "free" ? t("Free") : usageTier === "plus" ? t("Plus") : t("Pro");
  const maxModeEligible = usageQuery.data?.maxModeEligible ?? false;
  const canEnableMaxMode = maxModeEligible && !maxModeEnabled && isUsageBlocked;
  const isSubmitBlocked = (isUsageBlocked && !maxModeEnabled) || isByokMissingConfig;

  const enableMaxMode = trpc.billing.enableMaxMode.useMutation({
    onSuccess: () => {
      usageQuery.refetch();
    },
  });

  return {
    usageQuery,
    selectedModel,
    usageTier,
    isByokActive,
    isByokMissingConfig,
    isUsageLow,
    isUsageBlocked,
    canEnableMaxMode,
    isSubmitBlocked,
    usageCategoryLabel,
    usageTierLabel,
    remainingUsage,
    enableMaxMode,
  };
}

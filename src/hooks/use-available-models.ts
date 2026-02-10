import { useExtracted } from "next-intl";
import { useMemo } from "react";
import type { ModelOption } from "@/components/chat/chat-composer";
import { authClient } from "@/lib/auth-client";
import { models } from "@/lib/constants";
import { trpc } from "@/lib/trpc/react";

type ProviderSetting = {
  provider: string;
  preferByok: boolean;
  baseUrl: string | null;
  apiStyle: string;
};

export function useAvailableModels() {
  const t = useExtracted();
  const session = authClient.useSession();
  const isAnonymous = Boolean(session.data?.user?.isAnonymous);

  const providersQuery = trpc.providers.getConfig.useQuery(undefined, {
    refetchOnWindowFocus: false,
    staleTime: 30000,
  });

  const customModels = useMemo<ModelOption[]>(() => {
    return (providersQuery.data?.customModels ?? []).map((entry) => ({
      name: entry.name,
      value: `custom:${entry.id}`,
      description: entry.description ?? t("Custom model"),
      author: "openai_compatible" as const,
      features: [],
      premium: entry.premium,
      default: false,
      source: "custom" as const,
    }));
  }, [providersQuery.data?.customModels, t]);

  const availableModels = useMemo<ModelOption[]>(() => {
    const baseModels = isAnonymous
      ? (models as unknown as ModelOption[]).filter((entry) => !entry.premium)
      : (models as unknown as ModelOption[]);
    const filteredCustomModels = isAnonymous
      ? customModels.filter((entry) => !entry.premium)
      : customModels;
    return [...baseModels, ...filteredCustomModels];
  }, [customModels, isAnonymous]);

  const providerSettings = useMemo(() => {
    return new Map<string, ProviderSetting>(
      (providersQuery.data?.settings ?? []).map((setting) => [setting.provider, setting]),
    );
  }, [providersQuery.data?.settings]);

  const providerKeys = useMemo(() => {
    return new Set((providersQuery.data?.keys ?? []).map((entry) => entry.provider));
  }, [providersQuery.data?.keys]);

  return {
    availableModels,
    customModels,
    providerSettings,
    providerKeys,
    providersQuery,
    isAnonymous,
  };
}

import { useMemo } from "react";
import type { ModelOption } from "@/components/chat/chat-composer";
import { authClient } from "@/lib/auth-client";
import { models } from "@/lib/constants";
import { trpc } from "@/lib/trpc/react";

type ProviderSetting = {
  provider: string;
  preferByok: boolean;
  baseUrl: string | null;
};

export function useAvailableModels() {
  const session = authClient.useSession();
  const isAnonymous = Boolean(session.data?.user?.isAnonymous);

  const providersQuery = trpc.providers.getConfig.useQuery(undefined, {
    refetchOnWindowFocus: false,
    staleTime: 30000,
  });

  const availableModels = useMemo<ModelOption[]>(() => {
    return isAnonymous ? models.filter((entry) => !entry.premium) : [...models];
  }, [isAnonymous]);

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
    providerSettings,
    providerKeys,
    providersQuery,
    isAnonymous,
  };
}

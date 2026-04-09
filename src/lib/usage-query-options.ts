export const liveUsageQueryOptions = {
  staleTime: 30_000,
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
  refetchInterval: false,
  refetchIntervalInBackground: false,
} as const;

export const settingsUsageQueryOptions = {
  staleTime: 60_000,
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
  refetchInterval: false,
  refetchIntervalInBackground: false,
} as const;

export const passiveUsageQueryOptions = {
  staleTime: 5 * 60_000,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchInterval: false,
  refetchIntervalInBackground: false,
} as const;

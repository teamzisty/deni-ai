export const liveUsageQueryOptions = {
  staleTime: 0,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  refetchInterval: 5000,
  refetchIntervalInBackground: false,
} as const;

export const settingsUsageQueryOptions = {
  staleTime: 0,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  refetchInterval: false,
  refetchIntervalInBackground: false,
} as const;

// Simple in-memory cache for usage data
const usageCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function getCachedUsage(userId: string, type: 'usage' | 'stats' = 'usage'): any | null {
  const key = `${userId}:${type}`;
  const cached = usageCache.get(key);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  return null;
}

export function setCachedUsage(userId: string, type: 'usage' | 'stats', data: any): void {
  const key = `${userId}:${type}`;
  usageCache.set(key, {
    data,
    timestamp: Date.now()
  });
}

export function clearUserCache(userId: string): void {
  const keysToDelete = Array.from(usageCache.keys()).filter(key => key.startsWith(userId));
  keysToDelete.forEach(key => usageCache.delete(key));
}

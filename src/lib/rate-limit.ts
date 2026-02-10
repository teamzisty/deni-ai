//import "server-only";

type RateLimitEntry = {
  count: number;
  resetTime: number;
};

const store = new Map<string, RateLimitEntry>();

// Periodic cleanup of expired entries
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now >= entry.resetTime) {
      store.delete(key);
    }
  }
}, 60_000);

/**
 * Simple in-memory sliding-window rate limiter.
 * Returns { allowed: true } if within limits, or { allowed: false, retryAfter } if exceeded.
 */
export function checkRateLimit({
  key,
  windowMs,
  maxRequests,
}: {
  key: string;
  windowMs: number;
  maxRequests: number;
}): { allowed: true } | { allowed: false; retryAfter: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now >= entry.resetTime) {
    store.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetTime - now) / 1000) };
  }

  entry.count++;
  return { allowed: true };
}

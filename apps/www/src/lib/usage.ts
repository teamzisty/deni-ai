import { models, PREMIUM_USES_LIMIT } from "./constants";
import { db, uses, users } from "./db";
import { eq, and, gte, desc } from "drizzle-orm";

export interface UsageLimit {
  model: string;
  limit: number;
  premium: boolean;
}

export interface UsageInfo {
  model: string;
  count: number;
  limit: number;
  premium: boolean;
  canUse: boolean;
  remaining: number;
}

export const MODEL_LIMITS: Record<string, UsageLimit> = Object.entries(
  models,
).reduce(
  (acc, [modelKey, modelData]) => {
    const premium = models[modelKey]?.premium || false;
    acc[modelKey] = {
      model: modelKey,
      limit: premium ? PREMIUM_USES_LIMIT : -1, // -1 means unlimited
      premium,
    };
    return acc;
  },
  {} as Record<string, UsageLimit>,
);

/**
 * Get current usage for a user and model for today
 */
export async function getCurrentUsage(
  userId: string,
  model: string,
): Promise<number> {
  try {
    const today = new Date().toISOString().split("T")[0];

    const [usage] = await db
      .select({ count: uses.count })
      .from(uses)
      .where(
        and(
          eq(uses.userId, userId),
          eq(uses.model, model),
          eq(uses.date, today as string)
        )
      )
      .limit(1);

    return usage?.count || 0;
  } catch (error) {
    console.error("Error getting current usage:", error);
    return 0;
  }
}

/**
 * Get usage information for all models for a user (optimized)
 */
export async function getAllUsage(
  userId: string,
  onlyUsedModels: boolean = false,
): Promise<UsageInfo[]> {
  try {
    const today = new Date().toISOString().split("T")[0];

    // Get all usage data for today in a single query
    const usageData = await db
      .select({ model: uses.model, count: uses.count })
      .from(uses)
      .where(
        and(
          eq(uses.userId, userId),
          eq(uses.date, today as string)
        )
      );

    // Create a map for quick lookup
    const usageMap = new Map<string, number>();
    for (const usage of usageData) {
      usageMap.set(usage.model, usage.count || 0);
    }
    
    // Generate results for all models or only used models
    const results: UsageInfo[] = [];
    const modelsToProcess = onlyUsedModels
      ? Object.entries(MODEL_LIMITS).filter(
          ([modelKey, config]) => usageMap.has(modelKey) || config.premium,
        )
      : Object.entries(MODEL_LIMITS);
    
    for (const [modelKey, config] of modelsToProcess) {
      const currentCount = usageMap.get(modelKey) ?? 0;
      const canUse = config.limit === -1 || currentCount < config.limit;
      const remaining =
        config.limit === -1 ? -1 : Math.max(0, config.limit - currentCount);

      results.push({
        model: modelKey,
        count: currentCount,
        limit: config.limit,
        premium: config.premium,
        canUse,
        remaining,
      });
    }

    return results;
  } catch (error) {
    console.error("Error getting all usage:", error);
    return [];
  }
}

/**
 * Check if a user can use a specific model
 */
export async function canUseModel(
  userId: string,
  model: string,
): Promise<boolean> {
  try {
    // Check users plan
    const [user] = await db
      .select({ plan: users.plan })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const userPlan = user?.plan || "free"; // Default to free plan if not found
    if (userPlan !== "free") {
      return true; // Premium users can use all models without limits
    }

    const config = MODEL_LIMITS[model];

    // If model is not in the limits config, allow unlimited usage
    if (!config) {
      return true;
    }

    // If limit is -1, it means unlimited
    if (config.limit === -1) {
      return true;
    }

    const currentUsage = await getCurrentUsage(userId, model);
    return currentUsage < config.limit;
  } catch (error) {
    console.error("Error checking if user can use model:", error);
    return false;
  }
}

/**
 * Record usage for a model
 */
export async function recordUsage(
  userId: string,
  model: string,
): Promise<void> {
  try {
    const today = new Date().toISOString().split("T")[0];

    // Try to increment existing record first
    const [existingRecord] = await db
      .select()
      .from(uses)
      .where(
        and(
          eq(uses.userId, userId),
          eq(uses.model, model),
          eq(uses.date, today as string)
        )
      )
      .limit(1);

    if (existingRecord) {
      // Update existing record
      await db
        .update(uses)
        .set({
          count: (existingRecord.count || 0) + 1,
          updatedAt: new Date(),
        })
        .where(eq(uses.id, existingRecord.id));
    } else {
      // Create new record
      await db.insert(uses).values({
        userId,
        model,
        count: 1,
        date: today,
      });
    }
  } catch (error) {
    console.error("Error recording usage:", error);
    throw error;
  }
}

/**
 * Get usage statistics for a user (optimized)
 */
export async function getUsageStats(
  userId: string,
  days: number = 30,
): Promise<any[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split("T")[0];

    const data = await db
      .select({
        model: uses.model,
        count: uses.count,
        date: uses.date,
      })
      .from(uses)
      .where(
        and(
          eq(uses.userId, userId),
          gte(uses.date, startDateStr as string)
        )
      )
      .orderBy(desc(uses.date))
      .limit(100); // Limit results to prevent excessive data transfer

    return data || [];
  } catch (error) {
    console.error("Error getting usage stats:", error);
    return [];
  }
}

import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/db/drizzle";
import { billing, usageQuota } from "@/db/schema";

import { isMaxModeEligible, recordMaxModeUsage } from "./max-mode";

const ACTIVE_BILLING_STATUSES = new Set([
  "active",
  "trialing",
  "past_due",
  "incomplete",
  "unpaid",
  "paid",
]);

export type UsageCategory = "basic" | "premium";
export type SubscriptionTier = "free" | "plus" | "pro";
type UsageRecord = typeof usageQuota.$inferSelect;
type BillingRecord = typeof billing.$inferSelect;

const USAGE_CATEGORIES: UsageCategory[] = ["basic", "premium"];

const USAGE_LIMITS: Record<UsageCategory, Record<SubscriptionTier, number | null>> = {
  basic: {
    free: 1500,
    plus: 3000,
    pro: 10000,
  },
  premium: {
    free: 50,
    plus: 250,
    pro: 500,
  },
};

const GUEST_USAGE_LIMITS: Record<UsageCategory, number> = {
  basic: 20,
  premium: 0,
};

export class UsageLimitError extends Error {
  public maxModeAvailable: boolean;
  
  constructor(message: string, maxModeAvailable = false) {
    super(message);
    this.name = "UsageLimitError";
    this.maxModeAvailable = maxModeAvailable;
  }
}

type TierInfo = {
  tier: SubscriptionTier;
  planId: string | null;
  status: string | null;
  periodEnd: Date | null;
  maxModeEnabled: boolean;
  maxModeEligible: boolean;
};

function getDefaultPeriodEnd(now: Date) {
  const startOfNextMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0),
  );
  return startOfNextMonth;
}

async function getTierInfo(userId: string, now: Date): Promise<TierInfo> {
  const [record] = await db
    .select({
      planId: billing.planId,
      status: billing.status,
      currentPeriodEnd: billing.currentPeriodEnd,
      maxModeEnabled: billing.maxModeEnabled,
    })
    .from(billing)
    .where(eq(billing.userId, userId))
    .limit(1);

  if (!record) {
    return {
      tier: "free",
      planId: null,
      status: null,
      periodEnd: getDefaultPeriodEnd(now),
      maxModeEnabled: false,
      maxModeEligible: false,
    };
  }

  const planId = record.planId;
  const status = record.status;
  const hasActiveStatus =
    Boolean(planId) && Boolean(status) && ACTIVE_BILLING_STATUSES.has(status ?? "");
  const inGracePeriod =
    status === "canceled" && record.currentPeriodEnd && record.currentPeriodEnd > now;

  if (!hasActiveStatus && !inGracePeriod) {
    return {
      tier: "free",
      planId,
      status,
      periodEnd: getDefaultPeriodEnd(now),
      maxModeEnabled: false,
      maxModeEligible: false,
    };
  }

  const isPro = (planId ?? "").startsWith("pro");
  const maxModeEligible = isMaxModeEligible(planId) && status === "active";

  return {
    tier: isPro ? "pro" : "plus",
    planId,
    status: status ?? null,
    periodEnd: record.currentPeriodEnd ?? null,
    maxModeEnabled: maxModeEligible && record.maxModeEnabled,
    maxModeEligible,
  };
}

function resolvePeriodEnd(now: Date) {
  return getDefaultPeriodEnd(now);
}

async function calculateUsageState({
  userId,
  category,
  now,
  existingRecord,
  isAnonymous = false,
}: {
  userId: string;
  category: UsageCategory;
  now: Date;
  existingRecord?: UsageRecord;
  isAnonymous?: boolean;
}) {
  const tierInfo = await getTierInfo(userId, now);
  const limit = isAnonymous ? GUEST_USAGE_LIMITS[category] : USAGE_LIMITS[category][tierInfo.tier];

  const current =
    existingRecord ??
    (await db
      .select()
      .from(usageQuota)
      .where(and(eq(usageQuota.userId, userId), eq(usageQuota.category, category)))
      .limit(1)
      .then((rows) => rows[0]));

  const targetPeriodEnd = isAnonymous ? null : resolvePeriodEnd(now);

  const shouldReset = !current
    ? true
    : isAnonymous
      ? false
      : !current.periodEnd || current.periodEnd <= now;

  const used = limit === null ? (current?.used ?? 0) : shouldReset ? 0 : (current?.used ?? 0);
  const periodStart = shouldReset ? now : (current?.periodStart ?? now);

  return {
    tierInfo,
    limit,
    current,
    targetPeriodEnd,
    shouldReset,
    used,
    periodStart,
  };
}

export async function consumeUsage({
  userId,
  category,
  now = new Date(),
  isAnonymous = false,
}: {
  userId: string;
  category: UsageCategory;
  now?: Date;
  isAnonymous?: boolean;
}) {
  const state = await calculateUsageState({
    userId,
    category,
    now,
    isAnonymous,
  });
  const { tierInfo, limit } = state;

  if (limit === null) {
    return {
      tier: tierInfo.tier,
      limit: null,
      remaining: null,
      usedMaxMode: false,
    };
  }

  const isLimitReached = limit <= 0 || (!state.shouldReset && state.used >= limit);

  // If limit reached, check for Max Mode
  if (isLimitReached) {
    // If Max Mode is enabled, record usage and allow
    if (tierInfo.maxModeEnabled) {
      await recordMaxModeUsage(userId, category);

      // Also increment the regular usage counter
      const nextUsed = state.used + 1;
      await db
        .insert(usageQuota)
        .values({
          userId,
          category,
          planTier: tierInfo.tier,
          limitAmount: limit,
          used: nextUsed,
          periodStart: state.periodStart,
          periodEnd: state.targetPeriodEnd,
        })
        .onConflictDoUpdate({
          target: [usageQuota.userId, usageQuota.category],
          set: {
            planTier: tierInfo.tier,
            limitAmount: limit,
            used: nextUsed,
            periodStart: state.periodStart,
            periodEnd: state.targetPeriodEnd,
            updatedAt: new Date(),
          },
        });

      return {
        tier: tierInfo.tier,
        limit,
        remaining: 0,
        usedMaxMode: true,
      };
    }

    // If Max Mode is eligible but not enabled, throw error with flag
    throw new UsageLimitError(
      "Usage limit reached for your plan.",
      tierInfo.maxModeEligible,
    );
  }

  const nextUsed = state.used + 1;

  const [saved] = await db
    .insert(usageQuota)
    .values({
      userId,
      category,
      planTier: tierInfo.tier,
      limitAmount: limit,
      used: nextUsed,
      periodStart: state.periodStart,
      periodEnd: state.targetPeriodEnd,
    })
    .onConflictDoUpdate({
      target: [usageQuota.userId, usageQuota.category],
      set: {
        planTier: tierInfo.tier,
        limitAmount: limit,
        used: nextUsed,
        periodStart: state.periodStart,
        periodEnd: state.targetPeriodEnd,
        updatedAt: new Date(),
      },
    })
    .returning({ used: usageQuota.used });

  return {
    tier: tierInfo.tier,
    limit,
    remaining: Math.max(limit - saved.used, 0),
    usedMaxMode: false,
  };
}

export type UsageSnapshot = {
  category: UsageCategory;
  limit: number | null;
  used: number;
  remaining: number | null;
  periodStart: Date;
  periodEnd: Date | null;
};

export type UsageSummary = {
  tier: SubscriptionTier;
  planId: string | null;
  status: string | null;
  periodEnd: Date | null;
  usage: UsageSnapshot[];
  maxModeEnabled: boolean;
  maxModeEligible: boolean;
};

export async function getUsageSummary({
  userId,
  now = new Date(),
  isAnonymous = false,
}: {
  userId: string;
  now?: Date;
  isAnonymous?: boolean;
}): Promise<UsageSummary> {
  const nowDate = now;
  const tierInfo = await getTierInfo(userId, nowDate);

  const records = await db.select().from(usageQuota).where(eq(usageQuota.userId, userId));

  const usage = await Promise.all(
    USAGE_CATEGORIES.map(async (category) => {
      const state = await calculateUsageState({
        userId,
        category,
        now: nowDate,
        existingRecord: records.find((row) => row.category === category),
        isAnonymous,
      });

      if (state.limit === null) {
        return {
          category,
          limit: null,
          used: 0,
          remaining: null,
          periodStart: state.periodStart,
          periodEnd: state.targetPeriodEnd,
        };
      }

      return {
        category,
        limit: state.limit,
        used: state.used,
        remaining: Math.max(state.limit - state.used, 0),
        periodStart: state.periodStart,
        periodEnd: state.targetPeriodEnd,
      };
    }),
  );

  return {
    tier: tierInfo.tier,
    planId: tierInfo.planId,
    status: tierInfo.status,
    periodEnd: tierInfo.periodEnd,
    usage,
    maxModeEnabled: tierInfo.maxModeEnabled,
    maxModeEligible: tierInfo.maxModeEligible,
  };
}

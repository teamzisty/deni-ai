import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/db/drizzle";
import { billing, usageQuota } from "@/db/schema";

const ACTIVE_BILLING_STATUSES = new Set([
  "active",
  "trialing",
  "past_due",
  "incomplete",
  "unpaid",
  "paid",
]);

export type UsageCategory = "basic" | "premium";
export type SubscriptionTier = "free" | "pro" | "max";
type UsageRecord = typeof usageQuota.$inferSelect;

const USAGE_CATEGORIES: UsageCategory[] = ["basic", "premium"];

const USAGE_LIMITS: Record<
  UsageCategory,
  Record<SubscriptionTier, number | null>
> = {
  basic: {
    free: 1500,
    pro: 6000,
    max: null, // unlimited
  },
  premium: {
    free: 50,
    pro: 200,
    max: null, // unlimited
  },
};

export class UsageLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UsageLimitError";
  }
}

type TierInfo = {
  tier: SubscriptionTier;
  planId: string | null;
  status: string | null;
  periodEnd: Date | null;
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
    };
  }

  const planId = record.planId;
  const status = record.status;
  const hasActiveStatus =
    Boolean(planId) &&
    Boolean(status) &&
    ACTIVE_BILLING_STATUSES.has(status ?? "");
  const inGracePeriod =
    status === "canceled" &&
    record.currentPeriodEnd &&
    record.currentPeriodEnd > now;

  if (!hasActiveStatus && !inGracePeriod) {
    return {
      tier: "free",
      planId,
      status,
      periodEnd: getDefaultPeriodEnd(now),
    };
  }

  const isMax = (planId ?? "").startsWith("max");

  return {
    tier: isMax ? "max" : "pro",
    planId,
    status: status ?? null,
    periodEnd: record.currentPeriodEnd ?? null,
  };
}

function resolvePeriodEnd(
  tier: SubscriptionTier,
  billingPeriodEnd: Date | null,
  existingPeriodEnd: Date | null,
  now: Date,
) {
  const preferred = billingPeriodEnd ?? existingPeriodEnd;
  const validPreferred = preferred && preferred > now ? preferred : null;

  if (tier === "max") {
    return validPreferred;
  }

  return validPreferred ?? getDefaultPeriodEnd(now);
}

async function calculateUsageState({
  userId,
  category,
  now,
  existingRecord,
}: {
  userId: string;
  category: UsageCategory;
  now: Date;
  existingRecord?: UsageRecord;
}) {
  const tierInfo = await getTierInfo(userId, now);
  const limit = USAGE_LIMITS[category][tierInfo.tier];

  const current =
    existingRecord ??
    (await db
      .select()
      .from(usageQuota)
      .where(
        and(eq(usageQuota.userId, userId), eq(usageQuota.category, category)),
      )
      .limit(1)
      .then((rows) => rows[0]));

  const targetPeriodEnd = resolvePeriodEnd(
    tierInfo.tier,
    tierInfo.periodEnd,
    current?.periodEnd ?? null,
    now,
  );

  const shouldReset =
    !current ||
    current.planTier !== tierInfo.tier ||
    current.limitAmount !== limit ||
    (current.periodEnd && current.periodEnd <= now) ||
    (targetPeriodEnd &&
      (!current.periodEnd ||
        current.periodEnd.getTime() !== targetPeriodEnd.getTime()));

  const used =
    limit === null
      ? (current?.used ?? 0)
      : shouldReset
        ? 0
        : (current?.used ?? 0);
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
}: {
  userId: string;
  category: UsageCategory;
  now?: Date;
}) {
  const state = await calculateUsageState({ userId, category, now });
  const { tierInfo, limit } = state;

  if (limit === null) {
    return {
      tier: tierInfo.tier,
      limit: null,
      remaining: null,
    };
  }

  if (!state.shouldReset && state.used >= limit) {
    throw new UsageLimitError("Usage limit reached for your plan.");
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
};

export async function getUsageSummary({
  userId,
  now = new Date(),
}: {
  userId: string;
  now?: Date;
}): Promise<UsageSummary> {
  const nowDate = now;
  const tierInfo = await getTierInfo(userId, nowDate);

  const records = await db
    .select()
    .from(usageQuota)
    .where(eq(usageQuota.userId, userId));

  const usage = await Promise.all(
    USAGE_CATEGORIES.map(async (category) => {
      const state = await calculateUsageState({
        userId,
        category,
        now: nowDate,
        existingRecord: records.find((row) => row.category === category),
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
  };
}

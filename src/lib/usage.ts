import "server-only";

import { and, eq, isNotNull, isNull, like, sql } from "drizzle-orm";

import { db } from "@/db/drizzle";
import { billing, member, usageQuota } from "@/db/schema";
import { getPlanTier } from "@/lib/billing";

import { isMaxModeEligible, recordMaxModeUsage } from "./max-mode";

const ACTIVE_BILLING_STATUSES = new Set(["active", "trialing", "past_due", "paid"]);

export type UsageCategory = "basic" | "premium";
export type SubscriptionTier = "free" | "plus" | "pro" | "max";
type UsageRecord = typeof usageQuota.$inferSelect;

const USAGE_CATEGORIES: UsageCategory[] = ["basic", "premium"];

const USAGE_LIMITS: Record<UsageCategory, Record<SubscriptionTier, number | null>> = {
  basic: {
    free: 500,
    plus: 1500,
    pro: 3000,
    max: 10000,
  },
  premium: {
    free: 50,
    plus: 400,
    pro: 800,
    max: 2000,
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
  // 1. Check personal billing (where organizationId is NULL)
  const [record] = await db
    .select({
      planId: billing.planId,
      status: billing.status,
      currentPeriodEnd: billing.currentPeriodEnd,
      maxModeEnabled: billing.maxModeEnabled,
    })
    .from(billing)
    .where(and(eq(billing.userId, userId), isNull(billing.organizationId)))
    .limit(1);

  // 2. Check if user belongs to any org with an active team plan
  const teamRecords = await db
    .select({
      planId: billing.planId,
      status: billing.status,
      currentPeriodEnd: billing.currentPeriodEnd,
      maxModeEnabled: billing.maxModeEnabled,
    })
    .from(billing)
    .innerJoin(member, eq(billing.organizationId, member.organizationId))
    .where(
      and(
        eq(member.userId, userId),
        isNotNull(billing.organizationId),
        like(billing.planId, "pro_team%"),
      ),
    )
    .limit(1);

  const teamRecord = teamRecords[0];

  // 3. If user has an active team plan, check it first
  if (teamRecord) {
    const teamPlanId = teamRecord.planId;
    const teamStatus = teamRecord.status;
    const teamHasActive =
      Boolean(teamPlanId) && Boolean(teamStatus) && ACTIVE_BILLING_STATUSES.has(teamStatus ?? "");
    const teamGracePeriod =
      teamStatus === "canceled" && teamRecord.currentPeriodEnd && teamRecord.currentPeriodEnd > now;

    if (teamHasActive || teamGracePeriod) {
      const maxModeEligible = isMaxModeEligible(teamPlanId) && teamStatus === "active";
      return {
        tier: "pro",
        planId: teamPlanId,
        status: teamStatus ?? null,
        periodEnd: teamRecord.currentPeriodEnd ?? null,
        maxModeEnabled: maxModeEligible && teamRecord.maxModeEnabled,
        maxModeEligible,
      };
    }
  }

  // 4. Fall back to personal billing
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

  const planTier = getPlanTier(planId);
  const maxModeEligible = isMaxModeEligible(planId) && status === "active";

  return {
    tier:
      planTier === "max"
        ? "max"
        : planTier === "pro"
          ? "pro"
          : planTier === "team"
            ? "pro"
            : planTier === "plus"
              ? "plus"
              : "free",
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

function buildResetWindowCondition(now: Date, targetPeriodEnd: Date | null) {
  if (!targetPeriodEnd) {
    return null;
  }

  return sql`${usageQuota.periodEnd} IS NULL OR ${usageQuota.periodEnd} <= ${now}`;
}

async function upsertUsageRecord({
  userId,
  category,
  tier,
  limit,
  amount,
  periodStart,
  targetPeriodEnd,
  resetWindowCondition,
  allowOverflow,
}: {
  userId: string;
  category: UsageCategory;
  tier: SubscriptionTier;
  limit: number;
  amount: number;
  periodStart: Date;
  targetPeriodEnd: Date | null;
  resetWindowCondition: ReturnType<typeof buildResetWindowCondition>;
  allowOverflow: boolean;
}) {
  const usedExpression = resetWindowCondition
    ? sql`CASE
        WHEN ${resetWindowCondition} THEN ${amount}
        ELSE ${usageQuota.used} + ${amount}
      END`
    : sql`${usageQuota.used} + ${amount}`;

  const periodStartExpression = resetWindowCondition
    ? sql`CASE
        WHEN ${resetWindowCondition} THEN ${periodStart}
        ELSE ${usageQuota.periodStart}
      END`
    : usageQuota.periodStart;

  const periodEndExpression = resetWindowCondition
    ? sql`CASE
        WHEN ${resetWindowCondition} THEN ${targetPeriodEnd}
        ELSE ${usageQuota.periodEnd}
      END`
    : usageQuota.periodEnd;

  const remainingCondition = sql`${usageQuota.used} <= ${limit - amount}`;
  const setWhere = allowOverflow
    ? undefined
    : resetWindowCondition
      ? sql`${resetWindowCondition} OR ${remainingCondition}`
      : remainingCondition;

  const [saved] = await db
    .insert(usageQuota)
    .values({
      userId,
      category,
      planTier: tier,
      limitAmount: limit,
      used: amount,
      periodStart,
      periodEnd: targetPeriodEnd,
    })
    .onConflictDoUpdate({
      target: [usageQuota.userId, usageQuota.category],
      set: {
        planTier: tier,
        limitAmount: limit,
        used: usedExpression,
        periodStart: periodStartExpression,
        periodEnd: periodEndExpression,
        updatedAt: new Date(),
      },
      ...(setWhere ? { setWhere } : {}),
    })
    .returning({ used: usageQuota.used });

  return saved ?? null;
}

export async function consumeUsage({
  userId,
  category,
  now = new Date(),
  isAnonymous = false,
  amount = 1,
}: {
  userId: string;
  category: UsageCategory;
  now?: Date;
  isAnonymous?: boolean;
  amount?: number;
}) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("Usage amount must be a positive integer.");
  }

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

  const resetWindowCondition = buildResetWindowCondition(now, state.targetPeriodEnd);
  const isLimitReached = limit <= 0 || state.used + amount > limit;

  if (isLimitReached) {
    if (tierInfo.maxModeEnabled) {
      await recordMaxModeUsage(userId, category, amount);

      await upsertUsageRecord({
        userId,
        category,
        tier: tierInfo.tier,
        limit,
        amount,
        periodStart: state.periodStart,
        targetPeriodEnd: state.targetPeriodEnd,
        resetWindowCondition,
        allowOverflow: true,
      });

      return {
        tier: tierInfo.tier,
        limit,
        remaining: 0,
        usedMaxMode: true,
      };
    }

    // If Max Mode is eligible but not enabled, throw error with flag
    throw new UsageLimitError("Usage limit reached for your plan.", tierInfo.maxModeEligible);
  }

  const saved = await upsertUsageRecord({
    userId,
    category,
    tier: tierInfo.tier,
    limit,
    amount,
    periodStart: state.periodStart,
    targetPeriodEnd: state.targetPeriodEnd,
    resetWindowCondition,
    allowOverflow: false,
  });

  if (!saved) {
    throw new UsageLimitError("Usage limit reached for your plan.", tierInfo.maxModeEligible);
  }

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

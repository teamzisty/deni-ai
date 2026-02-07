import "server-only";

import { and, eq, isNull, sql } from "drizzle-orm";

import { db } from "@/db/drizzle";
import { billing } from "@/db/schema";
import { stripe } from "@/lib/stripe";

import type { UsageCategory } from "./usage";

// Max Mode pricing per message (in cents for Stripe)
export const MAX_MODE_PRICING = {
  basic: 1, // $0.01 per basic message
  premium: 5, // $0.05 per premium message
} as const;

// Max Mode is only available for Pro plan users
export function isMaxModeEligible(planId: string | null | undefined): boolean {
  return Boolean(planId?.startsWith("pro"));
}

export type MaxModeStatus = {
  eligible: boolean;
  enabled: boolean;
  usageBasic: number;
  usagePremium: number;
  periodStart: Date | null;
  estimatedCost: number; // in cents
};

export async function getMaxModeStatus(userId: string): Promise<MaxModeStatus> {
  const [record] = await db
    .select({
      planId: billing.planId,
      status: billing.status,
      maxModeEnabled: billing.maxModeEnabled,
      maxModeUsageBasic: billing.maxModeUsageBasic,
      maxModeUsagePremium: billing.maxModeUsagePremium,
      maxModePeriodStart: billing.maxModePeriodStart,
    })
    .from(billing)
    .where(and(eq(billing.userId, userId), isNull(billing.organizationId)))
    .limit(1);

  if (!record) {
    return {
      eligible: false,
      enabled: false,
      usageBasic: 0,
      usagePremium: 0,
      periodStart: null,
      estimatedCost: 0,
    };
  }

  const eligible = isMaxModeEligible(record.planId) && record.status === "active";
  const estimatedCost =
    record.maxModeUsageBasic * MAX_MODE_PRICING.basic +
    record.maxModeUsagePremium * MAX_MODE_PRICING.premium;

  return {
    eligible,
    enabled: eligible && record.maxModeEnabled,
    usageBasic: record.maxModeUsageBasic,
    usagePremium: record.maxModeUsagePremium,
    periodStart: record.maxModePeriodStart,
    estimatedCost,
  };
}

export async function enableMaxMode(userId: string): Promise<{ success: boolean; error?: string }> {
  const [record] = await db
    .select({
      planId: billing.planId,
      status: billing.status,
      stripeCustomerId: billing.stripeCustomerId,
      stripeSubscriptionId: billing.stripeSubscriptionId,
      maxModeEnabled: billing.maxModeEnabled,
    })
    .from(billing)
    .where(and(eq(billing.userId, userId), isNull(billing.organizationId)))
    .limit(1);

  if (!record) {
    return { success: false, error: "No billing record found." };
  }

  if (!isMaxModeEligible(record.planId)) {
    return { success: false, error: "Max Mode is only available for Pro plan users." };
  }

  if (record.status !== "active") {
    return { success: false, error: "You need an active subscription to enable Max Mode." };
  }

  if (record.maxModeEnabled) {
    return { success: true }; // Already enabled
  }

  // Enable Max Mode
  await db
    .update(billing)
    .set({
      maxModeEnabled: true,
      maxModePeriodStart: new Date(),
      maxModeUsageBasic: 0,
      maxModeUsagePremium: 0,
    })
    .where(and(eq(billing.userId, userId), isNull(billing.organizationId)));

  return { success: true };
}

export async function disableMaxMode(
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  const [record] = await db
    .select({
      maxModeEnabled: billing.maxModeEnabled,
    })
    .from(billing)
    .where(and(eq(billing.userId, userId), isNull(billing.organizationId)))
    .limit(1);

  if (!record) {
    return { success: false, error: "No billing record found." };
  }

  if (!record.maxModeEnabled) {
    return { success: true }; // Already disabled
  }

  await db
    .update(billing)
    .set({
      maxModeEnabled: false,
    })
    .where(and(eq(billing.userId, userId), isNull(billing.organizationId)));

  return { success: true };
}

export async function recordMaxModeUsage(
  userId: string,
  category: UsageCategory,
): Promise<{ success: boolean; newUsage: number }> {
  const field = category === "basic" ? "maxModeUsageBasic" : "maxModeUsagePremium";

  const [record] = await db
    .select({
      maxModeUsageBasic: billing.maxModeUsageBasic,
      maxModeUsagePremium: billing.maxModeUsagePremium,
      stripeCustomerId: billing.stripeCustomerId,
    })
    .from(billing)
    .where(and(eq(billing.userId, userId), isNull(billing.organizationId)))
    .limit(1);

  if (!record) {
    return { success: false, newUsage: 0 };
  }

  const column = category === "basic" ? billing.maxModeUsageBasic : billing.maxModeUsagePremium;

  const [updated] = await db
    .update(billing)
    .set({
      [field]: sql`${column} + 1`,
    })
    .where(and(eq(billing.userId, userId), isNull(billing.organizationId)))
    .returning({
      maxModeUsageBasic: billing.maxModeUsageBasic,
      maxModeUsagePremium: billing.maxModeUsagePremium,
    });

  const newUsage = category === "basic" ? updated.maxModeUsageBasic : updated.maxModeUsagePremium;

  // Report usage to Stripe for metered billing
  try {
    await stripe.billing.meterEvents.create({
      event_name: `max_mode_${category}`,
      payload: {
        stripe_customer_id: record.stripeCustomerId,
        value: "1",
      },
    });
  } catch (error) {
    // Log but don't fail - we've already recorded locally
    console.error("Failed to report usage to Stripe:", error);
  }

  return { success: true, newUsage };
}

export async function resetMaxModeUsage(userId: string): Promise<void> {
  await db
    .update(billing)
    .set({
      maxModeUsageBasic: 0,
      maxModeUsagePremium: 0,
      maxModePeriodStart: new Date(),
    })
    .where(and(eq(billing.userId, userId), isNull(billing.organizationId)));
}

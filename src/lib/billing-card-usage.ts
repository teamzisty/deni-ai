import "server-only";

import { eq, sql } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { billing } from "@/db/schema";
import { stripe } from "@/lib/stripe";

export const MAX_TRIALS_PER_CARD = 2;

export async function getCustomerPrimaryCardFingerprint(customerId: string) {
  try {
    const paymentMethods = await stripe.customers.listPaymentMethods(customerId, {
      type: "card",
      limit: 1,
    });

    return paymentMethods.data[0]?.card?.fingerprint ?? null;
  } catch (error) {
    console.warn("Failed to load customer payment method fingerprint", error);
    return null;
  }
}

export async function countTrialUsesByFingerprint(fingerprint: string) {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(billing)
    .where(eq(billing.trialPaymentMethodFingerprint, fingerprint));

  return result?.count ?? 0;
}

export async function isTrialFingerprintEligible(fingerprint: string | null) {
  if (!fingerprint) {
    return true;
  }

  const count = await countTrialUsesByFingerprint(fingerprint);
  return count < MAX_TRIALS_PER_CARD;
}

export async function getBillingFingerprintUpdates({
  customerId,
  markTrialUsed,
}: {
  customerId: string;
  markTrialUsed: boolean;
}) {
  const fingerprint = await getCustomerPrimaryCardFingerprint(customerId);

  return {
    paymentMethodFingerprint: fingerprint,
    trialPaymentMethodFingerprint: markTrialUsed && fingerprint ? fingerprint : undefined,
    trialUsedAt: markTrialUsed && fingerprint ? new Date() : undefined,
  };
}

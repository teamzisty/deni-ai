import "server-only";

import { eq, sql } from "drizzle-orm";
import type Stripe from "stripe";
import { db } from "@/db/drizzle";
import { billing } from "@/db/schema";
import { stripe } from "@/lib/stripe";

export const MAX_TRIALS_PER_CARD = 2;

const ACTIVE_SUBSCRIPTION_STATUSES = new Set([
  "trialing",
  "active",
  "past_due",
  "incomplete",
  "unpaid",
]);

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getCardFingerprintFromPaymentMethod(
  paymentMethod: string | Stripe.PaymentMethod | null | undefined,
) {
  if (!paymentMethod || typeof paymentMethod === "string" || paymentMethod.type !== "card") {
    return null;
  }

  return paymentMethod.card?.fingerprint ?? null;
}

function getCardFingerprintFromSubscription(subscription: Stripe.Subscription | null | undefined) {
  if (!subscription) {
    return null;
  }

  const defaultPaymentMethodFingerprint = getCardFingerprintFromPaymentMethod(
    subscription.default_payment_method,
  );
  if (defaultPaymentMethodFingerprint) {
    return defaultPaymentMethodFingerprint;
  }

  const latestInvoice = subscription.latest_invoice;
  if (!latestInvoice || typeof latestInvoice === "string") {
    return null;
  }

  const paymentIntent =
    "payment_intent" in latestInvoice ? (latestInvoice.payment_intent ?? null) : null;
  if (!paymentIntent || typeof paymentIntent === "string" || !isObjectRecord(paymentIntent)) {
    return null;
  }

  const paymentMethod =
    "payment_method" in paymentIntent ? (paymentIntent.payment_method ?? null) : null;
  if (
    paymentMethod != null &&
    typeof paymentMethod !== "string" &&
    !isObjectRecord(paymentMethod)
  ) {
    return null;
  }

  return getCardFingerprintFromPaymentMethod(paymentMethod as string | Stripe.PaymentMethod | null);
}

export async function getCustomerPrimaryCardFingerprint(
  customerId: string,
  subscriptionId?: string | null,
) {
  try {
    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ["default_payment_method", "latest_invoice.payment_intent.payment_method"],
      });
      const subscriptionFingerprint = getCardFingerprintFromSubscription(subscription);
      if (subscriptionFingerprint) {
        return subscriptionFingerprint;
      }
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 10,
      expand: ["data.default_payment_method", "data.latest_invoice.payment_intent.payment_method"],
    });
    const preferredSubscription =
      subscriptions.data.find((subscription) =>
        ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status),
      ) ?? subscriptions.data.at(0);
    const subscriptionFingerprint = getCardFingerprintFromSubscription(preferredSubscription);
    if (subscriptionFingerprint) {
      return subscriptionFingerprint;
    }

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

export async function isTrialFingerprintEligible(
  fingerprint: string | null,
  context?: {
    customerId?: string;
    userId?: string;
    organizationId?: string | null;
  },
) {
  if (!fingerprint) {
    console.warn("[billing] Missing card fingerprint for trial eligibility check", context);
    return false;
  }

  const count = await countTrialUsesByFingerprint(fingerprint);
  return count < MAX_TRIALS_PER_CARD;
}

export async function getBillingFingerprintUpdates({
  customerId,
  subscriptionId,
  markTrialUsed,
}: {
  customerId: string;
  subscriptionId?: string | null;
  markTrialUsed: boolean;
}) {
  const fingerprint = await getCustomerPrimaryCardFingerprint(customerId, subscriptionId);

  return {
    paymentMethodFingerprint: fingerprint,
    trialPaymentMethodFingerprint: markTrialUsed && fingerprint ? fingerprint : undefined,
    trialUsedAt: markTrialUsed && fingerprint ? new Date() : undefined,
  };
}

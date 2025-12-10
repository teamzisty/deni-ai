import type Stripe from "stripe";

type SubscriptionLike =
  | Stripe.Subscription
  | Stripe.Response<Stripe.Subscription>
  | null
  | undefined;

function extractCurrentPeriodEnd(subscription: SubscriptionLike) {
  const periodEnd =
    (subscription as { current_period_end?: number | null } | null | undefined)
      ?.current_period_end;

  return typeof periodEnd === "number" ? periodEnd : null;
}

export function getSubscriptionPeriodEnd(
  subscription: SubscriptionLike,
): number | null {
  return extractCurrentPeriodEnd(subscription);
}

export function getSubscriptionPeriodEndDate(
  subscription: SubscriptionLike,
): Date | null {
  const periodEnd = extractCurrentPeriodEnd(subscription);

  return periodEnd ? new Date(periodEnd * 1000) : null;
}

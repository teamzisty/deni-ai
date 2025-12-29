import type Stripe from "stripe";

type SubscriptionLike =
  | Stripe.Subscription
  | Stripe.Response<Stripe.Subscription>
  | null
  | undefined;

export function getSubscriptionPeriodEnd(
  subscription: SubscriptionLike,
): number | null {
  const item = subscription?.items.data[0];

  return item?.current_period_end || null;
}

export function getSubscriptionPeriodEndDate(
  subscription: SubscriptionLike,
): Date | null {
  const periodEnd = getSubscriptionPeriodEnd(subscription);

  return periodEnd ? new Date(Math.floor(periodEnd * 1000)) : null;
}

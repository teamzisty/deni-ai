import type Stripe from "stripe";

type SubscriptionLike =
  | Stripe.Subscription
  | Stripe.Response<Stripe.Subscription>
  | null
  | undefined;

export function getSubscriptionPeriodEnd(
  subscription: SubscriptionLike,
): number | null {
  console.log(subscription);
  const item = subscription?.items.data[0];

  console.log(item?.current_period_end);

  return item?.current_period_end || null;
}

export function getSubscriptionPeriodEndDate(
  subscription: SubscriptionLike,
): Date | null {
  const periodEnd = getSubscriptionPeriodEnd(subscription);

  console.log(periodEnd ? new Date(Math.floor(periodEnd * 1000)) : null);

  return periodEnd ? new Date(Math.floor(periodEnd * 1000)) : null;
}

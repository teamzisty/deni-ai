import "server-only";

import { stripe } from "@/lib/stripe";

export async function isTrialEligibleForCustomer(customerId: string) {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 1,
  });

  return subscriptions.data.length === 0;
}

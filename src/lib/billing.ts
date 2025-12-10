import { env } from "@/env";

export type BillingPlanId =
  | "pro-monthly"
  | "pro-quarterly"
  | "pro-yearly"
  | "max-yearly"
  | "max-lifetime";

export type BillingPlan = {
  id: BillingPlanId;
  name: string;
  tagline: string;
  priceId: string;
  mode: "subscription" | "payment";
  highlights: string[];
  badge?: string;
};

export type ClientPlan = {
  id: BillingPlanId;
  name: string;
  tagline: string;
  highlights: string[];
  badge?: string;
  mode: "subscription" | "payment";
  priceId: string;
  amount: number | null;
  currency: string | null;
  interval: string | null;
  intervalCount: number;
};

export const billingPlans: BillingPlan[] = [
  {
    id: "pro-monthly",
    name: "Monthly",
    tagline: "Get 4x usage for all models",
    priceId: env.STRIPE_PRICE_PRO_MONTHLY,
    mode: "subscription",
    highlights: [
      "Get 4x usage for all models",
      "Usage-based billing (soon)",
      "For trying Deni AI",
    ],
  },
  {
    id: "pro-quarterly",
    name: "Quarterly",
    tagline: "Slightly cheaper Pro plan",
    priceId: env.STRIPE_PRICE_PRO_QUARTERLY,
    mode: "subscription",
    highlights: [
      "Get 4x usage for all models",
      "Usage-based billing (soon)",
      "Cheaper than monthly",
    ],
    badge: "Recommended",
  },
  {
    id: "pro-yearly",
    name: "Yearly",
    tagline: "Pro with 2 months free",
    priceId: env.STRIPE_PRICE_PRO_YEARLY,
    mode: "subscription",
    highlights: [
      "Get 4x usage for all models",
      "Usage-based billing (soon)",
      "2 months free",
    ],
  },
  {
    id: "max-yearly",
    name: "Yearly",
    tagline: "Get unlimited usage",
    priceId: env.STRIPE_PRICE_MAX_YEARLY,
    mode: "subscription",
    highlights: [
      "Get unlimited usage for all models",
      "Most priority support",
      "For power users",
    ],
  },
  {
    id: "max-lifetime",
    name: "Lifetime",
    tagline: "Get unlimited usage forever",
    priceId: env.STRIPE_PRICE_MAX_LIFETIME, // fuck codex
    mode: "payment",
    highlights: [
      "Get unlimited usage for all models",
      "Most priority support",
      "The best plan",
    ],
  },
];

export const priceIdToPlan = new Map<string, BillingPlanId>(
  billingPlans.map((plan) => [plan.priceId, plan.id]),
);

export function findPlanById(planId: BillingPlanId | string) {
  return billingPlans.find((plan) => plan.id === planId);
}

export function findPlanByPriceId(priceId: string | null | undefined) {
  if (!priceId) {
    return undefined;
  }
  return billingPlans.find((plan) => plan.priceId === priceId);
}

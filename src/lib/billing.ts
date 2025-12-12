export type BillingPlanId =
  | "pro_monthly"
  | "pro_yearly"
  | "max_monthly"
  | "max_yearly";

export type BillingPlan = {
  id: BillingPlanId;
  lookupKey: string;
  name: string;
  tagline: string;
  highlights: string[];
  badge?: string;
};

export type ClientPlan = {
  id: BillingPlanId;
  lookupKey: string;
  name: string;
  tagline: string;
  highlights: string[];
  badge?: string;
  priceId: string | null;
  mode: "subscription" | "payment" | null;
  amount: number | null;
  currency: string | null;
  interval: string | null;
  intervalCount: number;
};

export const billingPlans: BillingPlan[] = [
  {
    id: "pro_monthly",
    lookupKey: "pro_monthly",
    name: "Monthly",
    tagline: "Get unbelievable usage limits",
    highlights: [
      "Get 4x usage for basic models",
      "Get 10x usage for premium models",
      "For trying Deni AI",
    ],
  },
  {
    id: "pro_yearly",
    lookupKey: "pro_yearly",
    name: "Yearly",
    tagline: "Incredible deal",
    highlights: [
      "Get 4x usage for basic models",
      "Get 10x usage for premium models",
      "Most cost-effective",
    ],
  },
  {
    id: "max_monthly",
    lookupKey: "max_monthly",
    name: "Monthly",
    tagline: "Great deals even for power users",
    highlights: [
      "Get 10x usage for basic model",
      "Get 20x usage for premium models",
      "Free Max forever if you use all limits",
      "For power users",
    ],
  },
  {
    id: "max_yearly",
    lookupKey: "max_yearly",
    name: "Yearly",
    tagline: "Get unlimited usage",
    highlights: [
      "Get 10x usage for basic model",
      "Get 20x usage for premium models",
      "Free Max forever if you use all limits",
      "For power users",
    ],
  },
];

export const lookupKeyToPlan = new Map<string, BillingPlanId>(
  billingPlans.map((plan) => [plan.lookupKey, plan.id]),
);

export function findPlanById(planId: BillingPlanId | string) {
  return billingPlans.find((plan) => plan.id === planId);
}

export function findPlanByLookupKey(lookupKey: string | null | undefined) {
  if (!lookupKey) {
    return undefined;
  }
  return billingPlans.find((plan) => plan.lookupKey === lookupKey);
}

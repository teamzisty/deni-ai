export type BillingPlanId =
  | "pro_monthly"
  | "pro_yearly"
  | "max_monthly"
  | "max_yearly";

export type BillingPlan = {
  id: BillingPlanId;
  lookupKey: string;
};

export type ClientPlan = {
  id: BillingPlanId;
  lookupKey: string;
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
  },
  {
    id: "pro_yearly",
    lookupKey: "pro_yearly",
  },
  {
    id: "max_monthly",
    lookupKey: "max_monthly",
  },
  {
    id: "max_yearly",
    lookupKey: "max_yearly",
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

export type IndividualPlanId =
  | "plus_monthly"
  | "plus_yearly"
  | "pro_monthly"
  | "pro_yearly";

export type TeamPlanId = "pro_team_monthly" | "pro_team_yearly";

export type BillingPlanId = IndividualPlanId | TeamPlanId;

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
  isTeamPlan: boolean;
};

export const billingPlans: BillingPlan[] = [
  {
    id: "plus_monthly",
    lookupKey: "plus_monthly",
  },
  {
    id: "plus_yearly",
    lookupKey: "plus_yearly",
  },
  {
    id: "pro_monthly",
    lookupKey: "pro_monthly",
  },
  {
    id: "pro_yearly",
    lookupKey: "pro_yearly",
  },
  {
    id: "pro_team_monthly",
    lookupKey: "pro_team_monthly",
  },
  {
    id: "pro_team_yearly",
    lookupKey: "pro_team_yearly",
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

export function isTeamPlan(planId: string | null | undefined): boolean {
  return Boolean(planId?.startsWith("pro_team"));
}

export function isProTier(planId: string | null | undefined): boolean {
  return Boolean(planId?.startsWith("pro"));
}

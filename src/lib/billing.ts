export type IndividualPlanId =
  | "plus_monthly"
  | "plus_yearly"
  | "pro_monthly"
  | "pro_yearly"
  | "max_monthly"
  | "max_yearly"
  | "pro_lifetime";

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
  originalAmount?: number | null;
  currency: string | null;
  interval: string | null;
  intervalCount: number;
  isTeamPlan: boolean;
  trialDays?: number | null;
  limitedTimeOfferEndsAt?: string | null;
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
    id: "max_monthly",
    lookupKey: "max_monthly",
  },
  {
    id: "max_yearly",
    lookupKey: "max_yearly",
  },
  {
    id: "pro_lifetime",
    lookupKey: "pro_lifetime",
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

const teamPlanIds = new Set<TeamPlanId>(["pro_team_monthly", "pro_team_yearly"]);

export function findPlanById(planId: BillingPlanId | string) {
  return billingPlans.find((plan) => plan.id === planId);
}

export function findPlanByLookupKey(lookupKey: string | null | undefined) {
  if (!lookupKey) {
    return undefined;
  }
  return billingPlans.find((plan) => plan.lookupKey === lookupKey);
}

export function isTeamPlanId(planId: string | null | undefined): planId is TeamPlanId {
  return planId != null && teamPlanIds.has(planId as TeamPlanId);
}

export function isTeamPlan(planId: string | null | undefined): boolean {
  return Boolean(planId?.startsWith("pro_team"));
}

export function getPlanTier(
  planId: string | null | undefined,
): "plus" | "pro" | "max" | "team" | null {
  if (!planId) {
    return null;
  }

  if (planId.startsWith("pro_team")) {
    return "team";
  }

  if (planId.startsWith("max_")) {
    return "max";
  }

  if (planId.startsWith("pro_")) {
    return "pro";
  }

  if (planId.startsWith("plus_")) {
    return "plus";
  }

  return null;
}

export function isProTier(planId: string | null | undefined): boolean {
  const tier = getPlanTier(planId);
  return tier === "pro" || tier === "max" || tier === "team";
}

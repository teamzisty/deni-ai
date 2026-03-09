import type { BillingPlanId } from "@/lib/billing";

type TranslateFn = (key: string, values?: Record<string, string | number | Date>) => string;

export type BillingPlanCopy = {
  tagline: string;
  highlights: string[];
  badge?: string;
};

export function getBillingPlanCopy(t: TranslateFn, planId: BillingPlanId): BillingPlanCopy {
  switch (planId) {
    case "plus_monthly":
      return {
        tagline: t("Get unbelievable usage limits"),
        highlights: [
          t("Get 4x usage for basic models"),
          t("Get 10x usage for premium models"),
          t("With priority support"),
          t("Deni AI Code - Plus access"),
          t("For trying Deni AI"),
        ],
      };
    case "plus_yearly":
      return {
        tagline: t("Incredible deal"),
        highlights: [
          t("Get 4x usage for basic models"),
          t("Get 10x usage for premium models"),
          t("With priority support"),
          t("Deni AI Code - Plus access"),
          t("Most cost-effective"),
        ],
      };
    case "pro_monthly":
      return {
        tagline: t("Great deals even for power users"),
        highlights: [
          t("Get 10x usage for basic models"),
          t("Get 20x usage for premium models"),
          t("Max Mode pay-per-use available"),
          t("Deni AI Code - Pro access"),
          t("For power users"),
        ],
      };
    case "pro_yearly":
      return {
        tagline: t("You like us, and we like you too!"),
        highlights: [
          t("Get 10x usage for basic models"),
          t("Get 20x usage for premium models"),
          t("Max Mode pay-per-use available"),
          t("Deni AI Code - Pro access"),
          t("For power users"),
        ],
      };
    case "pro_team_monthly":
      return {
        tagline: t("Give your whole team Pro-tier access with per-seat pricing."),
        highlights: [
          t("Pro benefits for every team member"),
          t("Get 10x usage for basic models"),
          t("Get 20x usage for premium models"),
          t("Max Mode pay-per-use available"),
          t("Per-seat billing — pay only for active members"),
          t("Centralized billing and member management"),
        ],
      };
    case "pro_team_yearly":
      return {
        tagline: t("Give your whole team Pro-tier access with per-seat pricing."),
        badge: t("Most cost-effective"),
        highlights: [
          t("Pro benefits for every team member"),
          t("Get 10x usage for basic models"),
          t("Get 20x usage for premium models"),
          t("Max Mode pay-per-use available"),
          t("Per-seat billing — pay only for active members"),
          t("Centralized billing and member management"),
        ],
      };
    default:
      return {
        tagline: "",
        highlights: [],
      };
  }
}

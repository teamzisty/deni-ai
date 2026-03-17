"use client";

import { useExtracted } from "next-intl";

import type { BillingPlanId } from "@/lib/billing";

export type BillingPlanCopy = {
  tagline: string;
  highlights: string[];
  badge?: string;
};

export function useBillingPlanCopy(planId: BillingPlanId): BillingPlanCopy;
export function useBillingPlanCopy(planId: null): null;
export function useBillingPlanCopy(
  planId: BillingPlanId | null,
): BillingPlanCopy | null;
export function useBillingPlanCopy(
  planId: BillingPlanId | null,
): BillingPlanCopy | null {
  const t = useExtracted();

  if (!planId) {
    return null;
  }

  switch (planId) {
    case "plus_monthly":
      return {
        tagline: t("Get unbelievable usage limits"),
        highlights: [
          t("Get 3x usage for basic models"),
          t("Get 8x usage for premium models"),
          t("With priority support"),
          t("Deni AI Flixa - Plus access"),
          t("For trying Deni AI"),
        ],
      };
    case "plus_yearly":
      return {
        tagline: t("Incredible deal"),
        highlights: [
          t("Get 3x usage for basic models"),
          t("Get 8x usage for premium models"),
          t("With priority support"),
          t("Deni AI Flixa - Plus access"),
          t("Most cost-effective"),
        ],
      };
    case "pro_monthly":
      return {
        tagline: t("Great deals even for power users"),
        highlights: [
          t("Get 6x usage for basic models"),
          t("Get 16x usage for premium models"),
          t("Max Mode pay-per-use available"),
          t("Deni AI Flixa - Pro access"),
          t("For power users"),
        ],
      };
    case "pro_yearly":
      return {
        tagline: t("You like us, and we like you too!"),
        highlights: [
          t("Get 6x usage for basic models"),
          t("Get 16x usage for premium models"),
          t("Max Mode pay-per-use available"),
          t("Deni AI Flixa - Pro access"),
          t("For power users"),
        ],
      };
    case "max_monthly":
      return {
        tagline: t("Get unbelievable usage limits"),
        highlights: [
          t("Get 20x usage for basic models"),
          t("Get 40x usage for premium models"),
          t("Max Mode pay-per-use available"),
          t("Deni AI Flixa - Max access"),
          t("For power users"),
        ],
      };
    case "max_yearly":
      return {
        tagline: t("Incredible deal"),
        badge: t("Most cost-effective"),
        highlights: [
          t("Get 20x usage for basic models"),
          t("Get 40x usage for premium models"),
          t("Max Mode pay-per-use available"),
          t("Deni AI Flixa - Max access"),
          t("For power users"),
        ],
      };
    case "pro_lifetime":
      return {
        tagline: t("One payment. Long-term Pro access."),
        badge: t("Buy once"),
        highlights: [
          t("Get 6x usage for basic models"),
          t("Get 16x usage for premium models"),
          t("Max Mode pay-per-use available"),
          t("Deni AI Flixa - Pro access"),
          t("No recurring subscription"),
        ],
      };
    case "pro_team_monthly":
      return {
        tagline: t(
          "Give your whole team Pro-tier access with per-seat pricing.",
        ),
        highlights: [
          t("Pro benefits for every team member"),
          t("Get 6x usage for basic models"),
          t("Get 16x usage for premium models"),
          t("Max Mode pay-per-use available"),
          t("Per-seat billing — pay only for active members"),
          t("Centralized billing and member management"),
        ],
      };
    case "pro_team_yearly":
      return {
        tagline: t(
          "Give your whole team Pro-tier access with per-seat pricing.",
        ),
        badge: t("Most cost-effective"),
        highlights: [
          t("Pro benefits for every team member"),
          t("Get 6x usage for basic models"),
          t("Get 16x usage for premium models"),
          t("Max Mode pay-per-use available"),
          t("Per-seat billing — pay only for active members"),
          t("Centralized billing and member management"),
        ],
      };
    default:
      return null;
  }
}

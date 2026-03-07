"use client";

import { useSearchParams } from "next/navigation";
import { StripeCheckoutPage } from "@/components/billing/stripe-checkout-page";
import type { IndividualPlanId } from "@/lib/billing";

export default function BillingCheckoutSettingsPage() {
  const searchParams = useSearchParams();
  const planId = searchParams.get("planId") as IndividualPlanId | null;
  const sessionId = searchParams.get("session_id");

  return <StripeCheckoutPage scope="billing" planId={planId} sessionId={sessionId} />;
}

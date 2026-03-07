"use client";

import { useSearchParams } from "next/navigation";
import { StripeCheckoutPage } from "@/components/billing/stripe-checkout-page";
import type { TeamPlanId } from "@/lib/billing";

export default function TeamCheckoutSettingsPage() {
  const searchParams = useSearchParams();
  const organizationId = searchParams.get("organizationId");
  const planId = searchParams.get("planId") as TeamPlanId | null;
  const sessionId = searchParams.get("session_id");

  return (
    <StripeCheckoutPage
      scope="team"
      organizationId={organizationId}
      planId={planId}
      sessionId={sessionId}
    />
  );
}

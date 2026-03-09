"use client";

import { useParams, useSearchParams } from "next/navigation";
import { StripeCheckoutPage } from "@/components/billing/stripe-checkout-page";
import type { TeamPlanId } from "@/lib/billing";

export default function TeamCheckoutSessionPage() {
  const params = useParams<{ sessionId: string }>();
  const searchParams = useSearchParams();
  const organizationId = searchParams.get("organizationId");
  const planId = searchParams.get("planId") as TeamPlanId | null;
  const sessionId = typeof params.sessionId === "string" ? params.sessionId : null;

  return (
    <StripeCheckoutPage
      scope="team"
      organizationId={organizationId}
      planId={planId}
      sessionId={sessionId}
    />
  );
}

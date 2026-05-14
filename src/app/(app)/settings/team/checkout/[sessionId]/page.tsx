"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { StripeCheckoutPage } from "@/components/billing/stripe-checkout-page";
import { isTeamPlanId } from "@/lib/billing";

function TeamCheckoutSessionContent() {
  const params = useParams<{ sessionId: string }>();
  const { get } = useSearchParams();
  const organizationId = get("organizationId");
  const rawPlanId = get("planId");
  const planId = isTeamPlanId(rawPlanId) ? rawPlanId : null;
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

export default function TeamCheckoutSessionPage() {
  return (
    <Suspense fallback={null}>
      <TeamCheckoutSessionContent />
    </Suspense>
  );
}

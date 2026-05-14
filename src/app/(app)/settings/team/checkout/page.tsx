"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { StripeCheckoutPage } from "@/components/billing/stripe-checkout-page";
import { isTeamPlanId } from "@/lib/billing";

function TeamCheckoutSettingsContent() {
  const searchParams = useSearchParams();
  const organizationId = searchParams.get("organizationId");
  const rawPlanId = searchParams.get("planId");
  const planId = isTeamPlanId(rawPlanId) ? rawPlanId : null;
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

export default function TeamCheckoutSettingsPage() {
  return (
    <Suspense fallback={null}>
      <TeamCheckoutSettingsContent />
    </Suspense>
  );
}

"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { StripeCheckoutPage } from "@/components/billing/stripe-checkout-page";
import type { TeamPlanId } from "@/lib/billing";

function TeamCheckoutSettingsContent() {
  const { get } = useSearchParams();
  const organizationId = get("organizationId");
  const planId = get("planId") as TeamPlanId | null;
  const sessionId = get("session_id");

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

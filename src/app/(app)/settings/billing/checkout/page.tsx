"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { StripeCheckoutPage } from "@/components/billing/stripe-checkout-page";
import type { IndividualPlanId } from "@/lib/billing";

function BillingCheckoutSettingsContent() {
  const searchParams = useSearchParams();
  const planId = searchParams.get("planId") as IndividualPlanId | null;
  const sessionId = searchParams.get("session_id");

  return <StripeCheckoutPage scope="billing" planId={planId} sessionId={sessionId} />;
}

export default function BillingCheckoutSettingsPage() {
  return (
    <Suspense fallback={null}>
      <BillingCheckoutSettingsContent />
    </Suspense>
  );
}

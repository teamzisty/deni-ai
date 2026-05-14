"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { StripeCheckoutPage } from "@/components/billing/stripe-checkout-page";
import type { IndividualPlanId } from "@/lib/billing";

function BillingCheckoutSessionContent() {
  const params = useParams<{ sessionId: string }>();
  const searchParams = useSearchParams();
  const planId = searchParams.get("planId") as IndividualPlanId | null;
  const sessionId = typeof params.sessionId === "string" ? params.sessionId : null;

  return <StripeCheckoutPage scope="billing" planId={planId} sessionId={sessionId} />;
}

export default function BillingCheckoutSessionPage() {
  return (
    <Suspense fallback={null}>
      <BillingCheckoutSessionContent />
    </Suspense>
  );
}

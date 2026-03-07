"use client";

import {
  CheckoutProvider,
  CurrencySelectorElement,
  PaymentElement,
  useCheckout,
} from "@stripe/react-stripe-js/checkout";
import type { StripeCheckoutValue } from "@stripe/react-stripe-js/checkout";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useExtracted, useLocale } from "next-intl";
import { startTransition, useEffect, useMemo, useState } from "react";
import type { BillingPlanId, IndividualPlanId, TeamPlanId } from "@/lib/billing";
import { formatMinorCurrency } from "@/lib/currency";
import { stripeJsPromise } from "@/lib/stripe-js";
import { makeTRPCClient } from "@/lib/trpc/client";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Spinner } from "../ui/spinner";

type CheckoutSessionSummary = {
  sessionId: string;
  clientSecret: string | null;
  status: "open" | "complete" | "expired";
  paymentStatus: "paid" | "unpaid" | "no_payment_required" | null;
  amountTotal: number | null;
  currency: string | null;
  mode: "subscription" | "payment" | "setup";
  planId: string | null;
};

type BillingCheckoutProps = {
  scope: "billing";
  planId: IndividualPlanId | null;
  sessionId: string | null;
};

type TeamCheckoutProps = {
  scope: "team";
  organizationId: string | null;
  planId: TeamPlanId | null;
  sessionId: string | null;
};

type StripeCheckoutPageProps = BillingCheckoutProps | TeamCheckoutProps;

function usePlanLabel() {
  const t = useExtracted();

  return (planId: BillingPlanId | string | null | undefined) => {
    if (!planId) {
      return t("Checkout");
    }

    const interval = planId.endsWith("_yearly") ? t("Yearly") : t("Monthly");
    if (planId.startsWith("pro_team")) {
      return t("Pro for Teams {name}", { name: interval });
    }

    return t("{tier} {name}", {
      tier: planId.startsWith("pro_") ? t("Pro") : t("Plus"),
      name: interval,
    });
  };
}

function CheckoutSummary({
  checkout,
  planLabel,
}: {
  checkout: StripeCheckoutValue;
  planLabel: string;
}) {
  const t = useExtracted();
  const primaryLineItem = checkout.lineItems[0];

  return (
    <Card className="border-border/80">
      <CardHeader className="space-y-3">
        <div className="space-y-1">
          <CardTitle className="text-xl">{planLabel}</CardTitle>
          <CardDescription>
            {t("This price is provided directly by Stripe and will match the checkout total.")}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {checkout.currencyOptions && checkout.currencyOptions.length > 1 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">{t("Choose currency")}</div>
            <div className="rounded-lg border border-border bg-background px-3 py-2">
              <CurrencySelectorElement />
            </div>
          </div>
        )}

        <div className="rounded-2xl bg-muted/60 p-4">
          <div className="text-sm text-muted-foreground">{t("Due today")}</div>
          <div className="mt-1 text-3xl font-semibold tracking-tight">
            {checkout.total.total.amount}
          </div>
          {checkout.recurring && (
            <div className="mt-2 text-sm text-muted-foreground">
              {t("Next renewal: {amount}/{interval}", {
                amount: checkout.recurring.dueNext.total.amount,
                interval: checkout.recurring.interval === "year" ? t("year") : t("month"),
              })}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="text-sm font-medium">{t("Order summary")}</div>
          <div className="rounded-xl border border-border bg-background p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-medium">{primaryLineItem?.name ?? planLabel}</div>
                {primaryLineItem?.description && (
                  <div className="mt-1 text-sm text-muted-foreground">
                    {primaryLineItem.description}
                  </div>
                )}
              </div>
              <div className="text-right font-medium">{primaryLineItem?.total.amount}</div>
            </div>
            {primaryLineItem?.quantity && primaryLineItem.quantity > 1 && (
              <div className="mt-3 text-sm text-muted-foreground">
                {t("{count} seats", { count: primaryLineItem.quantity.toString() })}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CheckoutForm({
  planLabel,
  backHref,
  returnLabel,
  returnUrl,
}: {
  planLabel: string;
  backHref: string;
  returnLabel: string;
  returnUrl: string;
}) {
  const t = useExtracted();
  const router = useRouter();
  const checkoutState = useCheckout();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (checkoutState.type === "loading") {
    return (
      <div className="flex min-h-[24rem] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (checkoutState.type === "error") {
    return (
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle>{t("Checkout unavailable")}</CardTitle>
          <CardDescription>{checkoutState.error.message}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href={backHref}>{returnLabel}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { checkout } = checkoutState;

  if (checkout.status.type === "complete") {
    return (
      <Card className="border-border/80">
        <CardHeader>
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5" />
            {t("Checkout complete")}
          </div>
          <CardTitle className="mt-3 text-xl">{planLabel}</CardTitle>
          <CardDescription>
            {checkout.recurring
              ? t("Your subscription is active. You can return to billing at any time.")
              : t("Your payment is complete. You can return to billing at any time.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl bg-muted/60 p-4">
            <div className="text-sm text-muted-foreground">{t("Due today")}</div>
            <div className="mt-1 text-2xl font-semibold">{checkout.total.total.amount}</div>
          </div>
          <Button asChild className="w-full">
            <Link href={backHref}>{returnLabel}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  async function handleConfirm() {
    if (isSubmitting || !checkout.canConfirm) {
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const result = await checkout.confirm();

      if (result.type === "error") {
        setSubmitError(result.error.message);
        return;
      }

      startTransition(() => {
        router.replace(returnUrl);
      });
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : t("Unable to complete checkout. Please try again."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <CheckoutSummary checkout={checkout} planLabel={planLabel} />
      <Card className="border-border/80">
        <CardHeader>
          <CardTitle>{t("Payment details")}</CardTitle>
          <CardDescription>{t("Checkout")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-border bg-background p-4">
            <PaymentElement options={{ layout: "accordion" }} />
          </div>
          {submitError && <p className="text-sm text-destructive">{submitError}</p>}
          <Button
            className="w-full"
            disabled={isSubmitting || !checkout.canConfirm}
            onClick={handleConfirm}
          >
            {isSubmitting && <Spinner className="size-4" />}
            {checkout.recurring ? t("Start subscription") : t("Complete payment")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ServerSessionComplete({
  session,
  planLabel,
  backHref,
  returnLabel,
}: {
  session: CheckoutSessionSummary;
  planLabel: string;
  backHref: string;
  returnLabel: string;
}) {
  const t = useExtracted();
  const locale = useLocale();

  return (
    <Card className="border-border/80">
      <CardHeader>
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5" />
          {t("Checkout complete")}
        </div>
        <CardTitle className="mt-3 text-xl">{planLabel}</CardTitle>
        <CardDescription>
          {session.mode === "subscription"
            ? t("Your subscription is active. You can return to billing at any time.")
            : t("Your payment is complete. You can return to billing at any time.")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {session.amountTotal !== null && session.currency && (
          <div className="rounded-xl bg-muted/60 p-4">
            <div className="text-sm text-muted-foreground">{t("Due today")}</div>
            <div className="mt-1 text-2xl font-semibold">
              {formatMinorCurrency(session.amountTotal, session.currency, undefined, locale)}
            </div>
          </div>
        )}
        <Button asChild className="w-full">
          <Link href={backHref}>{returnLabel}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function StripeCheckoutPage(props: StripeCheckoutPageProps) {
  const t = useExtracted();
  const router = useRouter();
  const trpcClient = useMemo(() => makeTRPCClient(), []);
  const { planId, scope, sessionId } = props;
  const organizationId = props.scope === "team" ? props.organizationId : null;
  const [session, setSession] = useState<CheckoutSessionSummary | null>(null);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const planLabel = usePlanLabel()((session?.planId as BillingPlanId | null) ?? planId);

  const backHref = scope === "billing" ? "/settings/billing" : "/settings/team";
  const returnLabel = scope === "billing" ? t("Return to billing") : t("Return to team billing");
  const returnUrl =
    typeof window === "undefined"
      ? backHref
      : `${window.location.origin}${
          scope === "billing"
            ? `/settings/billing/checkout?session_id=${session?.sessionId ?? sessionId ?? ""}`
            : `/settings/team/checkout?organizationId=${organizationId}&session_id=${session?.sessionId ?? sessionId ?? ""}`
        }`;

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setBootstrapError(null);
      setIsBootstrapping(true);

      if (!stripeJsPromise) {
        throw new Error(t("Stripe publishable key is not configured."));
      }

      if (scope === "team" && !organizationId) {
        throw new Error(t("An organization is required to start team checkout."));
      }

      if (sessionId) {
        const result =
          scope === "billing"
            ? await trpcClient.billing.getCheckoutSession.query({ sessionId })
            : await trpcClient.organization.getTeamCheckoutSession.query({
                organizationId: organizationId!,
                sessionId,
              });

        if (!cancelled) {
          setSession({
            ...result,
            status: result.status ?? "open",
          });
        }
        return;
      }

      if (!planId) {
        throw new Error(t("A plan is required to start checkout."));
      }

      const result =
        scope === "billing"
          ? await trpcClient.billing.createCheckoutSession.mutate({ planId })
          : await trpcClient.organization.createTeamCheckoutSession.mutate({
              organizationId: organizationId!,
              planId,
            });

      if (cancelled) {
        return;
      }

      setSession({
        sessionId: result.sessionId,
        clientSecret: result.clientSecret,
        status: "open",
        paymentStatus: "unpaid",
        amountTotal: null,
        currency: null,
        mode: "subscription",
        planId,
      });

      const nextHref =
        scope === "billing"
          ? `/settings/billing/checkout?session_id=${result.sessionId}`
          : `/settings/team/checkout?organizationId=${organizationId}&session_id=${result.sessionId}`;

      startTransition(() => {
        router.replace(nextHref);
      });
    }

    bootstrap()
      .catch((error: unknown) => {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : t("Unable to load checkout.");
          setBootstrapError(message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsBootstrapping(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [organizationId, planId, router, scope, sessionId, t, trpcClient]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">{t("Checkout")}</div>
          <h1 className="text-2xl font-semibold tracking-tight">{planLabel}</h1>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href={backHref}>
            <ArrowLeft className="size-4" />
            {returnLabel}
          </Link>
        </Button>
      </div>

      {isBootstrapping ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner />
        </div>
      ) : bootstrapError ? (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle>{t("Checkout unavailable")}</CardTitle>
            <CardDescription>{bootstrapError}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href={backHref}>{returnLabel}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : session?.status === "complete" ? (
        <ServerSessionComplete
          session={session}
          planLabel={planLabel}
          backHref={backHref}
          returnLabel={returnLabel}
        />
      ) : session?.status === "expired" ? (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle>{t("Checkout unavailable")}</CardTitle>
            <CardDescription>
              {t("Checkout session expired. Start again from the billing page.")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href={backHref}>{returnLabel}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : session?.clientSecret ? (
        <CheckoutProvider
          key={session.sessionId}
          stripe={stripeJsPromise}
          options={{
            adaptivePricing: { allowed: true },
            clientSecret: session.clientSecret,
          }}
        >
          <CheckoutForm
            planLabel={planLabel}
            backHref={backHref}
            returnLabel={returnLabel}
            returnUrl={returnUrl}
          />
        </CheckoutProvider>
      ) : (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle>{t("Checkout unavailable")}</CardTitle>
            <CardDescription>{t("Unable to load checkout.")}</CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}

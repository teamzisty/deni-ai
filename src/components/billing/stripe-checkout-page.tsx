"use client";

import {
  BillingAddressElement,
  CheckoutProvider,
  CurrencySelectorElement,
  PaymentElement,
  useCheckout,
} from "@stripe/react-stripe-js/checkout";
import type { StripeCheckoutValue } from "@stripe/react-stripe-js/checkout";
import type { Appearance } from "@stripe/stripe-js";
import { ArrowLeft, ShieldCheck, Tag, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useExtracted, useLocale } from "next-intl";
import { useTheme } from "next-themes";
import { startTransition, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { BillingPlanId, IndividualPlanId, TeamPlanId } from "@/lib/billing";
import { findPlanById } from "@/lib/billing";
import { useBillingPlanCopy } from "@/lib/billing-plan-copy";
import { formatMinorCurrency } from "@/lib/currency";
import { stripeJsPromise } from "@/lib/stripe-js";
import { makeTRPCClient } from "@/lib/trpc/client";
import { PlanHighlights } from "./plan-highlights";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
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
function getStripeCheckoutAppearance(theme: string | undefined): Appearance {
  const isDark = theme === "dark";
  const backgroundColor = isDark ? "#1a1a1a" : "#ffffff";
  const foregroundColor = isDark ? "#fafafa" : "#171717";
  const mutedColor = isDark ? "#a3a3a3" : "#737373";
  const borderColor = isDark ? "#404040" : "#e5e5e5";
  const focusRingColor = isDark ? "rgba(115, 115, 115, 0.35)" : "rgba(23, 23, 23, 0.12)";

  return {
    theme: isDark ? "night" : "stripe",
    inputs: "spaced",
    labels: "above",
    variables: {
      borderRadius: "8px",
      colorBackground: backgroundColor,
      colorDanger: isDark ? "#f87171" : "#dc2626",
      colorPrimary: foregroundColor,
      colorText: foregroundColor,
      colorTextPlaceholder: mutedColor,
      colorTextSecondary: mutedColor,
      fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      fontSizeBase: "14px",
      fontWeightMedium: "500",
      fontWeightNormal: "400",
      spacingUnit: "4px",
      gridRowSpacing: "12px",
    },
    rules: {
      ".Label": {
        color: foregroundColor,
        fontSize: "14px",
        fontWeight: "500",
        marginBottom: "6px",
      },
      ".Input": {
        backgroundColor,
        border: `1px solid ${borderColor}`,
        borderRadius: "8px",
        boxShadow: "none",
        color: foregroundColor,
        fontSize: "14px",
        lineHeight: "20px",
        padding: "8px 12px",
      },
      ".Input:focus": {
        border: `1px solid ${borderColor}`,
        boxShadow: `0 0 0 3px ${focusRingColor}`,
        outline: "none",
      },
      ".Input::placeholder": {
        color: mutedColor,
      },
      ".Block": {
        backgroundColor: "transparent",
        border: "none",
        boxShadow: "none",
        padding: "0",
      },
      ".Tab": {
        backgroundColor: "transparent",
        border: "none",
        borderRadius: "0",
        boxShadow: "none",
        padding: "0",
      },
      ".Tab:hover": {
        backgroundColor: "transparent",
        border: "none",
        boxShadow: "none",
      },
      ".Tab--selected": {
        backgroundColor: "transparent",
        border: "none",
        boxShadow: "none",
        color: foregroundColor,
      },
      ".TabLabel": {
        color: "transparent",
        fontSize: "0",
        padding: "0",
        textShadow: "none",
      },
      ".AccordionItem": {
        backgroundColor: "transparent",
        border: "none",
        boxShadow: "none",
        padding: "0",
      },
      ".AccordionItem--selected": {
        backgroundColor: "transparent",
        border: "none",
        boxShadow: "none",
        padding: "0",
      },
      ".RadioIconOuter": {
        stroke: "transparent",
      },
      ".RadioIconInner": {
        fill: "transparent",
      },
    },
  };
}

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
  planId,
}: {
  checkout: StripeCheckoutValue;
  planLabel: string;
  planId: BillingPlanId | null;
}) {
  const t = useExtracted();
  const planCopy = useBillingPlanCopy(planId);

  return (
    <Card className="not-first:border-border/80 bg-card/80 shadow-sm backdrop-blur-sm">
      <CardHeader>
        <div className="space-y-1">
          <CardTitle className="text-2xl">{planLabel}</CardTitle>
          {planCopy?.tagline ? (
            <CardDescription className="text-sm">{planCopy.tagline}</CardDescription>
          ) : null}
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

        <div className="rounded-2xl border border-border/80 bg-muted/50 p-5">
          <div className="text-sm font-medium text-muted-foreground">{t("Due today")}</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight">
            {checkout.total.total.amount}
          </div>
          {checkout.recurring && (
            <div className="mt-3 text-sm text-muted-foreground">
              {t("Next renewal: {amount}/{interval}", {
                amount: checkout.recurring.dueNext.total.amount,
                interval: checkout.recurring.interval === "year" ? t("year") : t("month"),
              })}
            </div>
          )}
        </div>

        {planCopy ? (
          <div className="rounded-2xl border border-border/80 bg-background/70 p-5">
            <PlanHighlights items={planCopy.highlights} />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function PromotionCodeSection({ checkout }: { checkout: StripeCheckoutValue }) {
  const t = useExtracted();
  const [promotionCode, setPromotionCode] = useState("");
  const [promotionError, setPromotionError] = useState<string | null>(null);
  const [isApplyingPromotion, setIsApplyingPromotion] = useState(false);
  const [isRemovingPromotion, setIsRemovingPromotion] = useState(false);
  const appliedDiscount =
    checkout.discountAmounts?.find((discount) => discount.promotionCode) ?? null;

  useEffect(() => {
    if (appliedDiscount?.promotionCode) {
      setPromotionCode(appliedDiscount.promotionCode);
      return;
    }

    setPromotionCode("");
  }, [appliedDiscount?.promotionCode]);

  async function handleApplyPromotionCode() {
    const code = promotionCode.trim();
    if (!code || isApplyingPromotion || isRemovingPromotion) {
      return;
    }

    setPromotionError(null);
    setIsApplyingPromotion(true);

    try {
      const result = await checkout.applyPromotionCode(code);

      if (result.type === "error") {
        const message =
          result.error.code === "invalidCode"
            ? t("This coupon code is invalid or unavailable.")
            : result.error.message;
        setPromotionError(message);
        toast.error(message);
        return;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t("Unable to apply coupon code.");
      setPromotionError(message);
      toast.error(message);
    } finally {
      setIsApplyingPromotion(false);
    }
  }

  async function handleRemovePromotionCode() {
    if (!appliedDiscount || isApplyingPromotion || isRemovingPromotion) {
      return;
    }

    setPromotionError(null);
    setIsRemovingPromotion(true);

    try {
      const result = await checkout.removePromotionCode();

      if (result.type === "error") {
        setPromotionError(result.error.message);
        toast.error(result.error.message);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t("Unable to remove coupon code.");
      setPromotionError(message);
      toast.error(message);
    } finally {
      setIsRemovingPromotion(false);
    }
  }

  return (
    <div className="space-y-3 rounded-2xl shadow-sm">
      <div className="space-y-1">
        <div className="text-sm font-medium">{t("Coupon code")}</div>
        <div className="text-sm text-muted-foreground">
          {t("Apply a Stripe promotion code before completing checkout.")}
        </div>
      </div>

      {appliedDiscount ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <Tag className="size-4 text-muted-foreground" />
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{appliedDiscount.promotionCode}</div>
              <div className="text-xs text-muted-foreground">
                {t("Discount applied: {amount}", { amount: appliedDiscount.amount })}
              </div>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 rounded-full px-3"
            disabled={isRemovingPromotion}
            onClick={handleRemovePromotionCode}
          >
            {isRemovingPromotion ? <Spinner className="size-4" /> : <X className="size-4" />}
            {t("Remove")}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Input
            value={promotionCode}
            onChange={(event) => {
              setPromotionCode(event.target.value);
              if (promotionError) {
                setPromotionError(null);
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void handleApplyPromotionCode();
              }
            }}
            placeholder={t("Enter coupon code")}
            autoComplete="off"
            disabled={isApplyingPromotion}
            className="bg-background/80"
          />
          <Button
            type="button"
            variant="outline"
            disabled={isApplyingPromotion || promotionCode.trim().length === 0}
            onClick={handleApplyPromotionCode}
          >
            {isApplyingPromotion && <Spinner className="size-4" />}
            {t("Apply")}
          </Button>
        </div>
      )}

      {promotionError && <p className="text-sm text-destructive">{promotionError}</p>}
    </div>
  );
}

function CheckoutForm({
  planLabel,
  backHref,
  returnLabel,
  returnUrl,
  appearance,
  planId,
}: {
  planLabel: string;
  backHref: string;
  returnLabel: string;
  returnUrl: string;
  appearance: Appearance;
  planId: BillingPlanId | null;
}) {
  const t = useExtracted();
  const router = useRouter();
  const checkoutState = useCheckout();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const checkout = checkoutState.type === "success" ? checkoutState.checkout : null;

  useEffect(() => {
    if (!checkout) {
      return;
    }

    checkout.changeAppearance(appearance);
  }, [appearance, checkout]);

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

  const activeCheckout = checkoutState.checkout;

  if (activeCheckout.status.type === "complete") {
    return (
      <Card className="border-border/80">
        <CardHeader>
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5" />
            {t("Checkout complete")}
          </div>
          <CardTitle className="mt-3 text-xl">{planLabel}</CardTitle>
          <CardDescription>
            {activeCheckout.recurring
              ? t("Your subscription is active. You can return to billing at any time.")
              : t("Your payment is complete. You can return to billing at any time.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl bg-muted/60 p-4">
            <div className="text-sm text-muted-foreground">{t("Due today")}</div>
            <div className="mt-1 text-2xl font-semibold">{activeCheckout.total.total.amount}</div>
          </div>
          <Button asChild className="w-full">
            <Link href={backHref}>{returnLabel}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  async function handleConfirm() {
    if (isSubmitting || !activeCheckout.canConfirm) {
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const result = await activeCheckout.confirm();

      if (result.type === "error") {
        setSubmitError(result.error.message);
        toast.error(result.error.message);
        return;
      }

      startTransition(() => {
        router.replace(returnUrl);
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t("Unable to complete checkout. Please try again.");
      setSubmitError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,24rem)] lg:items-start">
      <div className="space-y-10">
        <PromotionCodeSection checkout={activeCheckout} />

        <section className="space-y-4">
          <div className="space-y-1.5">
            <h2 className="text-sm font-medium">{t("Payment method")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("Enter your card details to complete checkout.")}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <PaymentElement
              options={{
                fields: {
                  billingDetails: {
                    address: "never",
                    email: "never",
                    name: "never",
                    phone: "never",
                  },
                },
                layout: {
                  type: "tabs",
                  defaultCollapsed: false,
                  paymentMethodLogoPosition: "end",
                  radios: false,
                  spacedAccordionItems: false,
                },
              }}
            />
          </div>
        </section>

        <section className="space-y-4">
          <div className="space-y-1.5">
            <h2 className="text-sm font-medium">{t("Billing address")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("Use the billing address associated with this card.")}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <BillingAddressElement
              options={{
                display: {
                  name: "full",
                },
              }}
            />
          </div>
        </section>
      </div>

      <div className="lg:sticky lg:top-6 space-y-6">
        <CheckoutSummary checkout={activeCheckout} planLabel={planLabel} planId={planId} />
        {submitError && <p className="text-sm text-destructive">{submitError}</p>}
        <Button
          className="h-11 w-full rounded-full text-sm font-medium"
          disabled={isSubmitting || !activeCheckout.canConfirm}
          onClick={handleConfirm}
        >
          {isSubmitting && <Spinner className="size-4" />}
          {activeCheckout.recurring ? t("Start subscription") : t("Complete payment")}
        </Button>
      </div>
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
  const { resolvedTheme } = useTheme();
  const trpcClient = useMemo(() => makeTRPCClient(), []);
  const { planId, scope, sessionId } = props;
  const organizationId = props.scope === "team" ? props.organizationId : null;
  const [session, setSession] = useState<CheckoutSessionSummary | null>(null);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const resolvedPlanId = useMemo(() => {
    const candidate = session?.planId ?? planId;
    return candidate ? (findPlanById(candidate)?.id ?? null) : null;
  }, [planId, session?.planId]);
  const planLabel = usePlanLabel()(resolvedPlanId ?? session?.planId ?? planId);
  const checkoutAppearance = useMemo(
    () => getStripeCheckoutAppearance(resolvedTheme),
    [resolvedTheme],
  );

  const backHref = scope === "billing" ? "/settings/billing" : "/settings/team";
  const returnLabel = scope === "billing" ? t("Return to billing") : t("Return to team billing");
  const returnUrl =
    typeof window === "undefined"
      ? backHref
      : `${window.location.origin}${
          scope === "billing"
            ? `/settings/billing/checkout/${session?.sessionId ?? sessionId ?? ""}`
            : `/settings/team/checkout/${session?.sessionId ?? sessionId ?? ""}?organizationId=${organizationId}`
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
          ? `/settings/billing/checkout/${result.sessionId}`
          : `/settings/team/checkout/${result.sessionId}?organizationId=${organizationId}`;

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
      <div className="bg-background flex items-center justify-between gap-4">
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
            elementsOptions: {
              appearance: checkoutAppearance,
            },
          }}
        >
          <CheckoutForm
            planLabel={planLabel}
            backHref={backHref}
            returnLabel={returnLabel}
            returnUrl={returnUrl}
            appearance={checkoutAppearance}
            planId={resolvedPlanId}
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

"use client";

import { Zap, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useExtracted, useLocale } from "next-intl";
import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { BillingPlanId, ClientPlan, IndividualPlanId } from "@/lib/billing";
import { getPlanTier, isTeamPlan } from "@/lib/billing";
import { isBillingDisabled } from "@/lib/billing-config";
import { useBillingPlanCopy } from "@/lib/billing-plan-copy";
import { formatMinorCurrency } from "@/lib/currency";
import { trpc } from "@/lib/trpc/react";
import { useFormatPriceParts } from "@/lib/use-format-price-parts";
import { cn } from "@/lib/utils";
import { SettingsPageShell } from "../settings-page-shell";
import { PlanHighlights } from "./plan-highlights";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { Progress } from "../ui/progress";
import { Spinner } from "../ui/spinner";
import { Switch } from "../ui/switch";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";

const ACTIVE_STATUSES = new Set(["active", "trialing", "paid"]);
const usageResetFormatter = (locale: string) =>
  new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
  });

function useFormatPriceLabel() {
  const t = useExtracted();
  const locale = useLocale();
  return (plan: ClientPlan) => {
    const mode = plan.mode ?? "subscription";
    if (!plan.amount || !plan.currency) {
      return t("Set price in Stripe");
    }

    const base = formatMinorCurrency(
      plan.amount,
      plan.currency,
      {
        currencyDisplay: "code",
        maximumFractionDigits: 0,
      },
      locale,
    );

    if (mode === "payment") {
      return t("{price} one-time", { price: base });
    }

    if (!plan.interval) {
      return base;
    }

    const localizedInterval =
      plan.interval === "month" ? t("month") : plan.interval === "year" ? t("year") : plan.interval;

    const interval =
      plan.intervalCount && plan.intervalCount > 1
        ? `${plan.intervalCount} ${localizedInterval}`
        : localizedInterval;

    return t("{price}/{interval}", { price: base, interval });
  };
}

function useFormatCurrencyMinor() {
  const locale = useLocale();
  return (amountMinor: number, currency?: string | null) =>
    formatMinorCurrency(amountMinor, currency, { currencyDisplay: "code" }, locale);
}

function usePlanIntervalLabel() {
  const t = useExtracted();
  return (planId: BillingPlanId) => {
    if (planId.endsWith("_monthly")) {
      return t("Monthly");
    }
    if (planId.endsWith("_yearly")) {
      return t("Yearly");
    }
    if (planId.endsWith("_lifetime")) {
      return t("Lifetime");
    }
    return "";
  };
}

function getTierLabel(t: ReturnType<typeof useExtracted>, planId: string) {
  const tier = getPlanTier(planId);
  if (tier === "max") {
    return t("Max");
  }
  if (tier === "team") {
    return t("Team");
  }
  if (tier === "pro") {
    return t("Pro");
  }

  return t("Plus");
}

function PlanCard({
  plan,
  monthlyPlan,
  interval,
  onIntervalChange,
  isCurrent,
  hasActiveSubscription,
  cancelDate,
  activePlanId,
  changePlan,
  checkout,
  onChangePlanClick,
  onCheckout,
  isLoadingEstimate,
  isOnTeamPlan,
}: {
  plan: ClientPlan;
  monthlyPlan?: ClientPlan;
  interval?: "monthly" | "yearly";
  onIntervalChange?: (interval: "monthly" | "yearly") => void;
  isCurrent: boolean;
  hasActiveSubscription: boolean;
  cancelDate: number | false;
  activePlanId: string | undefined;
  changePlan: { isPending: boolean; variables?: { planId: IndividualPlanId } };
  checkout: { isPending: boolean; variables?: { planId: IndividualPlanId } };
  onChangePlanClick: (plan: ClientPlan) => void;
  onCheckout: (planId: IndividualPlanId) => void;
  isLoadingEstimate: boolean;
  isOnTeamPlan?: boolean;
}) {
  const t = useExtracted();
  const locale = useLocale();
  const formatPriceLabel = useFormatPriceLabel();
  const formatPriceParts = useFormatPriceParts();
  const planCopy = useBillingPlanCopy(plan.id);
  const mode = plan.mode ?? "subscription";
  const offerEndsAt = plan.limitedTimeOfferEndsAt ? new Date(plan.limitedTimeOfferEndsAt) : null;
  const offerEndsLabel =
    offerEndsAt && !Number.isNaN(offerEndsAt.getTime())
      ? new Intl.DateTimeFormat(locale, {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }).format(offerEndsAt)
      : null;
  const canChange = hasActiveSubscription && !cancelDate && !isCurrent && mode === "subscription";
  const isBlockedByCancel = Number.isInteger(cancelDate) && Boolean(activePlanId) && !isCurrent;
  const processing =
    (changePlan.isPending && changePlan.variables?.planId === plan.id) ||
    (checkout.isPending && checkout.variables?.planId === plan.id);
  const isLoadingThisPlan = isLoadingEstimate;

  const tierName = getTierLabel(t, plan.id);
  const priceParts =
    plan.amount && plan.currency ? formatPriceParts(plan.amount, plan.currency) : null;
  const monthlyEquivalent =
    mode === "subscription" && interval === "yearly" && plan.amount && plan.currency
      ? formatMinorCurrency(
          Math.round(plan.amount / 12),
          plan.currency,
          {
            currencyDisplay: "code",
            maximumFractionDigits: 0,
          },
          locale,
        )
      : null;
  const savingsPercent =
    mode === "subscription" &&
    interval === "yearly" &&
    plan.amount &&
    monthlyPlan?.amount &&
    monthlyPlan.currency === plan.currency &&
    monthlyPlan.amount > 0
      ? Math.max(
          0,
          Math.round(((monthlyPlan.amount * 12 - plan.amount) / (monthlyPlan.amount * 12)) * 100),
        )
      : 0;
  const primaryActionLabel = isOnTeamPlan
    ? t("Team plan active")
    : isCurrent
      ? t("Current plan")
      : isBlockedByCancel
        ? t("Resume to change")
        : canChange
          ? t("Change plan")
          : mode === "payment"
            ? t("Buy once")
            : plan.trialDays
              ? t("Start {days}-day trial", { days: plan.trialDays.toString() })
              : t("Subscribe");
  const showTrustCopy = !isOnTeamPlan && !isCurrent && !isBlockedByCancel;

  return (
    <Card
      className={cn(
        "flex flex-col",
        interval === "yearly" && "border-foreground/20 bg-muted/20",
        isCurrent && "border-foreground ring-1 ring-foreground/10",
      )}
    >
      <CardHeader className="pb-4">
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-[11px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
                {tierName}
              </CardTitle>
              {plan.trialDays ? (
                <Badge className="border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300">
                  {t("{days}-day free trial", {
                    days: plan.trialDays.toString(),
                  })}
                </Badge>
              ) : interval === "yearly" && savingsPercent > 0 ? (
                <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                  {t("Save {percent}%", { percent: savingsPercent.toString() })}
                </Badge>
              ) : planCopy.badge ? (
                <Badge variant="secondary" className="text-xs">
                  {planCopy.badge}
                </Badge>
              ) : null}
            </div>
            <CardDescription className="text-sm leading-relaxed">
              {planCopy.tagline}
            </CardDescription>
          </div>
          {mode === "subscription" ? (
            <Tabs
              value={interval}
              onValueChange={(v) => onIntervalChange?.(v as "monthly" | "yearly")}
            >
              <TabsList className="h-8 rounded-lg">
                <TabsTrigger value="monthly" className="h-6 px-3 text-xs rounded-md">
                  {t("Monthly")}
                </TabsTrigger>
                <TabsTrigger value="yearly" className="h-6 px-3 text-xs rounded-md">
                  {t("Yearly")}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          ) : (
            <Badge variant="secondary" className="text-xs">
              {t("Lifetime")}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col pt-0">
        <div className="flex-1">
          <div className="space-y-3">
            {priceParts ? (
              <div className="space-y-1">
                <div className="flex items-start gap-2">
                  <span className="pt-2 text-[11px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
                    {priceParts.currency}
                  </span>
                  <span className="text-4xl font-semibold tracking-tight">{priceParts.amount}</span>
                  {plan.interval && (
                    <span className="pt-3 text-sm text-muted-foreground">
                      /
                      {plan.interval === "month"
                        ? t("month")
                        : plan.interval === "year"
                          ? t("year")
                          : plan.interval}
                    </span>
                  )}
                </div>
                {plan.originalAmount && plan.currency && (
                  <p className="text-sm text-muted-foreground line-through">
                    {formatMinorCurrency(
                      plan.originalAmount,
                      plan.currency,
                      {
                        currencyDisplay: "code",
                        maximumFractionDigits: 0,
                      },
                      locale,
                    )}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-2xl font-semibold tracking-tight">{formatPriceLabel(plan)}</div>
            )}
            {interval === "yearly" && monthlyEquivalent && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  {t("{amount}/month when billed yearly", {
                    amount: monthlyEquivalent,
                  })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("One yearly payment of {price}", {
                    price: formatPriceLabel(plan),
                  })}
                </p>
              </div>
            )}
            {mode === "payment" && (
              <p className="text-sm font-medium text-foreground">{t("One-time purchase")}</p>
            )}
            {offerEndsLabel && (
              <p className="text-xs text-muted-foreground">
                {t("24-hour offer ends {date}", { date: offerEndsLabel })}
              </p>
            )}
          </div>
          <PlanHighlights items={planCopy.highlights} className="mt-5" />
        </div>
        <Button
          className="mt-6 h-auto min-h-12 w-full flex-col gap-1 py-3 font-medium"
          variant={isCurrent ? "secondary" : "default"}
          disabled={
            isCurrent || processing || isBlockedByCancel || isLoadingThisPlan || isOnTeamPlan
          }
          onClick={() => {
            if (canChange) {
              onChangePlanClick(plan);
            } else {
              onCheckout(plan.id as IndividualPlanId);
            }
          }}
        >
          {(processing || isLoadingThisPlan) && <Spinner className="w-4 h-4" />}
          <span>{primaryActionLabel}</span>
          {showTrustCopy && (
            <span className="text-[11px] font-normal text-current/80">
              {mode === "payment" ? t("Pay once. Keep access.") : t("Cancel anytime")}
            </span>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

type UsageItem = {
  category: "basic" | "premium";
  limit: number | null;
  used: number;
  remaining: number | null;
  periodEnd: Date | string | null;
};

function UsageRow({
  label,
  item,
  maxModeEnabled,
}: {
  label: string;
  item: UsageItem | undefined;
  maxModeEnabled?: boolean;
}) {
  const t = useExtracted();
  const locale = useLocale();
  if (!item) return null;

  // When Max Mode is enabled, show as unlimited
  if (maxModeEnabled) {
    const periodEndLabel = item.periodEnd
      ? usageResetFormatter(locale).format(new Date(item.periodEnd))
      : null;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>{label}</span>
          <span className="text-muted-foreground">
            {item.used.toLocaleString()} / {t("Unlimited")}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Zap className="size-3 text-blue-500" />
            {t("Max Mode active")}
          </span>
          {periodEndLabel && <span>{t("Resets {date}", { date: periodEndLabel })}</span>}
        </div>
      </div>
    );
  }

  const limitLabel = item.limit === null ? t("Unlimited") : item.limit.toLocaleString();
  const progress =
    item.limit === null || item.limit === 0 ? 0 : Math.min((item.used / item.limit) * 100, 100);
  const remainingLabel =
    item.limit === null
      ? t("Unlimited")
      : t("{count} remaining", {
          count: Math.max(item.remaining ?? 0, 0).toLocaleString(),
        });
  const periodEndLabel = item.periodEnd
    ? usageResetFormatter(locale).format(new Date(item.periodEnd))
    : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">
          {item.used.toLocaleString()} / {limitLabel}
        </span>
      </div>
      <Progress value={progress} className="h-2" />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{remainingLabel}</span>
        {periodEndLabel && <span>{t("Resets {date}", { date: periodEndLabel })}</span>}
      </div>
    </div>
  );
}

function BillingDisabled() {
  const t = useExtracted();

  return (
    <SettingsPageShell
      title={t("Billing")}
      description={t("Billing is disabled for this environment.")}
    >
      <Card>
        <CardHeader>
          <CardTitle>{t("Billing unavailable")}</CardTitle>
          <CardDescription>
            {t("Plans, checkout, and billing management are turned off.")}
          </CardDescription>
        </CardHeader>
      </Card>
    </SettingsPageShell>
  );
}

function BillingPageContent() {
  const t = useExtracted();
  const locale = useLocale();
  const router = useRouter();
  const getPlanIntervalLabel = usePlanIntervalLabel();
  const formatCurrencyMinor = useFormatCurrencyMinor();
  const [isChangePlanOpen, setIsChangePlanOpen] = useState(false);
  const [changeTarget, setChangeTarget] = useState<ClientPlan | null>(null);
  const [plusInterval, setPlusInterval] = useState<"monthly" | "yearly">("monthly");
  const [proInterval, setProInterval] = useState<"monthly" | "yearly">("monthly");
  const [maxInterval, setMaxInterval] = useState<"monthly" | "yearly">("monthly");
  const [hasAgreed, setHasAgreed] = useState(false);
  const [pendingPlanId, setPendingPlanId] = useState<IndividualPlanId | null>(null);

  // Pre-fetch estimate when user clicks "Change plan" button
  const estimateQuery = trpc.billing.estimatePlanChange.useQuery(
    { planId: pendingPlanId ?? "plus_monthly" },
    {
      enabled: Boolean(pendingPlanId),
      refetchOnWindowFocus: false,
      retry: false,
    },
  );

  // Open dialog when estimate is loaded
  useEffect(() => {
    if (pendingPlanId && !estimateQuery.isLoading) {
      setIsChangePlanOpen(true);
    }
  }, [pendingPlanId, estimateQuery.isLoading]);

  // Reset state when dialog closes
  const handleDialogOpenChange = useCallback((open: boolean) => {
    setIsChangePlanOpen(open);
    if (!open) {
      setHasAgreed(false);
      setPendingPlanId(null);
      setChangeTarget(null);
    }
  }, []);

  // Handle "Change plan" button click - start loading estimate
  const handleChangePlanClick = useCallback((plan: ClientPlan) => {
    setChangeTarget(plan);
    setPendingPlanId(plan.id as IndividualPlanId);
  }, []);

  const createCheckout = trpc.billing.createCheckoutSession.useMutation();

  const handleCheckout = useCallback(
    async (planId: IndividualPlanId) => {
      try {
        const result = await createCheckout.mutateAsync({ planId });
        startTransition(() => {
          router.push(`/settings/billing/checkout/${result.sessionId}`);
        });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("Unable to load checkout."));
      }
    },
    [createCheckout, router, t],
  );

  const utils = trpc.useUtils();
  const statusQuery = trpc.billing.status.useQuery(undefined, {
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });
  const plansQuery = trpc.billing.plans.useQuery();
  const usageQuery = trpc.billing.usage.useQuery(undefined, {
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  const portal = trpc.billing.createPortalSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      toast.error(t("Stripe did not return a billing portal URL."));
    },
    onError: (error) => toast.error(error.message),
  });

  const changePlan = trpc.billing.changePlan.useMutation({
    onSuccess: async () => {
      toast.success(t("Plan updated."));
      await utils.billing.status.invalidate();
      await utils.billing.usage.invalidate();
    },
    onError: (error) => toast.error(error.message),
    onSettled: () => setChangeTarget(null),
  });

  const cancel = trpc.billing.cancelSubscription.useMutation({
    onSuccess: async () => {
      toast.success(t("Subscription will end at period end."));
      await utils.billing.status.invalidate();
      await utils.billing.usage.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const resume = trpc.billing.resumeSubscription.useMutation({
    onSuccess: async () => {
      toast.success(t("Subscription resumed."));
      await utils.billing.status.invalidate();
      await utils.billing.usage.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  // Max Mode queries and mutations
  const maxModeQuery = trpc.billing.maxModeStatus.useQuery(undefined, {
    refetchOnWindowFocus: true,
  });

  const enableMaxMode = trpc.billing.enableMaxMode.useMutation({
    onSuccess: async () => {
      toast.success(t("Max Mode enabled."));
      await utils.billing.maxModeStatus.invalidate();
      await utils.billing.usage.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const disableMaxMode = trpc.billing.disableMaxMode.useMutation({
    onSuccess: async () => {
      toast.success(t("Max Mode disabled."));
      await utils.billing.maxModeStatus.invalidate();
      await utils.billing.usage.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const handleMaxModeToggle = useCallback(
    (enabled: boolean) => {
      if (enabled) {
        enableMaxMode.mutate();
      } else {
        disableMaxMode.mutate();
      }
    },
    [enableMaxMode, disableMaxMode],
  );

  const statusLabel = statusQuery.data?.status ?? "inactive";
  const rawPlanId = (statusQuery.data?.planId as BillingPlanId) ?? undefined;
  const activePlanId = ACTIVE_STATUSES.has(statusLabel) ? rawPlanId : undefined;
  const isOnTeamPlan =
    statusQuery.data?.isTeamPlan === true && rawPlanId ? isTeamPlan(rawPlanId) : false;
  const usage = usageQuery.data?.usage ?? [];
  const usageTier = usageQuery.data?.tier ?? "free";
  const usageTierLabel = (() => {
    switch (usageTier) {
      case "max":
        return t("Max");
      case "plus":
        return t("Plus");
      case "pro":
        return t("Pro");
      default:
        return t("Free");
    }
  })();

  const planMap = useMemo(
    () => new Map((plansQuery.data?.plans ?? []).map((plan) => [plan.id, plan])),
    [plansQuery.data?.plans],
  );

  const currentPlan = activePlanId ? planMap.get(activePlanId) : undefined;
  const isSubscribed = ACTIVE_STATUSES.has(statusLabel);
  const isSubscription = statusQuery.data?.mode === "subscription";
  const hasActiveSubscription = isSubscribed && isSubscription;
  const cancelDate = isSubscription ? (statusQuery.data?.cancelAt ?? false) : false;

  const loading = statusQuery.isLoading || plansQuery.isLoading;
  const errored = statusQuery.error ?? plansQuery.error;

  const allPlans = plansQuery.data?.plans ?? [];

  const plusMonthly = allPlans.find((p) => p.id === "plus_monthly");
  const plusYearly = allPlans.find((p) => p.id === "plus_yearly");
  const proMonthly = allPlans.find((p) => p.id === "pro_monthly");
  const proYearly = allPlans.find((p) => p.id === "pro_yearly");
  const maxMonthly = allPlans.find((p) => p.id === "max_monthly");
  const maxYearly = allPlans.find((p) => p.id === "max_yearly");
  const proLifetime = allPlans.find((p) => p.id === "pro_lifetime");

  const selectedPlusPlan = plusInterval === "monthly" ? plusMonthly : plusYearly;
  const selectedProPlan = proInterval === "monthly" ? proMonthly : proYearly;
  const selectedMaxPlan = maxInterval === "monthly" ? maxMonthly : maxYearly;
  const basicUsage = usage.find((entry) => entry.category === "basic");
  const premiumUsage = usage.find((entry) => entry.category === "premium");

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  return (
    <SettingsPageShell
      title={t("Billing")}
      description={t("Manage your subscription and usage")}
      className="max-w-6xl"
    >
      {/* Current Plan */}
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-sm font-medium">{t("Current Plan")}</CardTitle>
            <CardDescription>
              {isOnTeamPlan
                ? t("Pro for Teams {name}", {
                    name: rawPlanId ? getPlanIntervalLabel(rawPlanId) : "",
                  })
                : currentPlan
                  ? t("{tier} {name}", {
                      tier: activePlanId ? getTierLabel(t, activePlanId) : t("Plus"),
                      name: getPlanIntervalLabel(currentPlan.id),
                    })
                  : t("Free")}{" "}
              {cancelDate && (
                <span className="text-destructive">
                  {t("(Cancels {date})", {
                    date: new Date(cancelDate * 1000).toLocaleDateString(locale, {
                      month: "short",
                      day: "numeric",
                    }),
                  })}
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {statusQuery.data?.currentPeriodEnd && !cancelDate && (
              <span className="text-xs text-muted-foreground px-3 py-1 rounded-full bg-muted">
                {t("Renews {date}", {
                  date: new Intl.DateTimeFormat(locale, {
                    month: "short",
                    day: "numeric",
                  }).format(new Date(statusQuery.data.currentPeriodEnd)),
                })}
              </span>
            )}
            {isOnTeamPlan ? (
              <Button asChild variant="outline" size="sm">
                <Link href="/settings/team">{t("Manage Team")}</Link>
              </Button>
            ) : (
              <>
                {statusQuery.data?.stripeCustomerId && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={portal.isPending}
                    onClick={() => portal.mutate()}
                  >
                    {portal.isPending && <Spinner className="w-4 h-4 mr-1" />}
                    {t("Manage")}
                  </Button>
                )}
                {hasActiveSubscription && !cancelDate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    disabled={cancel.isPending}
                    onClick={() => cancel.mutate()}
                  >
                    {cancel.isPending && <Spinner className="w-4 h-4 mr-1" />}
                    {t("Cancel")}
                  </Button>
                )}
                {cancelDate && (
                  <Button size="sm" disabled={resume.isPending} onClick={() => resume.mutate()}>
                    {resume.isPending && <Spinner className="w-4 h-4 mr-1" />}
                    {t("Resume")}
                  </Button>
                )}
              </>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Usage */}
      <Card>
        <CardHeader className="gap-0!">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium">{t("Usage")}</CardTitle>
              <CardDescription>{t("Tier: {tier}", { tier: usageTierLabel })}</CardDescription>
            </div>
            <Badge variant="secondary">{usageTierLabel}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {usageQuery.isLoading ? (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          ) : usageQuery.error ? (
            <p className="text-sm text-destructive">{usageQuery.error.message}</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              <UsageRow
                label={t("Basic models")}
                item={basicUsage}
                maxModeEnabled={maxModeQuery.data?.enabled}
              />
              <UsageRow
                label={t("Premium models")}
                item={premiumUsage}
                maxModeEnabled={maxModeQuery.data?.enabled}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Max Mode - Only show for Pro users */}
      {maxModeQuery.data?.eligible && (
        <Card className="border-border/80">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Zap className="size-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">{t("Max Mode")}</CardTitle>
                {maxModeQuery.data?.enabled && <Badge variant="secondary">{t("Active")}</Badge>}
              </div>
              <CardDescription>
                {t("Continue using Deni AI after reaching your limits with pay-per-use pricing.")}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="max-mode-toggle" className="text-sm text-muted-foreground">
                {maxModeQuery.data?.enabled ? t("Enabled") : t("Disabled")}
              </Label>
              <Switch
                id="max-mode-toggle"
                checked={maxModeQuery.data?.enabled ?? false}
                onCheckedChange={handleMaxModeToggle}
                disabled={enableMaxMode.isPending || disableMaxMode.isPending}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border p-4">
                <div className="text-sm text-muted-foreground">{t("Basic model messages")}</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-semibold">
                    {maxModeQuery.data?.usageBasic ?? 0}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    × ${(maxModeQuery.data?.pricing.basic ?? 1) / 100}
                  </span>
                </div>
              </div>
              <div className="rounded-lg border border-border p-4">
                <div className="text-sm text-muted-foreground">{t("Premium model messages")}</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-semibold">
                    {maxModeQuery.data?.usagePremium ?? 0}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    × ${(maxModeQuery.data?.pricing.premium ?? 5) / 100}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
              <div className="text-sm text-muted-foreground">{t("Estimated cost this period")}</div>
              <div className="text-lg font-semibold">
                ${((maxModeQuery.data?.estimatedCost ?? 0) / 100).toFixed(2)}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {t(
                "Max Mode charges are billed at the end of each billing cycle. Pricing: $0.01 per basic message, $0.05 per premium message.",
              )}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Plans */}
      {errored ? (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle>{t("Error")}</CardTitle>
            <CardDescription>{errored.message}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {/* Plus Plan Card */}
            {selectedPlusPlan && (
              <PlanCard
                plan={selectedPlusPlan}
                monthlyPlan={plusMonthly}
                interval={plusInterval}
                onIntervalChange={setPlusInterval}
                isCurrent={selectedPlusPlan.id === activePlanId && isSubscribed}
                hasActiveSubscription={hasActiveSubscription}
                cancelDate={cancelDate}
                activePlanId={activePlanId}
                changePlan={changePlan}
                checkout={createCheckout}
                onChangePlanClick={handleChangePlanClick}
                onCheckout={handleCheckout}
                isLoadingEstimate={pendingPlanId === selectedPlusPlan.id && estimateQuery.isLoading}
                isOnTeamPlan={isOnTeamPlan}
              />
            )}

            {/* Pro Plan Card */}
            {selectedProPlan && (
              <PlanCard
                plan={selectedProPlan}
                monthlyPlan={proMonthly}
                interval={proInterval}
                onIntervalChange={setProInterval}
                isCurrent={selectedProPlan.id === activePlanId && isSubscribed}
                hasActiveSubscription={hasActiveSubscription}
                cancelDate={cancelDate}
                activePlanId={activePlanId}
                changePlan={changePlan}
                checkout={createCheckout}
                onChangePlanClick={handleChangePlanClick}
                onCheckout={handleCheckout}
                isLoadingEstimate={pendingPlanId === selectedProPlan.id && estimateQuery.isLoading}
                isOnTeamPlan={isOnTeamPlan}
              />
            )}

            {/* Max Plan Card */}
            {selectedMaxPlan && (
              <PlanCard
                plan={selectedMaxPlan}
                monthlyPlan={maxMonthly}
                interval={maxInterval}
                onIntervalChange={setMaxInterval}
                isCurrent={selectedMaxPlan.id === activePlanId && isSubscribed}
                hasActiveSubscription={hasActiveSubscription}
                cancelDate={cancelDate}
                activePlanId={activePlanId}
                changePlan={changePlan}
                checkout={createCheckout}
                onChangePlanClick={handleChangePlanClick}
                onCheckout={handleCheckout}
                isLoadingEstimate={pendingPlanId === selectedMaxPlan.id && estimateQuery.isLoading}
                isOnTeamPlan={isOnTeamPlan}
              />
            )}
          </div>

          {proLifetime && (
            <div>
              <PlanCard
                plan={proLifetime}
                isCurrent={proLifetime.id === activePlanId && isSubscribed}
                hasActiveSubscription={hasActiveSubscription}
                cancelDate={cancelDate}
                activePlanId={activePlanId}
                changePlan={changePlan}
                checkout={createCheckout}
                onChangePlanClick={handleChangePlanClick}
                onCheckout={handleCheckout}
                isLoadingEstimate={pendingPlanId === proLifetime.id && estimateQuery.isLoading}
                isOnTeamPlan={isOnTeamPlan}
              />
            </div>
          )}
        </div>
      )}

      {/* Pro for Teams */}
      <Card
        className={cn(
          "border-border/80",
          isOnTeamPlan && "border-foreground ring-1 ring-foreground/10",
        )}
      >
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">{t("Pro for Teams")}</CardTitle>
              {isOnTeamPlan && (
                <Badge variant="secondary" className="text-xs">
                  {t("Current plan")}
                </Badge>
              )}
            </div>
            <CardDescription>
              {t("Give your whole team Pro-tier access with per-seat pricing.")}
            </CardDescription>
          </div>
          <Button asChild size="sm">
            <Link href="/settings/team">{t("Manage Team")}</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <PlanHighlights
            items={[
              t("Pro benefits for every team member"),
              t("Per-seat billing — pay only for active members"),
              t("Centralized billing and member management"),
            ]}
          />
        </CardContent>
      </Card>

      {/* Change Plan Dialog */}
      <AlertDialog open={isChangePlanOpen} onOpenChange={handleDialogOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Change plan?")}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p>
                  {t("You will switch to {plan}. Prorations apply.", {
                    plan: changeTarget ? getPlanIntervalLabel(changeTarget.id) : "",
                  })}
                </p>
                {estimateQuery.error ? (
                  <span className="block mt-2">{t("Unable to fetch estimate.")}</span>
                ) : (
                  <span className="block mt-2">
                    {t("Estimated charge: {amount}", {
                      amount: formatCurrencyMinor(
                        estimateQuery.data?.amountDue ?? 0,
                        estimateQuery.data?.currency,
                      ),
                    })}
                  </span>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-start space-x-2 py-4">
            <Checkbox
              id="agree-plan-change"
              checked={hasAgreed}
              onCheckedChange={(checked) => setHasAgreed(checked === true)}
              disabled={estimateQuery.error != null}
            />
            <Label htmlFor="agree-plan-change" className="text-sm leading-tight cursor-pointer">
              {t("I have reviewed the estimated charge and agree to the plan change.")}
            </Label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={changePlan.isPending}>{t("Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={
                changePlan.isPending || !changeTarget || estimateQuery.error != null || !hasAgreed
              }
              onClick={() =>
                changeTarget &&
                changePlan.mutate({
                  planId: changeTarget.id as IndividualPlanId,
                })
              }
            >
              {changePlan.isPending && <Spinner />}
              {t("Confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SettingsPageShell>
  );
}

export function BillingPage() {
  if (isBillingDisabled) {
    return <BillingDisabled />;
  }

  return <BillingPageContent />;
}

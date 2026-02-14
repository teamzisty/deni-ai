"use client";

import { Zap, Check, Users } from "lucide-react";
import Link from "next/link";
import { useExtracted } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { BillingPlanId, ClientPlan, IndividualPlanId } from "@/lib/billing";
import { isTeamPlan } from "@/lib/billing";
import { isBillingDisabled } from "@/lib/billing-config";
import { trpc } from "@/lib/trpc/react";
import { cn } from "@/lib/utils";
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
const usageResetFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
});

function useFormatPriceLabel() {
  const t = useExtracted();
  return (plan: ClientPlan) => {
    const mode = plan.mode ?? "subscription";
    if (!plan.amount || !plan.currency) {
      return t("Set price in Stripe");
    }

    const formatter = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: plan.currency.toUpperCase(),
      maximumFractionDigits: 0,
    });

    const base = formatter.format(plan.amount / 100);
    if (mode === "payment") {
      return t("{price} one-time", { price: base });
    }

    if (!plan.interval) {
      return base;
    }

    const interval =
      plan.intervalCount && plan.intervalCount > 1
        ? `${plan.intervalCount} ${plan.interval}s`
        : plan.interval;

    return t("{price}/{interval}", { price: base, interval });
  };
}

function formatCurrencyMinor(amountMinor: number, currency?: string | null) {
  const currencyCode = currency ? currency.toUpperCase() : "USD";
  const formatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
  });
  return formatter.format(amountMinor / 100);
}

type PlanCopy = {
  tagline: string;
  highlights: string[];
  badge?: string;
};

function usePlanCopy() {
  const t = useExtracted();
  return (planId: BillingPlanId): PlanCopy => {
    switch (planId) {
      case "plus_monthly":
        return {
          tagline: t("Get unbelievable usage limits"),
          highlights: [
            t("Get 4x usage for basic models"),
            t("Get 10x usage for premium models"),
            t("With priority support"),
            t("Deni AI Code - Plus access"),
            t("For trying Deni AI"),
          ],
        };
      case "plus_yearly":
        return {
          tagline: t("Incredible deal"),
          highlights: [
            t("Get 4x usage for basic models"),
            t("Get 10x usage for premium models"),
            t("With priority support"),
            t("Deni AI Code - Plus access"),
            t("Most cost-effective"),
          ],
        };
      case "pro_monthly":
        return {
          tagline: t("Great deals even for power users"),
          highlights: [
            t("Get 10x usage for basic models"),
            t("Get 20x usage for premium models"),
            t("Max Mode pay-per-use available"),
            t("Deni AI Code - Pro access"),
            t("For power users"),
          ],
        };
      case "pro_yearly":
        return {
          tagline: t("You like us, and we like you too!"),
          highlights: [
            t("Get 10x usage for basic models"),
            t("Get 20x usage for premium models"),
            t("Max Mode pay-per-use available"),
            t("Deni AI Code - Pro access"),
            t("For power users"),
          ],
        };
      default:
        return {
          tagline: "",
          highlights: [],
        };
    }
  };
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
    return "";
  };
}

function PlanCard({
  plan,
  interval,
  onIntervalChange,
  isCurrent,
  hasActiveSubscription,
  cancelDate,
  activePlanId,
  checkout,
  changePlan,
  onChangePlanClick,
  isLoadingEstimate,
  isOnTeamPlan,
}: {
  plan: ClientPlan;
  interval: "monthly" | "yearly";
  onIntervalChange: (interval: "monthly" | "yearly") => void;
  isCurrent: boolean;
  hasActiveSubscription: boolean;
  cancelDate: number | false;
  activePlanId: string | undefined;
  checkout: {
    isPending: boolean;
    variables?: { planId: IndividualPlanId };
    mutate: (data: { planId: IndividualPlanId }) => void;
  };
  changePlan: { isPending: boolean; variables?: { planId: IndividualPlanId } };
  onChangePlanClick: (plan: ClientPlan) => void;
  isLoadingEstimate: boolean;
  isOnTeamPlan?: boolean;
}) {
  const t = useExtracted();
  const getPlanCopy = usePlanCopy();
  const formatPriceLabel = useFormatPriceLabel();
  const planCopy = getPlanCopy(plan.id);
  const mode = plan.mode ?? "subscription";
  const canChange = hasActiveSubscription && !cancelDate && !isCurrent && mode === "subscription";
  const isBlockedByCancel = Number.isInteger(cancelDate) && Boolean(activePlanId) && !isCurrent;
  const processing =
    (checkout.isPending && checkout.variables?.planId === plan.id) ||
    (changePlan.isPending && changePlan.variables?.planId === plan.id);
  const isLoadingThisPlan = isLoadingEstimate;

  const tierName = plan.id.startsWith("pro_") ? t("Pro") : t("Plus");

  return (
    <Card
      className={cn("flex flex-col", isCurrent && "border-foreground ring-1 ring-foreground/10")}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-semibold">{tierName}</CardTitle>
              {planCopy.badge && (
                <Badge variant="secondary" className="text-xs">
                  {planCopy.badge}
                </Badge>
              )}
            </div>
            <CardDescription className="text-sm">{planCopy.tagline}</CardDescription>
          </div>
          <Tabs value={interval} onValueChange={(v) => onIntervalChange(v as "monthly" | "yearly")}>
            <TabsList className="h-8 rounded-lg">
              <TabsTrigger value="monthly" className="text-xs px-3 h-6 rounded-md">
                {t("Monthly")}
              </TabsTrigger>
              <TabsTrigger value="yearly" className="text-xs px-3 h-6 rounded-md">
                {t("Yearly")}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col pt-0">
        <div className="flex-1">
          <div className="text-2xl font-semibold tracking-tight">{formatPriceLabel(plan)}</div>
          {planCopy.highlights.length > 0 && (
            <ul className="mt-5 space-y-2.5">
              {planCopy.highlights.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm">
                  <Check className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Button
          className="mt-6 w-full font-medium"
          variant={isCurrent ? "secondary" : "default"}
          disabled={
            isCurrent || processing || isBlockedByCancel || isLoadingThisPlan || isOnTeamPlan
          }
          onClick={() => {
            if (canChange) {
              onChangePlanClick(plan);
            } else {
              checkout.mutate({ planId: plan.id as IndividualPlanId });
            }
          }}
        >
          {(processing || isLoadingThisPlan) && <Spinner className="w-4 h-4" />}
          {isOnTeamPlan
            ? t("Team plan active")
            : isCurrent
              ? t("Current plan")
              : isBlockedByCancel
                ? t("Resume to change")
                : canChange
                  ? t("Change plan")
                  : t("Subscribe")}
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
  if (!item) return null;

  // When Max Mode is enabled, show as unlimited
  if (maxModeEnabled) {
    const periodEndLabel = item.periodEnd
      ? usageResetFormatter.format(new Date(item.periodEnd))
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
    ? usageResetFormatter.format(new Date(item.periodEnd))
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
    <div className="mx-auto flex max-w-4xl w-full flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">{t("Billing")}</h1>
        <p className="text-muted-foreground text-sm">
          {t("Billing is disabled for this environment.")}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("Billing unavailable")}</CardTitle>
          <CardDescription>
            {t("Plans, checkout, and billing management are turned off.")}
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

function BillingPageContent() {
  const t = useExtracted();
  const getPlanIntervalLabel = usePlanIntervalLabel();
  const [isChangePlanOpen, setIsChangePlanOpen] = useState(false);
  const [changeTarget, setChangeTarget] = useState<ClientPlan | null>(null);
  const [plusInterval, setPlusInterval] = useState<"monthly" | "yearly">("monthly");
  const [proInterval, setProInterval] = useState<"monthly" | "yearly">("monthly");
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

  const checkout = trpc.billing.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      toast.error(t("Stripe did not return a checkout URL."));
    },
    onError: (error) => toast.error(error.message),
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

  const selectedPlusPlan = plusInterval === "monthly" ? plusMonthly : plusYearly;
  const selectedProPlan = proInterval === "monthly" ? proMonthly : proYearly;
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
    <div className="mx-auto flex max-w-4xl w-full flex-col gap-6">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">{t("Billing")}</h1>
        <p className="text-muted-foreground text-sm">{t("Manage your subscription and usage")}</p>
      </div>

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
                      tier: activePlanId?.startsWith("pro_") ? t("Pro") : t("Plus"),
                      name: getPlanIntervalLabel(currentPlan.id),
                    })
                  : t("Free")}{" "}
              {cancelDate && (
                <span className="text-destructive">
                  {t("(Cancels {date})", {
                    date: new Date(cancelDate * 1000).toLocaleDateString(undefined, {
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
                  date: new Intl.DateTimeFormat(undefined, {
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
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Plus Plan Card */}
          {selectedPlusPlan && (
            <PlanCard
              plan={selectedPlusPlan}
              interval={plusInterval}
              onIntervalChange={setPlusInterval}
              isCurrent={selectedPlusPlan.id === activePlanId && isSubscribed}
              hasActiveSubscription={hasActiveSubscription}
              cancelDate={cancelDate}
              activePlanId={activePlanId}
              checkout={checkout}
              changePlan={changePlan}
              onChangePlanClick={handleChangePlanClick}
              isLoadingEstimate={pendingPlanId === selectedPlusPlan.id && estimateQuery.isLoading}
              isOnTeamPlan={isOnTeamPlan}
            />
          )}

          {/* Pro Plan Card */}
          {selectedProPlan && (
            <PlanCard
              plan={selectedProPlan}
              interval={proInterval}
              onIntervalChange={setProInterval}
              isCurrent={selectedProPlan.id === activePlanId && isSubscribed}
              hasActiveSubscription={hasActiveSubscription}
              cancelDate={cancelDate}
              activePlanId={activePlanId}
              checkout={checkout}
              changePlan={changePlan}
              onChangePlanClick={handleChangePlanClick}
              isLoadingEstimate={pendingPlanId === selectedProPlan.id && estimateQuery.isLoading}
              isOnTeamPlan={isOnTeamPlan}
            />
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
          <ul className="space-y-2">
            {[
              t("Pro benefits for every team member"),
              t("Per-seat billing — pay only for active members"),
              t("Centralized billing and member management"),
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm">
                <Check className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
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
                changeTarget && changePlan.mutate({ planId: changeTarget.id as IndividualPlanId })
              }
            >
              {changePlan.isPending && <Spinner />}
              {t("Confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function BillingPage() {
  if (isBillingDisabled) {
    return <BillingDisabled />;
  }

  return <BillingPageContent />;
}

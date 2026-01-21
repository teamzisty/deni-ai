"use client";

import { useExtracted } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { BillingPlanId, ClientPlan } from "@/lib/billing";
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
import { Progress } from "../ui/progress";
import { Spinner } from "../ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";

const ACTIVE_STATUSES = new Set(["active", "trialing", "paid"]);
const usageResetFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

function formatPriceLabel(plan: ClientPlan) {
  const t = useExtracted();

  const mode = plan.mode ?? "subscription";
  if (!plan.amount || !plan.currency) {
    return t("Set price in Stripe");
  }

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: plan.currency.toUpperCase(),
    maximumFractionDigits: 0,
  });

  const base = formatter.format(plan.amount);
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
}

function formatCurrencyMinor(amountMinor: number, currency?: string | null) {
  const currencyCode = currency ? currency.toUpperCase() : "USD";
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
  });
  return formatter.format(amountMinor);
}

type PlanCopy = {
  tagline: string;
  highlights: string[];
  badge?: string;
};

function getPlanCopy(planId: BillingPlanId): PlanCopy {
  const t = useExtracted();

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
          t("Get 10x usage for basic model"),
          t("Get 20x usage for premium models"),
          t("Usage-based billing (coming soon)"),
          t("Deni AI Code - Pro access"),
          t("For power users"),
        ],
      };
    case "pro_yearly":
      return {
        tagline: t("You like us, and we like you too!"),
        highlights: [
          t("Get 10x usage for basic model"),
          t("Get 20x usage for premium models"),
          t("Usage-based billing (coming soon)"),
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
}

function getPlanIntervalLabel(planId: BillingPlanId, t: ReturnType<typeof useExtracted>) {
  if (planId.endsWith("_monthly")) {
    return t("Monthly");
  }
  if (planId.endsWith("_yearly")) {
    return t("Yearly");
  }
  return "";
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
  setChangeTarget,
  setIsChangePlanOpen,
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
    variables?: { planId: BillingPlanId };
    mutate: (data: { planId: BillingPlanId }) => void;
  };
  changePlan: { isPending: boolean; variables?: { planId: BillingPlanId } };
  setChangeTarget: (plan: ClientPlan) => void;
  setIsChangePlanOpen: (open: boolean) => void;
}) {
  const t = useExtracted();
  const planCopy = getPlanCopy(plan.id);
  const mode = plan.mode ?? "subscription";
  const canChange = hasActiveSubscription && !cancelDate && !isCurrent && mode === "subscription";
  const isBlockedByCancel = Number.isInteger(cancelDate) && Boolean(activePlanId) && !isCurrent;
  const processing =
    (checkout.isPending && checkout.variables?.planId === plan.id) ||
    (changePlan.isPending && changePlan.variables?.planId === plan.id);

  const tierName = plan.id.startsWith("pro_") ? t("Pro") : t("Plus");

  return (
    <Card className={cn("flex flex-col border-border/80", isCurrent && "border-primary")}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle>{tierName}</CardTitle>
              {planCopy.badge && (
                <Badge variant="secondary" className="text-xs">
                  {planCopy.badge}
                </Badge>
              )}
            </div>
            <CardDescription>{planCopy.tagline}</CardDescription>
          </div>
          <Tabs value={interval} onValueChange={(v) => onIntervalChange(v as "monthly" | "yearly")}>
            <TabsList className="h-7">
              <TabsTrigger value="monthly" className="text-xs px-2 h-5">
                {t("Monthly")}
              </TabsTrigger>
              <TabsTrigger value="yearly" className="text-xs px-2 h-5">
                {t("Yearly")}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <div className="flex-1">
          <div className="text-2xl font-semibold">{formatPriceLabel(plan)}</div>
          {planCopy.highlights.length > 0 && (
            <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
              {planCopy.highlights.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-foreground/40" />
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
        <Button
          className="mt-4 w-full"
          variant={isCurrent ? "secondary" : "default"}
          disabled={isCurrent || processing || isBlockedByCancel}
          onClick={() => {
            if (canChange) {
              setChangeTarget(plan);
              setIsChangePlanOpen(true);
            } else {
              checkout.mutate({ planId: plan.id });
            }
          }}
        >
          {processing && <Spinner />}
          {isCurrent
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

function PlanChangeEstimate({ planId, enabled }: { planId: BillingPlanId; enabled: boolean }) {
  const t = useExtracted();
  const planChangeQuote = trpc.billing.estimatePlanChange.useQuery(
    { planId },
    {
      enabled,
      refetchOnWindowFocus: false,
      retry: false,
    },
  );

  if (!enabled) {
    return null;
  }

  if (planChangeQuote.isLoading) {
    return <span className="block mt-2">{t("Fetching estimate...")}</span>;
  }

  if (planChangeQuote.error) {
    return <span className="block mt-2">{t("Unable to fetch estimate.")}</span>;
  }

  return (
    <span className="block mt-2">
      {t("Estimated charge: {amount}", {
        amount: formatCurrencyMinor(
          planChangeQuote.data?.amountDue ?? 0,
          planChangeQuote.data?.currency,
        ),
      })}
    </span>
  );
}

type UsageItem = {
  category: "basic" | "premium";
  limit: number | null;
  used: number;
  remaining: number | null;
  periodEnd: Date | string | null;
};

function UsageRow({ label, item }: { label: string; item: UsageItem | undefined }) {
  const t = useExtracted();
  if (!item) return null;

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
        <p className="text-muted-foreground">{t("Billing is disabled for this environment.")}</p>
      </div>
      <Card className="border-border/80">
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
  const [isChangePlanOpen, setIsChangePlanOpen] = useState(false);
  const [changeTarget, setChangeTarget] = useState<ClientPlan | null>(null);
  const [plusInterval, setPlusInterval] = useState<"monthly" | "yearly">("monthly");
  const [proInterval, setProInterval] = useState<"monthly" | "yearly">("monthly");

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

  const statusLabel = statusQuery.data?.status ?? "inactive";
  const rawPlanId = (statusQuery.data?.planId as BillingPlanId) ?? undefined;
  const activePlanId = statusLabel !== "active" ? undefined : rawPlanId;
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
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">{t("Billing")}</h1>
        <p className="text-muted-foreground">{t("Manage your subscription and usage.")}</p>
      </div>

      {/* Current Plan */}
      <Card className="border-border/80">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle>{t("Current Plan")}</CardTitle>
            <CardDescription>
              {currentPlan
                ? t("{tier} {name}", {
                    tier: activePlanId?.startsWith("pro_") ? t("Pro") : t("Plus"),
                    name: getPlanIntervalLabel(currentPlan.id, t),
                  })
                : t("Free")}{" "}
              {cancelDate && (
                <span className="text-destructive">
                  {t("(Cancels {date})", {
                    date: new Date(cancelDate * 1000).toLocaleDateString("en-US", {
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
              <span className="text-xs text-muted-foreground">
                {t("Renews {date}", {
                  date: new Intl.DateTimeFormat("en-US", {
                    month: "short",
                    day: "numeric",
                  }).format(new Date(statusQuery.data.currentPeriodEnd)),
                })}
              </span>
            )}
            {statusQuery.data?.stripeCustomerId && (
              <Button
                variant="outline"
                size="sm"
                disabled={portal.isPending}
                onClick={() => portal.mutate()}
              >
                {portal.isPending && <Spinner />}
                {t("Manage")}
              </Button>
            )}
            {hasActiveSubscription && !cancelDate && (
              <Button
                variant="ghost"
                size="sm"
                disabled={cancel.isPending}
                onClick={() => cancel.mutate()}
              >
                {cancel.isPending && <Spinner />}
                {t("Cancel")}
              </Button>
            )}
            {cancelDate && (
              <Button size="sm" disabled={resume.isPending} onClick={() => resume.mutate()}>
                {resume.isPending && <Spinner />}
                {t("Resume")}
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Usage */}
      <Card className="border-border/80">
        <CardHeader>
          <CardTitle>{t("Usage")}</CardTitle>
          <CardDescription>{t("Tier: {tier}", { tier: usageTierLabel })}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {usageQuery.isLoading ? (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          ) : usageQuery.error ? (
            <p className="text-sm text-destructive">{usageQuery.error.message}</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              <UsageRow label={t("Basic models")} item={basicUsage} />
              <UsageRow label={t("Premium models")} item={premiumUsage} />
            </div>
          )}
        </CardContent>
      </Card>

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
              setChangeTarget={setChangeTarget}
              setIsChangePlanOpen={setIsChangePlanOpen}
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
              setChangeTarget={setChangeTarget}
              setIsChangePlanOpen={setIsChangePlanOpen}
            />
          )}
        </div>
      )}

      {/* Change Plan Dialog */}
      <AlertDialog open={isChangePlanOpen} onOpenChange={(v) => setIsChangePlanOpen(v)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Change plan?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("You will switch to {plan}. Prorations apply.", {
                plan: changeTarget ? getPlanIntervalLabel(changeTarget.id, t) : "",
              })}
              <PlanChangeEstimate
                planId={changeTarget?.id ?? "plus_monthly"}
                enabled={Boolean(changeTarget?.id)}
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={changePlan.isPending}>{t("Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={changePlan.isPending || !changeTarget}
              onClick={() => changeTarget && changePlan.mutate({ planId: changeTarget.id })}
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

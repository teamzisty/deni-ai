"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { BillingPlanId, ClientPlan } from "@/lib/billing";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Progress } from "../ui/progress";
import { Spinner } from "../ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";

const ACTIVE_STATUSES = new Set(["active", "trialing", "paid"]);

function formatPriceLabel(plan: ClientPlan) {
  const mode = plan.mode ?? "subscription";
  if (!plan.amount || !plan.currency) {
    return "Set price in Stripe";
  }

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: plan.currency.toUpperCase(),
    maximumFractionDigits: 0,
  });

  const base = formatter.format(plan.amount);
  if (mode === "payment") {
    return `${base} one-time`;
  }

  if (!plan.interval) {
    return base;
  }

  const interval =
    plan.intervalCount && plan.intervalCount > 1
      ? `${plan.intervalCount} ${plan.interval}s`
      : plan.interval;

  return `${base}/${interval}`;
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
  const mode = plan.mode ?? "subscription";
  const canChange =
    hasActiveSubscription &&
    !cancelDate &&
    !isCurrent &&
    mode === "subscription";
  const isBlockedByCancel =
    Number.isInteger(cancelDate) && Boolean(activePlanId) && !isCurrent;
  const processing =
    (checkout.isPending && checkout.variables?.planId === plan.id) ||
    (changePlan.isPending && changePlan.variables?.planId === plan.id);

  const tierName = plan.id.startsWith("max_") ? "Max" : "Pro";

  return (
    <Card
      className={cn(
        "flex flex-col border-border/80",
        isCurrent && "border-primary",
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle>{tierName}</CardTitle>
              {plan.badge && (
                <Badge variant="secondary" className="text-xs">
                  {plan.badge}
                </Badge>
              )}
            </div>
            <CardDescription>{plan.tagline}</CardDescription>
          </div>
          <Tabs
            value={interval}
            onValueChange={(v) => onIntervalChange(v as "monthly" | "yearly")}
          >
            <TabsList className="h-7">
              <TabsTrigger value="monthly" className="text-xs px-2 h-5">
                Monthly
              </TabsTrigger>
              <TabsTrigger value="yearly" className="text-xs px-2 h-5">
                Yearly
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <div className="flex-1">
          <div className="text-2xl font-semibold">{formatPriceLabel(plan)}</div>
          {plan.highlights && plan.highlights.length > 0 && (
            <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
              {plan.highlights.map((item) => (
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
          {processing && <Spinner className="mr-2" />}
          {isCurrent
            ? "Current plan"
            : isBlockedByCancel
              ? "Resume to change"
              : canChange
                ? "Change plan"
                : "Subscribe"}
        </Button>
      </CardContent>
    </Card>
  );
}

export function BillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const hasConfirmed = useRef(false);
  const [isChangePlanOpen, setIsChangePlanOpen] = useState(false);
  const [changeTarget, setChangeTarget] = useState<ClientPlan | null>(null);
  const [proInterval, setProInterval] = useState<"monthly" | "yearly">(
    "monthly",
  );
  const [maxInterval, setMaxInterval] = useState<"monthly" | "yearly">(
    "monthly",
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

  const checkout = trpc.billing.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      toast.error("Stripe did not return a checkout URL.");
    },
    onError: (error) => toast.error(error.message),
  });

  const portal = trpc.billing.createPortalSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      toast.error("Stripe did not return a billing portal URL.");
    },
    onError: (error) => toast.error(error.message),
  });

  const confirmCheckout = trpc.billing.confirmCheckout.useMutation({
    onSuccess: async () => {
      toast.success("Billing updated.");
      await utils.billing.status.invalidate();
      router.replace("/settings/billing");
    },
    onError: (error) => toast.error(error.message),
  });

  const changePlan = trpc.billing.changePlan.useMutation({
    onSuccess: async () => {
      toast.success("Plan updated.");
      await utils.billing.status.invalidate();
      await utils.billing.usage.invalidate();
    },
    onError: (error) => toast.error(error.message),
    onSettled: () => setChangeTarget(null),
  });

  const cancel = trpc.billing.cancelSubscription.useMutation({
    onSuccess: async () => {
      toast.success("Subscription will end at period end.");
      await utils.billing.status.invalidate();
      await utils.billing.usage.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const resume = trpc.billing.resumeSubscription.useMutation({
    onSuccess: async () => {
      toast.success("Subscription resumed.");
      await utils.billing.status.invalidate();
      await utils.billing.usage.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  useEffect(() => {
    if (sessionId && !hasConfirmed.current && !confirmCheckout.isPending) {
      hasConfirmed.current = true;
      confirmCheckout.mutate({ sessionId });
    }
  }, [confirmCheckout, sessionId]);

  const statusLabel = statusQuery.data?.status ?? "inactive";
  const rawPlanId = (statusQuery.data?.planId as BillingPlanId) ?? undefined;
  const activePlanId = statusLabel !== "active" ? undefined : rawPlanId;
  const usage = usageQuery.data?.usage ?? [];
  const usageTier = usageQuery.data?.tier ?? "free";

  const planMap = useMemo(
    () =>
      new Map((plansQuery.data?.plans ?? []).map((plan) => [plan.id, plan])),
    [plansQuery.data?.plans],
  );

  const currentPlan = activePlanId ? planMap.get(activePlanId) : undefined;
  const isSubscribed = ACTIVE_STATUSES.has(statusLabel);
  const isSubscription = statusQuery.data?.mode === "subscription";
  const hasActiveSubscription = isSubscribed && isSubscription;
  const cancelDate = isSubscription
    ? (statusQuery.data?.cancelAt ?? false)
    : false;

  const loading = statusQuery.isLoading || plansQuery.isLoading;
  const errored = statusQuery.error ?? plansQuery.error;

  const allPlans = plansQuery.data?.plans ?? [];

  const proMonthly = allPlans.find((p) => p.id === "pro_monthly");
  const proYearly = allPlans.find((p) => p.id === "pro_yearly");
  const maxMonthly = allPlans.find((p) => p.id === "max_monthly");
  const maxYearly = allPlans.find((p) => p.id === "max_yearly");

  const selectedProPlan = proInterval === "monthly" ? proMonthly : proYearly;
  const selectedMaxPlan = maxInterval === "monthly" ? maxMonthly : maxYearly;

  const planChangeQuote = trpc.billing.estimatePlanChange.useQuery(
    { planId: changeTarget?.id ?? "pro_monthly" },
    {
      enabled: Boolean(changeTarget?.id),
      refetchOnWindowFocus: false,
      retry: false,
    },
  );

  const renderUsageRow = (label: string, category: "basic" | "premium") => {
    const item = usage.find((entry) => entry.category === category);
    if (!item) return null;

    const limitLabel =
      item.limit === null ? "Unlimited" : item.limit.toLocaleString();
    const progress =
      item.limit === null || item.limit === 0
        ? 0
        : Math.min((item.used / item.limit) * 100, 100);

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
          <span>
            {item.limit === null
              ? "Unlimited"
              : `${Math.max(item.remaining ?? 0, 0).toLocaleString()} remaining`}
          </span>
          {item.periodEnd && (
            <span>
              Resets{" "}
              {new Intl.DateTimeFormat("en-US", {
                month: "short",
                day: "numeric",
              }).format(new Date(item.periodEnd))}
            </span>
          )}
        </div>
      </div>
    );
  };

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
        <h1 className="text-3xl font-semibold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription and usage.
        </p>
      </div>

      {/* Current Plan */}
      <Card className="border-border/80">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>
              {currentPlan
                ? `${activePlanId?.startsWith("max_") ? "Max" : "Pro"} ${currentPlan.name}`
                : "Free"}{" "}
              {cancelDate && (
                <span className="text-destructive">
                  (Cancels{" "}
                  {new Date(cancelDate * 1000).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                  )
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {statusQuery.data?.currentPeriodEnd && !cancelDate && (
              <span className="text-xs text-muted-foreground">
                Renews{" "}
                {new Intl.DateTimeFormat("en-US", {
                  month: "short",
                  day: "numeric",
                }).format(new Date(statusQuery.data.currentPeriodEnd))}
              </span>
            )}
            {statusQuery.data?.stripeCustomerId && (
              <Button
                variant="outline"
                size="sm"
                disabled={portal.isPending}
                onClick={() => portal.mutate()}
              >
                {portal.isPending && <Spinner className="mr-2" />}
                Manage
              </Button>
            )}
            {hasActiveSubscription && !cancelDate && (
              <Button
                variant="ghost"
                size="sm"
                disabled={cancel.isPending}
                onClick={() => cancel.mutate()}
              >
                {cancel.isPending && <Spinner className="mr-2" />}
                Cancel
              </Button>
            )}
            {cancelDate && (
              <Button
                size="sm"
                disabled={resume.isPending}
                onClick={() => resume.mutate()}
              >
                {resume.isPending && <Spinner className="mr-2" />}
                Resume
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Usage */}
      <Card className="border-border/80">
        <CardHeader>
          <CardTitle>Usage</CardTitle>
          <CardDescription>
            Tier: {usageTier.charAt(0).toUpperCase() + usageTier.slice(1)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {usageQuery.isLoading ? (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          ) : usageQuery.error ? (
            <p className="text-sm text-destructive">
              {usageQuery.error.message}
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {renderUsageRow("Basic models", "basic")}
              {renderUsageRow("Premium models", "premium")}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plans */}
      {errored ? (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{errored.message}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
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

          {/* Max Plan Card */}
          {selectedMaxPlan && (
            <PlanCard
              plan={selectedMaxPlan}
              interval={maxInterval}
              onIntervalChange={setMaxInterval}
              isCurrent={selectedMaxPlan.id === activePlanId && isSubscribed}
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
      <AlertDialog
        open={isChangePlanOpen}
        onOpenChange={(v) => setIsChangePlanOpen(v)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change plan?</AlertDialogTitle>
            <AlertDialogDescription>
              You will switch to {changeTarget?.name}. Prorations apply.
              {planChangeQuote.isLoading ? (
                <span className="block mt-2">Fetching estimate...</span>
              ) : planChangeQuote.error ? (
                <span className="block mt-2">Unable to fetch estimate.</span>
              ) : (
                <span className="block mt-2">
                  Estimated charge:{" "}
                  {formatCurrencyMinor(
                    planChangeQuote.data?.amountDue ?? 0,
                    planChangeQuote.data?.currency,
                  )}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={changePlan.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={changePlan.isPending || !changeTarget}
              onClick={() =>
                changeTarget && changePlan.mutate({ planId: changeTarget.id })
              }
            >
              {changePlan.isPending && <Spinner className="mr-2" />}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

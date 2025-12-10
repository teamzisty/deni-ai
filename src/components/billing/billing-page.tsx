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
import { Separator } from "../ui/separator";
import { Spinner } from "../ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

const ACTIVE_STATUSES = new Set(["active", "trialing", "paid"]);

function formatPriceLabel(plan: ClientPlan) {
  if (!plan.amount || !plan.currency) {
    return "Set price in Stripe";
  }

  const amount = plan.amount;
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: plan.currency.toUpperCase(),
    maximumFractionDigits: 0,
  });

  const base = formatter.format(amount);
  if (plan.mode === "payment") {
    return `${base} one-time`;
  }

  if (!plan.interval) {
    return base;
  }

  const interval =
    plan.intervalCount && plan.intervalCount > 1
      ? `${plan.intervalCount} ${plan.interval}s`
      : plan.interval;

  return `${base} / ${interval}`;
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

export function BillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const hasConfirmed = useRef(false);
  const [isChangePlanOpen, setIsChangePlanOpen] = useState(false);
  const [changeTarget, setChangeTarget] = useState<ClientPlan | null>(null);

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
  console.log(statusQuery.data);
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
  const isLifetime =
    isSubscribed &&
    activePlanId === "max-lifetime" &&
    statusQuery.data?.mode === "payment";
  const hasActiveSubscription = isSubscribed && isSubscription;
  const cancelDate = isSubscription && statusQuery.data?.cancelAt;

  const loading = statusQuery.isLoading || plansQuery.isLoading;
  const errored = statusQuery.error ?? plansQuery.error;

  const proPlans = useMemo(
    () =>
      (plansQuery.data?.plans ?? []).filter((plan) =>
        plan.id.startsWith("pro-"),
      ),
    [plansQuery.data?.plans],
  );

  const maxPlans = useMemo(
    () =>
      (plansQuery.data?.plans ?? []).filter((plan) =>
        plan.id.startsWith("max-"),
      ),
    [plansQuery.data?.plans],
  );

  const tabValue =
    activePlanId && activePlanId.startsWith("max-") ? "max" : "pro";

  const planChangeQuote = trpc.billing.estimatePlanChange.useQuery(
    { planId: changeTarget?.id ?? "pro-monthly" },
    {
      enabled: Boolean(changeTarget?.id),
      refetchOnWindowFocus: false,
      retry: false,
    },
  );

  const renderPlanCard = (plan: ClientPlan | undefined) => {
    if (!plan) return;
    const isCurrent = plan.id === activePlanId && isSubscribed;
    const isChanging =
      changePlan.isPending && changePlan.variables?.planId === plan.id;
    const processing =
      (checkout.isPending && checkout.variables?.planId === plan.id) ||
      isChanging;
    const highlights = plan.highlights ?? [];
    const canChangeInPortal =
      hasActiveSubscription &&
      !cancelDate &&
      !isCurrent &&
      plan.mode === "subscription";
    const isBlockedByLifetime = isLifetime && plan.id !== "max-lifetime";
    const isBlockedByCancel =
      Number.isInteger(cancelDate) && Boolean(activePlanId) && !isCurrent;

    return (
      <Card
        key={plan.id}
        className={cn(
          "flex h-full flex-col border-foreground/10",
          isCurrent && "border-primary shadow-lg shadow-primary/10",
        )}
      >
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-xl">{plan.name}</CardTitle>
            {plan.badge ? <Badge>{plan.badge}</Badge> : null}
          </div>
          <CardDescription>{plan.tagline}</CardDescription>
          <div className="text-2xl font-semibold">{formatPriceLabel(plan)}</div>
        </CardHeader>
        <CardContent className="flex grow flex-col justify-between gap-6">
          <ul className="space-y-2 text-sm text-muted-foreground">
            {highlights.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {item}
              </li>
            ))}
          </ul>
          <Button
            disabled={
              isCurrent ||
              processing ||
              isBlockedByLifetime ||
              isBlockedByCancel
            }
            onClick={() => {
              if (isBlockedByLifetime) {
                toast.error(
                  "Lifetime plan is active. No additional plans available.",
                );
                return;
              }
              if (isBlockedByCancel) {
                toast.error("Resume your subscription to change plans.");
                return;
              }
              if (canChangeInPortal) {
                setChangeTarget(plan);
                setIsChangePlanOpen(true);
              } else {
                checkout.mutate({ planId: plan.id });
              }
            }}
          >
            {processing ? <Spinner /> : null}
            {isCurrent
              ? "Current plan"
              : isBlockedByLifetime
                ? "Lifetime active"
                : isBlockedByCancel
                  ? "Resume to change"
                  : canChangeInPortal
                    ? "Change plan"
                    : plan.mode === "payment"
                      ? "Purchase lifetime"
                      : "Subscribe"}
          </Button>
        </CardContent>
      </Card>
    );
  };

  const renderUsageRow = (label: string, category: "basic" | "premium") => {
    const item = usage.find((entry) => entry.category === category);
    if (!item) return null;

    const limitLabel =
      item.limit === null ? "Unlimited" : `${item.limit.toLocaleString()}`;
    const progress =
      item.limit === null || item.limit === 0
        ? 0
        : Math.min((item.used / item.limit) * 100, 100);

    return (
      <div className="flex flex-col gap-2 rounded-lg border border-foreground/10 p-3">
        <div className="flex items-center justify-between text-sm font-medium">
          <span>{label}</span>
          <span className="text-muted-foreground">
            {item.used.toLocaleString()} / {limitLabel}
          </span>
        </div>
        <Progress value={progress} />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {item.limit === null
              ? "Unlimited usage"
              : `${Math.max(item.remaining ?? 0, 0).toLocaleString()} left`}
          </span>
          {item.periodEnd ? (
            <span>
              Resets on{" "}
              {new Intl.DateTimeFormat("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }).format(new Date(item.periodEnd))}
            </span>
          ) : null}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Spinner fontSize={20} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Badge variant="outline">Billing</Badge>
        <h1 className="text-3xl font-bold tracking-tight">
          Choose your Deni AI plan
        </h1>
        <p className="text-muted-foreground">
          Pick the plan that matches your pace.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-1.5">
            <CardTitle>Current plan {cancelDate && "(Canceled)"}</CardTitle>
            <CardDescription>
              {currentPlan
                ? `${currentPlan.id.split("-")[0][0].toUpperCase() + currentPlan.id.split("-")[0].slice(1)} - ${currentPlan.name}`
                : "Not subscribed"}
              {cancelDate &&
                ` - Cancel at ${new Date(cancelDate * 1000).toLocaleDateString()}`}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {statusQuery.data?.currentPeriodEnd ? (
              <span className="text-sm text-muted-foreground">
                Renews on{" "}
                {new Intl.DateTimeFormat("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }).format(new Date(statusQuery.data.currentPeriodEnd))}
              </span>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              disabled={portal.isPending || !statusQuery.data?.stripeCustomerId}
              onClick={() => portal.mutate()}
            >
              {portal.isPending ? <Spinner /> : null}
              Manage billing
            </Button>
            {hasActiveSubscription && !cancelDate ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                disabled={cancel.isPending}
                onClick={() => cancel.mutate()}
              >
                {cancel.isPending ? <Spinner /> : null}
                Cancel at period end
              </Button>
            ) : null}
            {cancelDate ? (
              <Button
                variant="default"
                size="sm"
                disabled={resume.isPending}
                onClick={() => resume.mutate()}
              >
                {resume.isPending ? <Spinner /> : null}
                Resume subscription
              </Button>
            ) : null}
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-1.5">
            <CardTitle>Usage</CardTitle>
            <CardDescription>
              Current tier:{" "}
              {usageTier.charAt(0).toUpperCase() + usageTier.slice(1)}
            </CardDescription>
          </div>
          <Badge variant="secondary">
            {usageQuery.isLoading ? "Loading..." : statusLabel}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {usageQuery.isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Spinner />
              Fetching usage...
            </div>
          ) : usageQuery.error ? (
            <div className="text-sm text-destructive">
              {usageQuery.error.message}
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {renderUsageRow("Basic models", "basic")}
              {renderUsageRow("Premium models", "premium")}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Spinner />
          Loading billing details...
        </div>
      ) : errored ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader>
            <CardTitle>Billing setup required</CardTitle>
            <CardDescription>{errored.message}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Tabs defaultValue={tabValue}>
          <TabsList className="mb-4 mx-auto">
            <TabsTrigger className="w-32" value="pro">
              Pro
            </TabsTrigger>
            <TabsTrigger className="w-32" value="max">
              Max
            </TabsTrigger>
          </TabsList>
          <TabsContent value="pro">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {proPlans.map((plan) => renderPlanCard(plan))}
            </div>
          </TabsContent>
          <TabsContent value="max">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {maxPlans.map((plan) => renderPlanCard(plan))}
            </div>
          </TabsContent>
        </Tabs>
      )}

      <AlertDialog
        open={isChangePlanOpen}
        onOpenChange={(v) => setIsChangePlanOpen(v)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change plan?</AlertDialogTitle>
            <AlertDialogDescription className="flex flex-col">
              You will switch to {changeTarget?.name}. Prorations apply per
              Stripe.
              <span className="mt-2 text-sm text-foreground">
                {planChangeQuote.isLoading ? (
                  "Fetching estimate..."
                ) : planChangeQuote.error ? (
                  "Unable to fetch estimate. You'll see the exact amount before confirming in Stripe."
                ) : (
                  <>
                    Estimated immediate charge:{" "}
                    {formatCurrencyMinor(
                      planChangeQuote.data?.amountDue ?? 0,
                      planChangeQuote.data?.currency,
                    )}
                  </>
                )}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={changePlan.isPending}>
              Keep current
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={changePlan.isPending || !changeTarget}
              onClick={() =>
                changeTarget && changePlan.mutate({ planId: changeTarget.id })
              }
            >
              {changePlan.isPending ? <Spinner /> : null}
              Confirm change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

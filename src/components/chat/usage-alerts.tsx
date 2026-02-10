"use client";

import { ArrowUpRight, Ban, Plug, TriangleAlert, Zap } from "lucide-react";
import Link from "next/link";
import { useExtracted } from "next-intl";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

interface UsageAlertsProps {
  isAnonymous: boolean;
  isByokActive: boolean;
  isByokMissingConfig: boolean;
  isUsageLow: boolean;
  isUsageBlocked: boolean;
  canEnableMaxMode: boolean;
  remainingUsage: number | null | undefined;
  usageCategoryLabel: string;
  usageTierLabel: string;
  billingDisabled: boolean;
  enableMaxMode: { mutate: () => void; isPending: boolean };
  onRefreshUsage: () => void;
}

export function UsageAlerts({
  isAnonymous,
  isByokActive,
  isByokMissingConfig,
  isUsageLow,
  isUsageBlocked,
  canEnableMaxMode,
  remainingUsage,
  usageCategoryLabel,
  usageTierLabel,
  billingDisabled,
  enableMaxMode,
  onRefreshUsage,
}: UsageAlertsProps) {
  const t = useExtracted();

  return (
    <>
      {isByokMissingConfig && (
        <Alert className="mt-3 border-destructive/40 bg-destructive/10 text-destructive-foreground dark:border-destructive/30">
          <Ban className="mt-0.5 size-4" />
          <AlertTitle>{t("Endpoint not configured")}</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <p>
              {t("Configure an OpenAI-compatible base URL and API key before using this model.")}
            </p>
            {!isAnonymous && (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" asChild>
                  <Link href="/settings/providers">
                    {t("Open settings")}
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                </Button>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {isByokActive && !isByokMissingConfig && (
        <Alert className="mt-3 border-emerald-500/40 bg-emerald-100/40 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-50">
          <Plug className="mt-0.5 size-4" />
          <AlertTitle>{t("BYOK active")}</AlertTitle>
          <AlertDescription>
            {t("Requests use your own API key and do not count toward usage limits.")}
          </AlertDescription>
        </Alert>
      )}

      {(isUsageLow || isUsageBlocked) && (
        <Alert
          className={cn(
            "mt-3 border-amber-500/50 bg-amber-100/40 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-50",
            isUsageBlocked &&
              !canEnableMaxMode &&
              "border-destructive/40 bg-destructive/10 text-destructive-foreground dark:border-destructive/30",
            canEnableMaxMode &&
              "border-blue-500/50 bg-blue-100/40 text-blue-900 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-50",
          )}
        >
          {canEnableMaxMode ? (
            <Zap className="mt-0.5 size-4" />
          ) : isUsageBlocked ? (
            <Ban className="mt-0.5 size-4" />
          ) : (
            <TriangleAlert className="mt-0.5 size-4" />
          )}
          <AlertTitle>
            {canEnableMaxMode
              ? t("Enable Max Mode to continue")
              : isUsageBlocked
                ? t("Usage limit reached")
                : t("You are running low")}
          </AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <p>
              {canEnableMaxMode
                ? t(
                    "You've reached your limit. Enable Max Mode to continue with pay-per-use pricing.",
                  )
                : isUsageBlocked
                  ? t("You've hit the {category} usage limit on your {tier} plan.", {
                      category: usageCategoryLabel,
                      tier: usageTierLabel,
                    })
                  : remainingUsage === null || remainingUsage === undefined
                    ? t("Only a few {category} requests left on your {tier} plan.", {
                        category: usageCategoryLabel,
                        tier: usageTierLabel,
                      })
                    : t(
                        "Only {count, plural, one {#} other {#}} {category} requests left on your {tier} plan.",
                        {
                          count: remainingUsage,
                          category: usageCategoryLabel,
                          tier: usageTierLabel,
                        },
                      )}
            </p>
            <div className="flex flex-wrap gap-2">
              {canEnableMaxMode && (
                <Button
                  size="sm"
                  onClick={() => enableMaxMode.mutate()}
                  disabled={enableMaxMode.isPending}
                >
                  {enableMaxMode.isPending && <Spinner />}
                  <Zap className="size-3.5" />
                  {t("Enable Max Mode")}
                </Button>
              )}
              {!isAnonymous && !billingDisabled && !canEnableMaxMode && (
                <Button size="sm" asChild>
                  <Link href="/settings/billing">
                    {t("Upgrade plan")}
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onRefreshUsage}>
                {t("Refresh usage")}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}

"use client";

import { InfoIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useExtracted } from "next-intl";
import type React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isBillingDisabled } from "@/lib/billing-config";
import { trpc } from "@/lib/trpc/react";
import { cn } from "@/lib/utils";
import { Progress } from "./ui/progress";

export default function SettingsWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useExtracted();
  const pathname = usePathname();
  const billingDisabled = isBillingDisabled;
  const statusQuery = trpc.billing.status.useQuery(undefined, {
    enabled: !billingDisabled,
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });
  const usageQuery = trpc.billing.usage.useQuery(undefined, {
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  if (usageQuery.isLoading || (!billingDisabled && statusQuery.isLoading)) {
    return <Spinner />;
  }

  const status = statusQuery.data;
  const usage = usageQuery.data;
  const usages = usage?.usage;

  const plan =
    status?.planId
      ?.split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ") || "";

  const settingsTabs = [
    {
      label: t("Appearance"),
      value: "appearance",
      href: "/settings/appearance",
    },
    {
      label: t("Providers"),
      value: "providers",
      href: "/settings/providers",
    },
    {
      label: t("Billing"),
      value: "billing",
      href: "/settings/billing",
    },
    {
      label: t("Sharing"),
      value: "sharing",
      href: "/settings/sharing",
    },
    {
      label: t("Migration"),
      value: "migration",
      href: "/settings/migration",
    },
  ].filter((tab) => !billingDisabled || tab.value !== "billing");

  // Determine current tab value based on pathname
  const currentTab =
    settingsTabs.find((tab) => pathname?.startsWith(tab.href))?.value ||
    settingsTabs[0].value;

  return (
    <div className="flex gap-2 mx-auto w-full space-y-6 pb-12 pt-4">
      <div className="flex flex-col gap-2 w-full h-full max-w-xs shrink-0">
        {!billingDisabled && (
          <Card className="border-muted-foreground/10 bg-muted/60 shadow-none">
            <CardContent>
              <div className="flex flex-col gap-1">
                <span className="font-medium text-muted-foreground">
                  {t("Your Plan")}
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-base font-semibold">{plan}</span>
                  <span className="text-xs text-muted-foreground">
                    {t("Next update: {date}", {
                      date: status?.currentPeriodEnd
                        ? new Intl.DateTimeFormat("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }).format(new Date(status.currentPeriodEnd))
                        : "—",
                    })}
                  </span>
                </div>

                {/* <span className="block text-xs font-medium">
                  <InfoIcon
                    size="16"
                    className="-mt-0.5 mr-1 inline-flex size-3 shrink-0"
                  />
                  Successfully sent messages are counted as one each. There is no
                  consumption per re-request, such as tool calls.
                </span> */}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-muted-foreground/10 bg-muted/60 shadow-none">
          <CardContent>
            <div className="flex flex-col gap-1">
              <span className="font-medium text-muted-foreground">
                {t("Usage")}
              </span>
              <span className="text-sm">
                {t("Resets on {date}", {
                  date: new Intl.DateTimeFormat("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }).format(new Date(usages?.[0]?.periodEnd || Date.now())),
                })}
              </span>
              {usages?.map((usage) => (
                <div key={usage.category} className="space-y-2 text-sm py-1">
                  <div className="flex items-center justify-between">
                    <span className="capitalize">
                      {usage.category === "basic" ? t("Basic") : t("Premium")}
                    </span>
                    {usage.limit !== null ? (
                      <span className="tabular-nums text-muted-foreground">
                        {Math.max(usage.used ?? 0, 0).toLocaleString()} /{" "}
                        {Math.max(usage.limit ?? 0, 0).toLocaleString()}
                      </span>
                    ) : (
                      <span className="tabular-nums text-muted-foreground">
                        {t("{used} / Unlimited", {
                          used: Math.max(
                            usage.used ?? 0,
                            0,
                          ).toLocaleString(),
                        })}
                      </span>
                    )}
                  </div>
                  <Progress value={usage.used || 0} max={usage.limit || 0} />
                  <span className="text-sm">
                    {t("{count} left", {
                      count: Math.max(
                        usage.remaining ?? 0,
                        0,
                      ).toLocaleString(),
                    })}
                  </span>
                </div>
              ))}

              <span className="block text-xs font-medium">
                <InfoIcon
                  size="16"
                  className="-mt-0.5 mr-1 inline-flex size-3 shrink-0"
                />
                {t(
                  "Successfully sent messages are counted as one each. There is no consumption per re-request, such as tool calls.",
                )}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
      <Tabs value={currentTab} className="w-full">
        <div className="flex items-center justify-between mb-2">
          <TabsList>
            {settingsTabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                asChild
                className={cn("capitalize")}
              >
                <Link href={tab.href}>{tab.label}</Link>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <Card>
          <CardContent className="pt-6 pb-4">{children}</CardContent>
        </Card>
      </Tabs>
    </div>
  );
}

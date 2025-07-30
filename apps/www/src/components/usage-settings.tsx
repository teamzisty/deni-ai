"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useTranslations } from "@/hooks/use-translations";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Progress } from "@workspace/ui/components/progress";
import { Badge } from "@workspace/ui/components/badge";
import { Zap, BarChart3, Eye, Crown, Check } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { models } from "@/lib/constants";

export default function UsageSettings() {
  const { usage } = useAuth();
  const t = useTranslations("settings.usage");
  const [visibleUsage, setVisibleUsage] = useState(usage || []);
  const [premiumOnly, setPremiumOnly] = useState(false);
  const [showUsed, setShowUsed] = useState(false);

  const toggleShowUsed = () => {
    if (!usage) return;

    const newShowUsed = !showUsed;
    setShowUsed(newShowUsed);

    let filteredUsage = usage;

    if (newShowUsed) {
      filteredUsage = filteredUsage.filter((u) => u.count > 0);
    }

    if (premiumOnly) {
      filteredUsage = filteredUsage.filter((u) => u.premium);
    }

    setVisibleUsage(filteredUsage);
  };

  const togglePremiumOnly = () => {
    if (!usage) return;

    const newPremiumOnly = !premiumOnly;
    setPremiumOnly(newPremiumOnly);

    let filteredUsage = usage;

    if (showUsed) {
      filteredUsage = filteredUsage.filter((u) => u.count > 0);
    }

    if (newPremiumOnly) {
      filteredUsage = filteredUsage.filter((u) => u.premium);
    }

    setVisibleUsage(filteredUsage);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {t("title")}
          </CardTitle>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={toggleShowUsed}>
              {showUsed ? <Check /> : <Eye />}
              {t("showUsedOnly")}
            </Button>

            <Button size="sm" onClick={togglePremiumOnly}>
              {premiumOnly ? <Check /> : <Crown />}
              {t("premiumOnly")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {visibleUsage?.map((modelUsage) => (
              <div key={modelUsage.model} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {models[modelUsage.model]?.name}
                    </span>
                    {modelUsage.premium && (
                      <Badge variant="secondary" className="text-xs">
                        <Zap className="h-3 w-3 mr-1" />
                        {t("premium")}
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {modelUsage.limit === -1 ? (
                      <span>{t("unlimited")}</span>
                    ) : (
                      <span>
                        {modelUsage.count} / {modelUsage.limit}
                      </span>
                    )}
                  </div>
                </div>
                {modelUsage.limit > 0 && (
                  <div className="space-y-1">
                    <Progress
                      value={(modelUsage.count / modelUsage.limit) * 100}
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>
                        {t("used")}: {modelUsage.count}
                      </span>
                      <span>
                        {t("remaining")}: {modelUsage.remaining}
                      </span>
                    </div>
                  </div>
                )}
                {!modelUsage.canUse && (
                  <div className="text-sm text-destructive">
                    {t("usageLimitExceeded")}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

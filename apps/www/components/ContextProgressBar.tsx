"use client";

import React, { memo } from "react";
import { Progress } from "@workspace/ui/components/progress";
import { useTranslations } from "next-intl";
import { calculateContextUsage, formatTokenCount } from "@/utils/tokenCounter";
import { cn } from "@workspace/ui/lib/utils";
import { EasyTip } from "./easytip";

interface ContextProgressBarProps {
  messages: any[];
  maxContextWindow?: number;
  className?: string;
}

const ContextProgressBar = memo(
  ({
    messages,
    maxContextWindow = 128000, // Default fallback
    className,
  }: ContextProgressBarProps) => {
    const t = useTranslations();

    const { totalTokens, percentage, isNearLimit } = calculateContextUsage(
      messages,
      maxContextWindow
    );

    // Don't show if no messages or context window is not defined
    if (!messages.length || !maxContextWindow) {
      return null;
    }

    const getProgressColor = () => {
      if (percentage >= 90) return "bg-red-500";
      if (percentage >= 80) return "bg-amber-500";
      return "bg-blue-500";
    };
    const tooltipContent = (
      <div className="text-xs">
        <div className="font-medium mb-1">
          {t("features.contextWindow.usage")}
        </div>
        <div>
          {t("features.contextWindow.used")}: {formatTokenCount(totalTokens)}{" "}
          {t("features.contextWindow.tokens")}
        </div>
        <div>
          {t("features.contextWindow.max")}:{" "}
          {formatTokenCount(maxContextWindow)}{" "}
          {t("features.contextWindow.tokens")}
        </div>
        <div>
          {t("features.contextWindow.percentage")}: {percentage.toFixed(1)}%
        </div>
        {isNearLimit && (
          <div className="text-amber-400 mt-1">
            {t("features.contextWindow.nearLimit")}
          </div>
        )}
      </div>
    );

    return (
      <EasyTip content={tooltipContent}>
        <div className={cn("flex items-center gap-2 min-w-[100px]", className)}>
          <span
            className={cn(
              "text-xs font-mono min-w-[40px] text-right",
              isNearLimit ? "text-amber-500" : "text-muted-foreground"
            )}
          >
            {percentage.toFixed(0)}%
          </span>
          <div className="flex-1 min-w-[60px]">
            <Progress
              value={percentage}
              className={cn("h-2 bg-muted", isNearLimit && "animate-pulse")}
              indicatorClassName={getProgressColor()}
            />
          </div>
        </div>
      </EasyTip>
    );
  }
);

ContextProgressBar.displayName = "ContextProgressBar";

export default ContextProgressBar;

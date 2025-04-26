import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
  modelDescriptions,
  reasoningEffortType,
} from "@/lib/modelDescriptions";
import { ArrowDown, BrainCircuit, Zap, Brain } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { EasyTip } from "@/components/easytip";
import { memo, useCallback } from "react";
import { cn } from "@workspace/ui/lib/utils";
import { useTranslations } from "next-intl";

const ReasoningEffortItem = memo(
  ({
    effort,
    handleEffortChange,
  }: {
    effort: reasoningEffortType;
    handleEffortChange: (effort: reasoningEffortType) => void;
  }) => {
    const t = useTranslations();

    const getEffortDisplayName = (effort: reasoningEffortType): string => {
      switch (effort) {
        case "low":
          return t("reasoningEffort.low") || "Low";
        case "medium":
          return t("reasoningEffort.medium") || "Medium";
        case "high":
          return t("reasoningEffort.high") || "High";
        default:
          return effort;
      }
    };

    return (
      <DropdownMenuItem
        className="w-full cursor-pointer"
        onClick={() => handleEffortChange(effort)}
      >
        {effort === "low" && <Zap />}
        {effort === "medium" && <BrainCircuit />}
        {effort === "high" && <Brain />}
        <div className="flex items-center w-full justify-between">
          <span className="text-base">{getEffortDisplayName(effort)}</span>
          <div className="flex items-center gap-2">
            {effort === "low" && (
              <EasyTip content={t("reasoningEffort.lowTip") || "Fast but shallow reasoning"}>
                <Badge variant="secondary" className="p-1 flex gap-1">
                  <Zap size="16" />
                </Badge>
              </EasyTip>
            )}

            {effort === "medium" && (
              <EasyTip content={t("reasoningEffort.mediumTip") || "Balanced reasoning"}>
                <Badge className="p-1" variant="secondary">
                  <BrainCircuit size="16" />
                </Badge>
              </EasyTip>
            )}

            {effort === "high" && (
              <EasyTip content={t("reasoningEffort.highTip") || "Deep reasoning (takes more time)"}>
                <Badge className="p-1" variant="secondary">
                  <Brain size="16" />
                </Badge>
              </EasyTip>
            )}
          </div>
        </div>
      </DropdownMenuItem>
    );
  }
);
ReasoningEffortItem.displayName = "ReasoningEffortItem";

export const ReasoningEffortSelector = memo(function ReasoningEffortSelector({
  reasoningEffort,
  handleReasoningEffortChange,
  model,
  availableEfforts = ["low", "medium", "high"],
}: {
  reasoningEffort: reasoningEffortType;
  model: string;
  handleReasoningEffortChange: (effort: reasoningEffortType) => void;
  availableEfforts?: reasoningEffortType[];
}) {
  const t = useTranslations();
  
  if (!modelDescriptions[model]?.reasoningEffort) return null;

  const getEffortIcon = (effort: reasoningEffortType) => {
    switch (effort) {
      case "low":
        return <Zap />;
      case "medium":
        return <BrainCircuit />;
      case "high":
        return <Brain />;
      default:
        return <BrainCircuit />;
    }
  };

  const getEffortDisplayName = (effort: reasoningEffortType): string => {
    switch (effort) {
      case "low":
        return t("reasoningEffort.low") || "Low";
      case "medium":
        return t("reasoningEffort.medium") || "Medium";
      case "high":
        return t("reasoningEffort.high") || "High";
      default:
        return effort;
    }
  };

  const memoizedHandleEffortChange = useCallback(
    handleReasoningEffortChange,
    [handleReasoningEffortChange]
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="m-0" asChild>
        <Button variant="secondary" className={cn("p-2 rounded-full")}>
          {getEffortIcon(reasoningEffort)}
          <span className="inline-flex items-center justify-center">
            {getEffortDisplayName(reasoningEffort)}
          </span>
          <ArrowDown className="text-zinc-400 text-sm" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-64">
        <DropdownMenuLabel className="pb-0!">{t("reasoningEffort.label") || "Reasoning Effort"}</DropdownMenuLabel>
        <div className="ml-2">
          <span className="text-sm text-muted-foreground">
            {t("reasoningEffort.description") || "Choose the depth of thinking AI uses to solve problems"}
          </span>
        </div>
        <DropdownMenuGroup>
          {availableEfforts.map((effort) => (
            <ReasoningEffortItem
              key={effort}
              effort={effort}
              handleEffortChange={memoizedHandleEffortChange}
            />
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

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
import { memo, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";

const ReasoningEffortItem = memo(
  ({
    effort,
    handleEffortChange,
  }: {
    effort: reasoningEffortType;
    handleEffortChange: (effort: reasoningEffortType) => void;
  }) => {
    const getEffortDisplayName = (effort: reasoningEffortType): string => {
      switch (effort) {
        case "low":
          return "低";
        case "medium":
          return "中";
        case "high":
          return "高";
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
              <EasyTip content="高速だが浅い推論">
                <Badge variant="secondary" className="p-1 flex gap-1">
                  <Zap size="16" />
                </Badge>
              </EasyTip>
            )}

            {effort === "medium" && (
              <EasyTip content="バランスの取れた推論">
                <Badge className="p-1" variant="secondary">
                  <BrainCircuit size="16" />
                </Badge>
              </EasyTip>
            )}

            {effort === "high" && (
              <EasyTip content="深い推論（時間がかかる）">
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
        return "低";
      case "medium":
        return "中";
      case "high":
        return "高";
      default:
        return effort;
    }
  };

  const memoizedHandleEffortChange = useCallback(
    handleReasoningEffortChange,
    []
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
        <DropdownMenuLabel className="pb-0!">推論努力</DropdownMenuLabel>
        <div className="ml-2">
          <span className="text-sm text-muted-foreground">
            AIが問題解決に費やす思考の深さを選択します
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

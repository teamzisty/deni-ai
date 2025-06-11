import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";

interface EasyTipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const EasyTip = React.memo(
  ({ content, children, className }: EasyTipProps) => {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={className}>{children}</div>
        </TooltipTrigger>
        <TooltipContent>{content}</TooltipContent>
      </Tooltip>
    );
  },
);
EasyTip.displayName = "EasyTip";

import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EasyTipProps {
  content: React.ReactNode;
  children: React.ReactNode;
}

export const EasyTip = React.memo(({ content, children }: EasyTipProps) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div>{children}</div>
      </TooltipTrigger>
      <TooltipContent>{content}</TooltipContent>
    </Tooltip>
  );
});
EasyTip.displayName = "EasyTip";
import { Button } from "@workspace/ui/components/button";
import { Telescope } from "lucide-react";
import { memo } from "react";
import { useTranslations } from "next-intl";
import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
import { EasyTip } from "./easytip";
interface DeepResearchButtonProps {
  deepResearch: boolean;
  disabled: boolean;
  deepResearchToggle: () => void;
  devMode?: boolean;
}

export const DeepResearchButton = memo(
  ({ deepResearch, deepResearchToggle, disabled, devMode }: DeepResearchButtonProps) => {
    const t = useTranslations();
    const isMobile = useIsMobile();
    
    return (
      <EasyTip content={devMode ? t("chatInput.devNotAvailable") : t("chat.deepResearch.tooltip") || "Use Deep Research"}>
        <Button
          variant={deepResearch ? "default" : "outline"}
          disabled={devMode || disabled}
          className="rounded-full"
          size={isMobile ? "sm" : "default"}
          onClick={deepResearchToggle}
      >
        <Telescope />
        {t("chatInput.deepResearch")}
        </Button>
      </EasyTip>
    );
  }
);

DeepResearchButton.displayName = "DeepResearchButton";

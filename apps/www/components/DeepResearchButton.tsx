import { Button } from "@workspace/ui/components/button";
import { Telescope } from "lucide-react";
import { memo } from "react";
import { useTranslations } from "next-intl";
import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
interface DeepResearchButtonProps {
  deepResearch: boolean;
  disabled: boolean;
  deepResearchToggle: () => void;
}

export const DeepResearchButton = memo(
  ({ deepResearch, deepResearchToggle, disabled }: DeepResearchButtonProps) => {
    const t = useTranslations();
    const isMobile = useIsMobile();
    
    return (
      <Button
        variant={deepResearch ? "default" : "outline"}
        disabled={disabled}
        className="rounded-full"
        size={isMobile ? "sm" : "default"}
        onClick={deepResearchToggle}
      >
        <Telescope />
        {t("chatInput.deepResearch")}
      </Button>
    );
  }
);

DeepResearchButton.displayName = "DeepResearchButton";

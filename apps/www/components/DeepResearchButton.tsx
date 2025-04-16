import { Button } from "@repo/ui/components/button";
import { NotebookPen } from "lucide-react";
import { memo } from "react";
import { useTranslations } from "next-intl";

interface DeepResearchButtonProps {
  deepResearch: boolean;
  disabled: boolean;
  deepResearchToggle: () => void;
}

export const DeepResearchButton = memo(
  ({ deepResearch, deepResearchToggle, disabled }: DeepResearchButtonProps) => {
    const t = useTranslations();
    
    return (
      <Button
        variant={deepResearch ? "default" : "outline"}
        disabled={disabled}
        className="rounded-full"
        onClick={deepResearchToggle}
      >
        <NotebookPen />
        {t("chatInput.deepResearch")}
      </Button>
    );
  }
);

DeepResearchButton.displayName = "DeepResearchButton";

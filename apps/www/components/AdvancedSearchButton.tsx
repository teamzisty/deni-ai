import { Button } from "@repo/ui/components/button";
import { NotebookPen } from "lucide-react";
import { memo } from "react";
import { useTranslations } from "next-intl";

interface AdvancedSearchButtonProps {
  advancedSearch: boolean;
  disabled: boolean;
  advancedSearchToggle: () => void;
}

export const AdvancedSearchButton = memo(
  ({ advancedSearch, advancedSearchToggle, disabled }: AdvancedSearchButtonProps) => {
    const t = useTranslations();
    
    return (
      <Button
        variant={advancedSearch ? "default" : "outline"}
        disabled={disabled}
        className="rounded-full"
        onClick={advancedSearchToggle}
      >
        <NotebookPen />
        {t("chatInput.advancedSearch")}
      </Button>
    );
  }
);

AdvancedSearchButton.displayName = "AdvancedSearchButton";

import { Button } from "@/components/ui/button";
import { NotebookPen } from "lucide-react";
import { memo } from "react";

interface AdvancedSearchButtonProps {
  advancedSearch: boolean;
  disabled: boolean;
  advancedSearchToggle: () => void;
}

export const AdvancedSearchButton = memo(
  ({ advancedSearch, advancedSearchToggle, disabled }: AdvancedSearchButtonProps) => {
    return (
      <Button
        variant={advancedSearch ? "default" : "outline"}
        disabled={disabled}
        className="rounded-full"
        onClick={advancedSearchToggle}
      >
        <NotebookPen />
        詳細な検索
      </Button>
    );
  }
);

AdvancedSearchButton.displayName = "AdvancedSearchButton";

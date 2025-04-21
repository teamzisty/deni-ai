import { Button } from "@workspace/ui/components/button";
import { Search } from "lucide-react";
import { memo } from "react";
import { useTranslations } from "next-intl";
import { useIsMobile } from "@workspace/ui/hooks/use-mobile";

interface SearchButtonProps {
  searchEnabled: boolean;
  disabled: boolean;
  searchToggle: () => void;
}

export const SearchButton = memo(
  ({ searchEnabled, searchToggle, disabled }: SearchButtonProps) => {
    const t = useTranslations();
    const isMobile = useIsMobile();
    
    return (
      <Button
        variant={searchEnabled ? "default" : "outline"}
        size={isMobile ? "sm" : "default"}
        disabled={disabled}
        className="rounded-full"
        onClick={searchToggle}
      >
        <Search />
        {t("chatInput.search")}
      </Button>
    );
  }
);

SearchButton.displayName = "SearchButton";

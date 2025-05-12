import { Button } from "@workspace/ui/components/button";
import { Search } from "lucide-react";
import { memo } from "react";
import { useTranslations } from "next-intl";
import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
import { EasyTip } from "./easytip";

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
      <EasyTip content={t("chatInput.search")}>
        <Button
          variant={searchEnabled ? "default" : "outline"}
          size={isMobile ? "sm" : "default"}
          disabled={disabled}
          className="rounded-full"
          onClick={searchToggle}
        >
          <Search />
          {!isMobile && t("chatInput.search")}
        </Button>
      </EasyTip>
    );
  }
);

SearchButton.displayName = "SearchButton";

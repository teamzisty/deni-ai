import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { memo } from "react";

interface SearchButtonProps {
  searchEnabled: boolean;
  disabled: boolean;
  searchToggle: () => void;
}

export const SearchButton = memo(
  ({ searchEnabled, searchToggle, disabled }: SearchButtonProps) => {
    return (
      <Button
        variant={searchEnabled ? "default" : "outline"}
        disabled={disabled}
        className="rounded-full"
        onClick={searchToggle}
      >
        <Search />
        検索
      </Button>
    );
  }
);

SearchButton.displayName = "SearchButton";

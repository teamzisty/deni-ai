import { Plus } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import { memo } from "react";
import { EasyTip } from "@/components/easytip";
import { useTranslations } from "next-intl";
import { Button } from "@workspace/ui/components/button";

interface ImageAddButtonProps {
  modelSupportsVision: boolean;
  onClick: () => void;
}

export const ImageAddButton = memo(
  ({ modelSupportsVision, onClick }: ImageAddButtonProps) => {
    const t = useTranslations();
    
    return (
      <EasyTip content={t("chatInput.imageAdd")}>
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "rounded-full",
            !modelSupportsVision && "opacity-50 pointer-events-none"
          )}
          onClick={onClick}
        >
          <Plus />
        </Button>
      </EasyTip>
    );
  }
);

ImageAddButton.displayName = "ImageAddButton";

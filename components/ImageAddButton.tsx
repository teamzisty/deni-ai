import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { memo } from "react";
import { EasyTip } from "@/components/easytip";

interface ImageAddButtonProps {
  modelSupportsVision: boolean;
  onClick: () => void;
}

export const ImageAddButton = memo(
  ({ modelSupportsVision, onClick }: ImageAddButtonProps) => {
    return (
      <EasyTip content="画像を追加">
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

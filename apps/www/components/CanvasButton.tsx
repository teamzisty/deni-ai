"use client";

import { Paintbrush } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { EasyTip } from "@/components/easytip";
import { useTranslations } from "next-intl";
import { memo } from "react";

interface CanvasButtonProps {
  disabled: boolean;
  canvasEnabled: boolean;
  canvasToggle: () => void;
}

const CanvasButton = memo(
  ({ disabled, canvasEnabled, canvasToggle }: CanvasButtonProps) => {
    const t = useTranslations();
    
    return (
      <EasyTip content={t("canvas.tooltip") || "Use Canvas"}>
        <Button
          variant={canvasEnabled ? "default" : "secondary"}
          size="sm"
          className="h-7 px-2"
          onClick={canvasToggle}
          disabled={disabled}
        >
          <Paintbrush size={16} />
        </Button>
      </EasyTip>
    );
  }
);

CanvasButton.displayName = "CanvasButton";

export default CanvasButton; 
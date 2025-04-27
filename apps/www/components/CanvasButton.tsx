"use client";

import { Paintbrush } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { EasyTip } from "@/components/easytip";
import { useTranslations } from "next-intl";
import { memo } from "react";

interface CanvasButtonProps {
  disabled: boolean;
  canvasEnabled: boolean;
  devMode?: boolean;
  canvasToggle: () => void;
}

const CanvasButton = memo(
  ({ disabled, canvasEnabled, canvasToggle, devMode }: CanvasButtonProps) => {
    const t = useTranslations();
    
    return (
      <EasyTip content={devMode ? t("chatInput.devNotAvailable") : t("canvas.tooltip") || "Use Canvas"}>
        <Button
          variant={canvasEnabled ? "default" : "outline"}
          className="rounded-full"
          onClick={canvasToggle}
          disabled={devMode || disabled}
        >
          <Paintbrush />
        </Button>
      </EasyTip>
    );
  }
);

CanvasButton.displayName = "CanvasButton";

export default CanvasButton; 
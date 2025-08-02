"use client";

import { useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { Check, Clipboard } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";

interface MessageControlsProps {
  text: string;
}

export function MessageControls({ text }: MessageControlsProps) {
  const t = useTranslations();
  const [isCopied, setIsCopied] = useState(false);

  const onCopy = () => {
    if (isCopied) return;
    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    });
  };

  return (
    <div className="flex items-center gap-1">
      <Button onClick={onCopy} size="icon" variant="ghost" className="h-8 w-8">
        {isCopied ? (
          <Check className="h-4 w-4" />
        ) : (
          <Clipboard className="h-4 w-4" />
        )}
        <span className="sr-only">{t("chat.message.copy")}</span>
      </Button>
    </div>
  );
}

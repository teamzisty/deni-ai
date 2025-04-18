import { Button } from "@workspace/ui/components/button";
import { SendHorizonal, StopCircle } from "lucide-react";
import { memo } from "react";
import { useTranslations } from "next-intl";
import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
import { cn } from "@workspace/ui/lib/utils";

interface InputBoxProps {
  input: string;
  stop: () => void;
  generating: boolean;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSendMessage: (e: React.MouseEvent<HTMLButtonElement>) => void;
  handleSendMessageKey: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  handleImagePaste: (e: React.ClipboardEvent<HTMLDivElement>) => void;
  sendButtonRef?: React.RefObject<HTMLButtonElement | null>;
}

const InputBox: React.FC<InputBoxProps> = memo(
  ({
    input,
    stop,
    generating,
    handleInputChange,
    handleSendMessage,
    handleSendMessageKey,
    handleImagePaste,
    sendButtonRef,
  }) => {
    const t = useTranslations();
    const isMobile = useIsMobile();

    return (
      <div className={cn(
        "flex items-center", 
        isMobile ? "mb-1" : "mb-2"
      )} onPaste={handleImagePaste}>
        <div className="flex items-center w-full mb-2">
          <textarea
            value={input}
            onChange={handleInputChange}
            placeholder={t("inputBox.placeholder")}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                handleSendMessageKey(e);
              }
            }}
            className={cn(
              "w-full resize-none bg-transparent border-none shadow-none !outline-none focus:ring-0 focus:ring-offset-0 disabled:opacity-0",
              isMobile ? "px-2 py-1.5" : "px-3 py-2"
            )}
          />
          <Button
            aria-label={t("inputBox.send")}
            className={cn(
              isMobile ? "mr-2" : "mr-3"
            )}
            size={isMobile ? "sm" : "icon"}
            ref={sendButtonRef}
            onClick={(e) => (generating ? stop() : handleSendMessage(e))}
          >
            {generating ? 
              <StopCircle size={isMobile ? 18 : 24} /> : 
              <SendHorizonal size={isMobile ? 18 : 24} />
            }
          </Button>
        </div>
      </div>
    );
  }
);

InputBox.displayName = "InputBox";

export default InputBox;

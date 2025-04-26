import { Button } from "@workspace/ui/components/button";
import { SendHorizonal, StopCircle } from "lucide-react";
import { memo, useCallback } from "react";
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

    const handleButtonClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      if (generating) {
        stop();
      } else {
        handleSendMessage(e);
      }
    }, [generating, stop, handleSendMessage]);

    return (
      <div className="flex items-center mb-1 md:mb-2" onPaste={handleImagePaste}>
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
            className="w-full resize-none bg-transparent border-none shadow-none !outline-none focus:ring-0 focus:ring-offset-0 disabled:opacity-0 px-2 py-1.5 md:px-3 md:py-2 text-sm md:text-base"
          />
          <Button
            aria-label={t("inputBox.send")}
            className="mr-2 md:mr-3"
            size="icon"
            ref={sendButtonRef}
            onClick={handleButtonClick}
          >
            {generating ? 
              <StopCircle className="h-[18px] w-[18px] md:h-6 md:w-6" /> : 
              <SendHorizonal className="h-[18px] w-[18px] md:h-6 md:w-6" />
            }
          </Button>
        </div>
      </div>
    );
  }
);

InputBox.displayName = "InputBox";

export default InputBox;

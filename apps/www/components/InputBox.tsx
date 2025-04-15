import { Button } from "@workspace/ui/components/button";
import { SendHorizonal, StopCircle } from "lucide-react";
import { memo } from "react";
import { useTranslations } from "next-intl";

interface InputBoxProps {
  input: string;
  stop: () => void;
  generating: boolean;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSendMessage: (e: React.MouseEvent<HTMLButtonElement>) => void;
  handleSendMessageKey: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  handleImagePaste: (e: React.ClipboardEvent<HTMLDivElement>) => void;
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
  }) => {
    const t = useTranslations();

    return (
      <div className="flex items-center mb-2" onPaste={handleImagePaste}>
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
            className="w-full px-3 py-2 resize-none bg-transparent border-none shadow-none !outline-none focus:ring-0 focus:ring-offset-0 disabled:opacity-0"
          />
          <Button
            aria-label={t("inputBox.send")}
            className="mr-3"
            size="icon"
            onClick={(e) => (generating ? stop() : handleSendMessage(e))}
          >
            {generating ? <StopCircle /> : <SendHorizonal />}
          </Button>
        </div>
      </div>
    );
  }
);

InputBox.displayName = "InputBox";

export default InputBox;

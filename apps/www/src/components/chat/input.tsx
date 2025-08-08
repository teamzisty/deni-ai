"use client";

import { UIMessage, UseChatHelpers } from "@ai-sdk/react";
import { useState, memo, useCallback, useRef, useEffect } from "react";
import { InputActions } from "./input-components";
import { Button } from "@workspace/ui/components/button";
import { XIcon } from "lucide-react";
import { BRAND_NAME } from "@/lib/constants";
import { useTranslations } from "@/hooks/use-translations";
import { useIsMobile } from "@workspace/ui/hooks/use-mobile";

export const researchModeMapping = {
  disabled: "disabled",
  shallow: "shallow",
  deep: "deep",
  deeper: "deeper",
};

export const useResearchModeMappingIntl = () => {
  const t = useTranslations("chat.input");

  return {
    disabled: t("disabled"),
    shallow: t("shallow"),
    deep: t("deep"),
    deeper: t("deeper"),
  };
};

interface ChatInputProps {
  input: string;
  sendMessage: UseChatHelpers<UIMessage>["sendMessage"];
  setInput: (input: string) => void;
  thinkingEffort?: "disabled" | "minimal" | "low" | "medium" | "high";
  model?: string;
  canvas?: boolean;
  search?: boolean;
  researchMode?: "disabled" | "shallow" | "deep" | "deeper";
  image?: string | null;
  isUploading?: boolean;
  handleImageUpload?: (file: File) => void;
  setThinkingEffort?: (effort: "disabled" | "minimal" | "low" | "medium" | "high") => void;
  setModel?: (model: string) => void;
  setCanvas?: (canvas: boolean) => void;
  setSearch?: (search: boolean) => void;
  setResearchMode?: (mode: "disabled" | "shallow" | "deep" | "deeper") => void;
  setImage?: (image: string | null) => void;
}

const ChatInput = memo<ChatInputProps>(
  ({
    input,
    model = "gpt-5",
    canvas = false,
    search = false,
    researchMode = "disabled",
    thinkingEffort = "disabled",
    image = null,
    isUploading = false,
    handleImageUpload,
    sendMessage,
    setInput,
    setModel,
    setCanvas,
    setSearch,
    setResearchMode,
    setThinkingEffort,
    setImage,
  }) => {
    const [open, setOpen] = useState(false);
    const t = useTranslations("chat.input");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = useCallback(() => {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.style.height = "auto";
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    }, []);

    useEffect(() => {
      adjustHeight();
    }, [input, adjustHeight]);

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          sendMessage({
            text: input,
            files: image
              ? [
                  {
                    type: "file",
                    url: image,
                    filename: "image.png",
                    mediaType: "image/*",
                  },
                ]
              : undefined,
          });

          setInput("");

          if (setImage) {
            setImage(null); // Clear image after submission
          }
        }
      },
      [sendMessage, image, setImage, input],
    );

    const handlePaste = useCallback(
      (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const items = event.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item && item.type.indexOf("image") !== -1) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file && handleImageUpload) {
              handleImageUpload(file);
            }
            break;
          }
        }
      },
      [handleImageUpload],
    );

    return (
      <>
        {/* Chat Input */}
        <div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage({
                text: input,
                files: image
                  ? [
                      {
                        type: "file",
                        url: image,
                        filename: "image.png",
                        mediaType: "image/*",
                      },
                    ]
                  : undefined,
              });

              setInput("");

              if (setImage) {
                setImage(null); // Clear image after submission
              }
            }}
            className="w-full"
          >
            <div className="w-full rounded-2xl border p-4 space-y-4">
              {/* Image Viewer */}
              {image && (
                <div className="mb-4 relative w-fit">
                  <img
                    src={image}
                    alt="Uploaded"
                    className="rounded-lg max-w-24 max-h-24 w-24 h-24 object-cover mb-2"
                  />
                  <Button
                    type="button"
                    onClick={() => setImage && setImage(null)}
                    size={"icon"}
                    className="absolute -top-2 -right-2"
                  >
                    <XIcon />
                  </Button>
                </div>
              )}

              {/* Input Area */}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  adjustHeight();
                }}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder={t("placeholder", { brandName: BRAND_NAME })}
                className="flex-1 border-none outline-none resize-none w-full bg-transparent min-h-[24px] max-h-[100px] sm:max-h-[200px] overflow-y-auto"
                rows={1}
              />

              {/* Controls */}
              <div className="flex items-center w-full space-x-2">
                <InputActions
                  model={model}
                  setModel={setModel}
                  canvas={canvas}
                  setCanvas={setCanvas}
                  search={search}
                  setSearch={setSearch}
                  researchMode={researchMode}
                  setResearchMode={setResearchMode}
                  input={input}
                  thinkingEffort={thinkingEffort}
                  setThinkingEffort={setThinkingEffort}
                  handleImageUpload={handleImageUpload}
                  isUploading={isUploading}
                />
              </div>
            </div>
          </form>
        </div>
      </>
    );
  },
);

ChatInput.displayName = "ChatInput";

export default ChatInput;

"use client";

import { UseChatHelpers } from "@ai-sdk/react";
import { useState, memo, useCallback } from "react";
import { InputActions } from "./input-components";
import { Button } from "@workspace/ui/components/button";
import { XIcon } from "lucide-react";
import { BRAND_NAME } from "@/lib/constants";
import { useTranslations } from "@/hooks/use-translations";

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
  handleSubmit: UseChatHelpers["handleSubmit"];
  handleInputChange: UseChatHelpers["handleInputChange"];
  input: UseChatHelpers["input"];
  thinkingEffort?: "disabled" | "low" | "medium" | "high";
  model?: string;
  canvas?: boolean;
  search?: boolean;
  researchMode?: "disabled" | "shallow" | "deep" | "deeper";
  image?: string | null;
  isUploading?: boolean;
  handleImageUpload?: (file: File) => void;
  setThinkingEffort?: (effort: "disabled" | "low" | "medium" | "high") => void;
  setModel?: (model: string) => void;
  setCanvas?: (canvas: boolean) => void;
  setSearch?: (search: boolean) => void;
  setResearchMode?: (mode: "disabled" | "shallow" | "deep" | "deeper") => void;
  setImage?: (image: string | null) => void;
}

const ChatInput = memo<ChatInputProps>(
  ({
    input,
    model = "gpt-4o",
    canvas = false,
    search = false,
    researchMode = "disabled",
    thinkingEffort = "disabled",
    image = null,
    isUploading = false,
    handleImageUpload,
    handleSubmit,
    handleInputChange,
    setModel,
    setCanvas,
    setSearch,
    setResearchMode,
    setThinkingEffort,
    setImage,
  }) => {
    const [open, setOpen] = useState(false);
    const t = useTranslations("chat.input");

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          handleSubmit(event, {
            experimental_attachments: image
              ? [
                  {
                    name: "image",
                    contentType: "image/*",
                    url: image,
                  },
                ]
              : undefined,
          });

          if (setImage) {
            setImage(null); // Clear image after submission
          }
        }
      },
      [handleSubmit, image, setImage],
    );

    return (
      <>
        {/* Chat Input */}
        <div>
          <form
            onSubmit={(event) => {
              handleSubmit(event, {
                experimental_attachments: image
                  ? [
                      {
                        name: "image",
                        contentType: "image/*",
                        url: image,
                      },
                    ]
                  : undefined,
              });

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
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={t("placeholder", { brandName: BRAND_NAME })}
                className="flex-1 border-none outline-none resize-none w-full bg-transparent"
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

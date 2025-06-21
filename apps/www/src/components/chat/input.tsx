import { UseChatHelpers } from "@ai-sdk/react";
import { useState, memo, useCallback } from "react";
import { InputActions } from "./input-components";

export const researchModeMapping = {
  disabled: "Disabled",
  shallow: "Shallow",
  deep: "Deep",
  deeper: "Deeper",
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
  setThinkingEffort?: (effort: "disabled" | "low" | "medium" | "high") => void;
  setModel?: (model: string) => void;
  setCanvas?: (canvas: boolean) => void;
  setSearch?: (search: boolean) => void;
  setResearchMode?: (mode: "disabled" | "shallow" | "deep" | "deeper") => void;
}

const ChatInput = memo<ChatInputProps>(
  ({
    input,
    model = "gpt-4o",
    canvas = false,
    search = false,
    researchMode = "disabled",
    thinkingEffort = "disabled",
    handleSubmit,
    handleInputChange,
    setModel,
    setCanvas,
    setSearch,
    setResearchMode,
    setThinkingEffort,
  }) => {
    const [open, setOpen] = useState(false);

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          handleSubmit();
        }
      },
      [handleSubmit],
    );

    return (
      <>
        {/* Chat Input */}
        <div className="relative">
          <form onSubmit={handleSubmit} className="w-full">
            <div className="w-full rounded-2xl border p-4 space-y-4">
              <textarea
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask Deni AI anything..."
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
                  handleSubmit={handleSubmit}
                  input={input}
                  thinkingEffort={thinkingEffort}
                  setThinkingEffort={setThinkingEffort}
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

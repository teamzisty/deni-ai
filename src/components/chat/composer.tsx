"use client";

import { GlobeIcon } from "lucide-react";
import type { ReactNode } from "react";
import type {
  PromptInputMessage,
  PromptInputProps,
  PromptInputSubmitProps,
} from "@/components/ai-elements/prompt-input";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { cn } from "@/lib/utils";

export type ComposerMessage = PromptInputMessage;

type ComposerProps = Pick<PromptInputProps, "globalDrop" | "multiple"> & {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: (message: PromptInputMessage) => void;
  placeholder?: string;
  className?: string;
  headerClassName?: string;
  textareaClassName?: string;
  searchLabel?: ReactNode;
  webSearch?: boolean;
  onToggleWebSearch?: () => void;
  actionMenuItems?: ReactNode;
  status?: PromptInputSubmitProps["status"];
  tools?: ReactNode;
  isSubmitDisabled?: boolean;
};

export function Composer({
  value,
  onValueChange,
  onSubmit,
  placeholder,
  className,
  headerClassName,
  textareaClassName,
  searchLabel = "Search",
  webSearch = false,
  onToggleWebSearch,
  actionMenuItems,
  status,
  tools,
  isSubmitDisabled,
  globalDrop,
  multiple,
}: ComposerProps) {
  const disabled = isSubmitDisabled ?? (!value && !status);

  return (
    <PromptInput
      onSubmit={(message) => onSubmit(message)}
      className={className}
      globalDrop={globalDrop}
      multiple={multiple}
    >
      <PromptInputHeader className={cn(headerClassName)}>
        <PromptInputAttachments>
          {(attachment) => <PromptInputAttachment data={attachment} />}
        </PromptInputAttachments>
      </PromptInputHeader>
      <PromptInputBody>
        <PromptInputTextarea
          onChange={(event) => onValueChange(event.target.value)}
          value={value}
          placeholder={placeholder}
          className={textareaClassName}
        />
      </PromptInputBody>
      <PromptInputFooter>
        <PromptInputTools>
          <PromptInputActionMenu>
            <PromptInputActionMenuTrigger />
            <PromptInputActionMenuContent>
              <PromptInputActionAddAttachments />
              {actionMenuItems}
            </PromptInputActionMenuContent>
          </PromptInputActionMenu>
          {onToggleWebSearch ? (
            <PromptInputButton
              variant={webSearch ? "default" : "ghost"}
              onClick={onToggleWebSearch}
            >
              <GlobeIcon size={16} />
              {searchLabel}
            </PromptInputButton>
          ) : null}
          {tools}
        </PromptInputTools>
        <PromptInputSubmit disabled={disabled} status={status} />
      </PromptInputFooter>
    </PromptInput>
  );
}

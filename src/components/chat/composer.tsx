"use client";

import { GlobeIcon } from "lucide-react";
import { useExtracted } from "next-intl";
import type { ReactNode } from "react";
import {
  Attachment,
  AttachmentInfo,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from "@/components/ai-elements/attachments";
import { Spinner } from "@/components/ui/spinner";
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
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input";
import { cn } from "@/lib/utils";

export type ComposerMessage = PromptInputMessage;

function ComposerAttachments() {
  const attachments = usePromptInputAttachments();

  if (attachments.files.length === 0) {
    return null;
  }

  return (
    <Attachments variant="inline">
      {attachments.files.map((attachment) => (
        <Attachment
          data={attachment}
          key={attachment.id}
          onRemove={() => attachments.remove(attachment.id)}
        >
          <AttachmentPreview />
          <AttachmentInfo />
          {attachment.uploadStatus === "uploading" ? <Spinner className="size-3" /> : null}
          <AttachmentRemove />
        </Attachment>
      ))}
    </Attachments>
  );
}

type ComposerProps = Pick<PromptInputProps, "globalDrop" | "multiple"> & {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: (message: PromptInputMessage) => void;
  onStop?: () => void;
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
  onStop,
  placeholder,
  className,
  headerClassName,
  textareaClassName,
  searchLabel,
  webSearch = false,
  onToggleWebSearch,
  actionMenuItems,
  status,
  tools,
  isSubmitDisabled,
  globalDrop,
  multiple,
}: ComposerProps) {
  const t = useExtracted();
  const disabled = status === "streaming" ? false : (isSubmitDisabled ?? (!value && !status));
  const resolvedSearchLabel = searchLabel ?? t("Search");

  return (
    <PromptInput
      onSubmit={(message) => onSubmit(message)}
      className={className}
      globalDrop={globalDrop}
      multiple={multiple}
    >
      <PromptInputHeader className={cn(headerClassName)}>
        <ComposerAttachments />
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
              {resolvedSearchLabel}
            </PromptInputButton>
          ) : null}
          {tools}
        </PromptInputTools>
        <PromptInputSubmit disabled={disabled} status={status} onStop={onStop} />
      </PromptInputFooter>
    </PromptInput>
  );
}

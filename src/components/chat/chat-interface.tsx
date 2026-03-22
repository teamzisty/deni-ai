"use client";

import { useChat } from "@ai-sdk/react";
import { sendGAEvent } from "@next/third-parties/google";
import type { FileUIPart, UIMessage } from "ai";
import { DefaultChatTransport } from "ai";
import { FolderKanban } from "lucide-react";
import { useExtracted } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import {
  Attachment,
  AttachmentInfo,
  AttachmentPreview,
  Attachments,
} from "@/components/ai-elements/attachments";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Loader } from "@/components/ai-elements/loader";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { AdSenseSlot } from "@/components/adsense-slot";
import { AssistantMessage } from "@/components/chat/assistant-message";
import { ChatComposer, type ComposerMessage } from "@/components/chat/chat-composer";
import { UsageAlerts } from "@/components/chat/usage-alerts";
import { env } from "@/env";
import { useAvailableModels } from "@/hooks/use-available-models";
import { useInitialMessage } from "@/hooks/use-initial-message";
import { useUsageStatus } from "@/hooks/use-usage-status";
import { authClient } from "@/lib/auth-client";
import { isBillingDisabled } from "@/lib/billing-config";
import { GA_ID, getPreferredReasoningEffort, models, type ReasoningEffort } from "@/lib/constants";
import { trpc } from "@/lib/trpc/react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChatInterfaceProps {
  id: string;
  initialMessages?: UIMessage[];
  initialProjectId?: string | null;
  initialProjectName?: string | null;
}

type UploadableFileUIPart = FileUIPart & { file?: File };
type PendingMessageMetadata = {
  pending?: boolean;
  [key: string]: unknown;
};

function isFilePart(part: UIMessage["parts"][number]): part is FileUIPart {
  return part.type === "file";
}

function isTextPart(
  part: UIMessage["parts"][number],
): part is Extract<UIMessage["parts"][number], { type: "text"; text: string }> {
  return part.type === "text";
}

async function uploadAttachment(file: UploadableFileUIPart): Promise<FileUIPart> {
  if (!file.url || !file.file) {
    return file;
  }

  if (file.url.startsWith("https://") || file.url.startsWith("http://")) {
    return file;
  }

  const formData = new FormData();
  formData.set("file", file.file);

  const uploadResponse = await fetch("/api/upload-attachment", {
    method: "POST",
    body: formData,
  });

  if (!uploadResponse.ok) {
    throw new Error("Attachment upload failed.");
  }

  const payload = (await uploadResponse.json()) as { url?: string };
  if (!payload.url) {
    throw new Error("Attachment upload failed.");
  }

  return { ...file, url: payload.url };
}

async function normalizeAttachments(files?: UploadableFileUIPart[]) {
  if (!files?.length) {
    return undefined;
  }

  const normalized = await Promise.all(
    files.map(async (file) => {
      if (!file.url) {
        return file;
      }

      if (file.url.startsWith("https://") || file.url.startsWith("http://")) {
        return file;
      }

      return uploadAttachment(file);
    }),
  );

  return normalized;
}

function getMessageRenderKeys(messages: UIMessage[]) {
  const occurrences = new Map<string, number>();

  return messages.map((message, index) => {
    const baseKey =
      typeof message.id === "string" && message.id.trim().length > 0
        ? message.id.trim()
        : `message-${index}`;
    const duplicateCount = occurrences.get(baseKey) ?? 0;

    occurrences.set(baseKey, duplicateCount + 1);

    return duplicateCount === 0 ? baseKey : `${baseKey}-${duplicateCount}`;
  });
}

function isPendingMessage(message: UIMessage | undefined) {
  if (!message || message.role !== "assistant") {
    return false;
  }

  return Boolean((message.metadata as PendingMessageMetadata | undefined)?.pending);
}

export function ChatInterface({
  id,
  initialMessages = [],
  initialProjectId = null,
  initialProjectName = null,
}: ChatInterfaceProps) {
  const t = useExtracted();
  const session = authClient.useSession();
  const isAnonymous = Boolean(session.data?.user?.isAnonymous);
  const billingDisabled = isBillingDisabled;
  const [input, setInput] = useState("");
  const [model, setModel] = useState(models[0].value);
  const [webSearch, setWebSearch] = useState(false);
  const [videoMode, setVideoMode] = useState(false);
  const [imageMode, setImageMode] = useState(false);
  const [reasoningEffort, setReasoningEffort] = useState<ReasoningEffort>(
    getPreferredReasoningEffort(models[0].efforts),
  );
  const [deepResearch, setDeepResearch] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const utils = trpc.useUtils();
  const { availableModels, providerSettings, providerKeys } = useAvailableModels();
  const {
    usageQuery,
    selectedModel,
    usageTier,
    isByokActive,
    isByokMissingConfig,
    isUsageLow,
    isUsageBlocked,
    canEnableMaxMode,
    isSubmitBlocked,
    usageCategoryLabel,
    usageTierLabel,
    remainingUsage,
    usageUnitLabel,
    enableMaxMode,
  } = useUsageStatus({ model, availableModels, providerKeys, providerSettings });

  const requestBody = useMemo(
    () => ({
      model,
      webSearch,
      reasoningEffort,
      deepResearch,
      video: videoMode,
      image: imageMode,
      id,
    }),
    [deepResearch, id, model, reasoningEffort, videoMode, imageMode, webSearch],
  );
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        body: {
          id,
        },
      }),
    [id],
  );

  const { messages, sendMessage, regenerate, setMessages, status, error, stop } = useChat({
    id,
    messages: initialMessages,
    transport,
  });
  const showMessageActions = status !== "streaming" && status !== "submitted";
  const lastMessage = messages.at(-1);
  const isWaitingForResponse =
    status !== "streaming" && status !== "submitted" && isPendingMessage(lastMessage);
  const chatQuery = trpc.chat.getChat.useQuery(
    { id },
    {
      enabled: isWaitingForResponse,
      staleTime: 0,
      refetchOnMount: "always",
      refetchOnReconnect: true,
      refetchIntervalInBackground: true,
      refetchInterval: isWaitingForResponse ? 1000 : false,
    },
  );

  useInitialMessage({
    id,
    initialMessagesLength: initialMessages.length,
    model,
    sendMessage,
    setModel,
    setWebSearch,
    setVideoMode,
    setImageMode,
    setReasoningEffort,
    setDeepResearch,
    onMessageSent: () => utils.chat.getChats.invalidate(),
  });

  useEffect(() => {
    const chat = chatQuery.data?.[0];
    if (!chat?.messages) {
      return;
    }

    setMessages(chat.messages as UIMessage[]);
  }, [chatQuery.data, setMessages]);

  const handleSubmit = async (
    message: ComposerMessage,
    options: {
      model: string;
      webSearch: boolean;
      videoMode: boolean;
      imageMode: boolean;
      reasoningEffort: ReasoningEffort;
      deepResearch: boolean;
    },
  ) => {
    if (isSubmitBlocked) {
      return;
    }
    setAttachmentError(null);

    let attachments: FileUIPart[] | undefined;
    try {
      attachments = await normalizeAttachments(message.files);
    } catch (error) {
      setAttachmentError(
        error instanceof Error ? error.message : t("Failed to upload attachment."),
      );
      return;
    }

    if (GA_ID) {
      sendGAEvent("chat_message_sent", {
        event_category: "chat",
        event_label: usageTier,
        value: 1,
      });
    }

    if (message.text || attachments?.length) {
      Promise.resolve(
        sendMessage(
          {
            text: message.text || "",
            files: attachments,
          },
          {
            body: {
              model: options.model,
              webSearch: options.webSearch,
              reasoningEffort: options.reasoningEffort,
              deepResearch: options.deepResearch,
              video: options.videoMode,
              image: options.imageMode,
              id,
            },
          },
        ),
      ).finally(() => {
        usageQuery.refetch();
        utils.chat.getChats.invalidate();
      });
      setInput("");
    }
  };

  useEffect(() => {
    if (!selectedModel && availableModels.length > 0) {
      setModel(availableModels[0].value);
    }
  }, [availableModels, selectedModel]);

  const handleStop = () => {
    stop();

    void fetch("/api/chat/stop", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });
  };

  const messageRenderKeys = useMemo(() => getMessageRenderKeys(messages), [messages]);

  return (
    <div className="flex h-full flex-1 min-h-0 flex-col w-full max-w-3xl mx-auto p-4 overflow-hidden">
      {initialProjectId && initialProjectName ? (
        <div className="mb-3 flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 rounded-full px-2.5 py-1 text-xs">
            <FolderKanban className="size-3.5" />
            <span className="text-muted-foreground">{t("Projects")}</span>
            <span className="text-foreground">{initialProjectName}</span>
          </Badge>
        </div>
      ) : null}
      <Conversation className="flex-1 min-h-0 h-full">
        <ConversationContent>
          {messages.map((message, index) => (
            <div key={messageRenderKeys[index]}>
              {message.role === "user" && (
                <Message from="user">
                  <MessageContent>
                    {message.parts.filter(isFilePart).length > 0 ? (
                      <Attachments variant="list" className="w-full">
                        {message.parts.filter(isFilePart).map((part, partIndex) => (
                          <Attachment
                            data={{ ...part, id: `${message.id}-file-${partIndex}` }}
                            key={`${message.id}-file-${partIndex}`}
                            className="w-full bg-background/50"
                          >
                            <AttachmentPreview />
                            <AttachmentInfo showMediaType />
                          </Attachment>
                        ))}
                      </Attachments>
                    ) : null}
                    {message.parts.filter(isTextPart).map((part, partIndex) => (
                      <MessageResponse
                        key={`${message.id}-text-${partIndex}`}
                        shikiTheme={["github-light", "github-dark"]}
                      >
                        {part.text}
                      </MessageResponse>
                    ))}
                  </MessageContent>
                </Message>
              )}
              {message.role === "assistant" && (
                <AssistantMessage
                  message={message}
                  isLastMessage={index === messages.length - 1}
                  isStreaming={status === "streaming"}
                  showActions={showMessageActions}
                  isSubmitBlocked={isSubmitBlocked}
                  projectId={initialProjectId}
                  requestBody={requestBody}
                  onRegenerate={regenerate}
                  availableModels={availableModels}
                  onModelChange={setModel}
                  onWebSearchChange={setWebSearch}
                />
              )}
            </div>
          ))}
          {status === "submitted" && (
            <div className="min-h-6">
              <Loader />
            </div>
          )}

          {isWaitingForResponse && (
            <Card className="!gap-0 bg-muted/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Loader />
                  <span>{t("Waiting for response...")}</span>
                </CardTitle>
              </CardHeader>
            </Card>
          )}

          {error && (
            <Card className="!gap-0 bg-destructive/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>{t("Error")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm break-words">
                  {typeof error === "string"
                    ? error
                    : error?.message || t("An unexpected error occurred.")}
                </div>
              </CardContent>
            </Card>
          )}

          {attachmentError && (
            <Card className="!gap-0 bg-destructive/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>{t("Error")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm break-words">{attachmentError}</div>
              </CardContent>
            </Card>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <UsageAlerts
        isAnonymous={isAnonymous}
        isByokActive={isByokActive}
        isByokMissingConfig={isByokMissingConfig}
        isUsageLow={isUsageLow}
        isUsageBlocked={isUsageBlocked}
        canEnableMaxMode={canEnableMaxMode}
        remainingUsage={remainingUsage}
        usageUnitLabel={usageUnitLabel}
        usageCategoryLabel={usageCategoryLabel}
        usageTierLabel={usageTierLabel}
        billingDisabled={billingDisabled}
        enableMaxMode={enableMaxMode}
        onRefreshUsage={() => usageQuery.refetch()}
      />

      <ChatComposer
        className="mt-4"
        value={input}
        onValueChange={setInput}
        onSubmit={handleSubmit}
        onStop={handleStop}
        status={status}
        isSubmitDisabled={isSubmitBlocked}
        model={model}
        onModelChange={setModel}
        webSearch={webSearch}
        onWebSearchChange={setWebSearch}
        videoMode={videoMode}
        onVideoModeChange={setVideoMode}
        imageMode={imageMode}
        onImageModeChange={setImageMode}
        reasoningEffort={reasoningEffort}
        onReasoningEffortChange={setReasoningEffort}
        deepResearch={deepResearch}
        onDeepResearchChange={setDeepResearch}
        showByokBadge={isByokActive}
      />
      <AdSenseSlot
        slot={env.NEXT_PUBLIC_ADSENSE_CHAT_SLOT_ID ?? ""}
        className="mx-auto mt-3 w-full max-w-xl border-border/40 bg-background/40 px-2 py-2 shadow-none"
      />
    </div>
  );
}

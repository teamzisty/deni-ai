"use client";

import { useChat } from "@ai-sdk/react";
import { sendGAEvent } from "@next/third-parties/google";
import type { UIMessage } from "ai";
import { DefaultChatTransport } from "ai";
import { useExtracted } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Loader } from "@/components/ai-elements/loader";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { AssistantMessage } from "@/components/chat/assistant-message";
import {
  ChatComposer,
  type ComposerMessage,
  type ReasoningEffort,
} from "@/components/chat/chat-composer";
import { UsageAlerts } from "@/components/chat/usage-alerts";
import { useAvailableModels } from "@/hooks/use-available-models";
import { useInitialMessage } from "@/hooks/use-initial-message";
import { useUsageStatus } from "@/hooks/use-usage-status";
import { authClient } from "@/lib/auth-client";
import { isBillingDisabled } from "@/lib/billing-config";
import { GA_ID, models } from "@/lib/constants";
import { trpc } from "@/lib/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChatInterfaceProps {
  id: string;
  initialMessages?: UIMessage[];
}

export function ChatInterface({ id, initialMessages = [] }: ChatInterfaceProps) {
  const t = useExtracted();
  const session = authClient.useSession();
  const isAnonymous = Boolean(session.data?.user?.isAnonymous);
  const billingDisabled = isBillingDisabled;
  const [input, setInput] = useState("");
  const [model, setModel] = useState(models[0].value);
  const [webSearch, setWebSearch] = useState(false);
  const [videoMode, setVideoMode] = useState(false);
  const [imageMode, setImageMode] = useState(false);
  const [reasoningEffort, setReasoningEffort] = useState<ReasoningEffort>("high");
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
    enableMaxMode,
  } = useUsageStatus({ model, availableModels, providerKeys, providerSettings });

  const requestBody = useMemo(
    () => ({
      model,
      webSearch,
      reasoningEffort,
      video: videoMode,
      image: imageMode,
      id,
    }),
    [id, model, reasoningEffort, videoMode, imageMode, webSearch],
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

  const { messages, sendMessage, regenerate, status, error, stop } = useChat({
    id,
    messages: initialMessages,
    transport,
  });
  const showMessageActions = status !== "streaming" && status !== "submitted";

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
    onMessageSent: () => utils.chat.getChats.invalidate(),
  });

  const handleSubmit = (
    message: ComposerMessage,
    options: {
      model: string;
      webSearch: boolean;
      videoMode: boolean;
      imageMode: boolean;
      reasoningEffort: ReasoningEffort;
    },
  ) => {
    if (isSubmitBlocked) {
      return;
    }
    const attachments = message.files && message.files.length > 0 ? message.files : undefined;

    if (GA_ID) {
      sendGAEvent("chat_message_sent", {
        event_category: "chat",
        event_label: usageTier,
        value: 1,
      });
    }

    if (message.text) {
      Promise.resolve(
        sendMessage(
          {
            text: message.text,
            files: attachments,
          },
          {
            body: {
              model: options.model,
              webSearch: options.webSearch,
              reasoningEffort: options.reasoningEffort,
              video: options.videoMode,
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

  return (
    <div className="flex h-full flex-1 min-h-0 flex-col w-full max-w-3xl mx-auto p-4 overflow-hidden">
      <Conversation className="flex-1 min-h-0 h-full">
        <ConversationContent>
          {messages.map((message) => (
            <div key={message.id}>
              {message.role === "user" && (
                <Message from="user">
                  <MessageContent>
                    {message.parts[0]?.type === "text" && message.parts[0].text && (
                      <MessageResponse shikiTheme={["github-light", "github-dark"]}>
                        {message.parts[0].text}
                      </MessageResponse>
                    )}
                  </MessageContent>
                </Message>
              )}
              {message.role === "assistant" && (
                <AssistantMessage
                  message={message}
                  isLastMessage={message.id === messages.at(-1)?.id}
                  isStreaming={status === "streaming"}
                  showActions={showMessageActions}
                  isSubmitBlocked={isSubmitBlocked}
                  requestBody={requestBody}
                  onRegenerate={regenerate}
                />
              )}
            </div>
          ))}
          {status === "submitted" && (
            <div className="min-h-6">
              <Loader />
            </div>
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
        onStop={stop}
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
        showByokBadge={isByokActive}
      />
    </div>
  );
}

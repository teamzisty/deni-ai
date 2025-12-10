"use client";

import { useChat } from "@ai-sdk/react";
import {
  SiAnthropic,
  SiGooglegemini,
  SiOpenai,
  SiX,
} from "@icons-pack/react-simple-icons";
import type { UIMessage } from "ai";
import { DefaultChatTransport } from "ai";
import {
  ArrowBigUpDash,
  Bot,
  BrainCircuit,
  CheckIcon,
  ChevronDownIcon,
  Code,
  CopyIcon,
  Globe,
  RefreshCcwIcon,
  Sparkle,
  StarIcon,
} from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Loader } from "@/components/ai-elements/loader";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInputSelect,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSelectTrigger,
  PromptInputSelectValue,
} from "@/components/ai-elements/prompt-input";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources";
import { Composer, type ComposerMessage } from "@/components/chat/composer";
import { featureMap, models } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Shimmer } from "../ai-elements/shimmer";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { Separator } from "../ui/separator";

interface ChatInterfaceProps {
  id: string;
  initialMessages?: UIMessage[];
}

const getThinkingMessage = (
  isStreaming: boolean,
  duration?: number,
  partText?: string,
) => {
  const latestTitle = partText
    ? partText
        .split("\n")
        .filter((line) => line.startsWith("**") && line.endsWith("**"))
        .pop()
        ?.replaceAll("**", "") || ""
    : "";
  if ((isStreaming || duration === 0) && latestTitle) {
    return <Shimmer duration={2}>{latestTitle}</Shimmer>;
  } else if (isStreaming || duration === 0) {
    return <Shimmer duration={2}>Thinking...</Shimmer>;
  }
  if (duration === undefined) {
    return <p>Thought for a few seconds</p>;
  }

  const min = Math.floor(duration / 60);
  const multi = (number: number) => (number !== 1 ? "s" : "");
  const time =
    duration >= 60
      ? `${min} minute${multi(min)}`
      : `${duration} second${multi(duration)}`;
  return <p>Thought for {time}</p>;
};

function ModelItem({
  model,
  isSelected,
}: {
  model: (typeof models)[number];
  isSelected: boolean;
}) {
  return (
    <PromptInputSelectItem
      key={model.value}
      value={model.value}
      textValue={model.name}
      className={cn(
        "items-start p-2 [&>span]:w-full",
        isSelected && "bg-accent/60",
      )}
    >
      <span className="flex flex-col w-full gap-1">
        <span className="flex items-center justify-between font-medium">
          <span className="flex items-center gap-1">
            {(() => {
              switch (model?.author) {
                case "openai":
                  return <SiOpenai />;
                case "anthropic":
                  return <SiAnthropic />;
                case "google":
                  return <SiGooglegemini />;
                case "xai":
                  return <SiX />;
                default:
                  return <Bot />;
              }
            })()}
            {model.name}
            {model.features
              .filter((feature) => feature.includes("est"))
              .map((feature) => (
                <Badge
                  variant="secondary"
                  className="bg-primary/10"
                  key={feature}
                >
                  <StarIcon className="size-4 text-yellow-500 dark:fill-yellow-400" />
                  {featureMap[feature as keyof typeof featureMap]}
                </Badge>
              ))}
          </span>
        </span>
        <span className="text-xs text-muted-foreground">
          {model.description}
        </span>
        {model.features.length > 0 && (
          <span className="flex gap-1 flex-wrap">
            {model.features
              .filter((feature) => !feature.includes("est"))
              .map((feature) => (
                <Badge
                  variant="secondary"
                  className="bg-primary/10"
                  key={feature}
                >
                  {(() => {
                    switch (feature) {
                      case "smart":
                        return <Sparkle />;
                      case "reasoning":
                        return <BrainCircuit />;
                      case "fast":
                        return <ArrowBigUpDash />;
                      case "coding":
                        return <Code />;
                    }
                  })()}
                  {featureMap[feature as keyof typeof featureMap]}
                </Badge>
              ))}
          </span>
        )}
      </span>
      <span className="items-center justify-center size-4">
        {isSelected && <CheckIcon className="size-4" />}
      </span>
    </PromptInputSelectItem>
  );
}

export function ChatInterface({
  id,
  initialMessages = [],
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [model, setModel] = useState(models[0].value);
  const [webSearch, setWebSearch] = useState(false);

  const requestBody = useMemo(
    () => ({
      model,
      webSearch,
      id,
    }),
    [id, model, webSearch],
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

  const {
    messages,
    sendMessage,
    regenerate,
    status,
    error,
    stop: _stop,
  } = useChat({
    id,
    messages: initialMessages,
    transport,
  });

  const handleSubmit = (message: ComposerMessage) => {
    const attachments =
      message.files && message.files.length > 0 ? message.files : undefined;

    if (message.text) {
      sendMessage(
        {
          text: message.text,
          files: attachments,
        },
        {
          body: requestBody,
        },
      );
      setInput("");
    }
  };

  const selectedModel = models.find((m) => m.value === model);
  const goodModels = models.filter(
    (m) =>
      m.value !== model &&
      m.features.filter((f) => f.includes("est")).length > 0,
  );
  const defaultModels = models.filter(
    (m) =>
      m.value !== model &&
      m.default !== false &&
      m.features.filter((f) => f.includes("est")).length === 0,
  );
  const otherModels = models.filter(
    (m) => m.value !== model && m.default === false,
  );

  useEffect(() => {
    if (status === "ready") {
      setIsOpen(false);
    }
  }, [status]);

  return (
    <div className="flex h-full flex-1 min-h-0 flex-col w-full max-w-3xl mx-auto p-4 overflow-hidden">
      <Conversation className="flex-1 min-h-0 h-full">
        <ConversationContent>
          {messages.map((message) => (
            <div key={message.id}>
              {message.role === "user" && (
                <Message from="user">
                  <MessageContent>
                    {message.parts[0]?.type === "text" &&
                      message.parts[0].text && (
                        <MessageResponse
                          shikiTheme={["github-light", "github-dark"]}
                        >
                          {message.parts[0].text}
                        </MessageResponse>
                      )}
                  </MessageContent>
                </Message>
              )}
              {message.role === "assistant" && (
                <div className="space-y-2">
                  {message.parts?.map((part, i) => {
                    switch (part.type) {
                      case "text":
                        return (
                          <Message
                            key={`${message.id}-${i}`}
                            from={message.role}
                          >
                            <MessageContent>
                              <MessageResponse>{part.text}</MessageResponse>
                            </MessageContent>
                            {i === (message.parts?.length ?? 0) - 1 && (
                              <MessageActions>
                                <MessageAction
                                  onClick={() =>
                                    regenerate({
                                      body: requestBody,
                                    })
                                  }
                                  label="Retry"
                                >
                                  <RefreshCcwIcon className="size-3.5" />
                                </MessageAction>
                                <MessageAction
                                  onClick={() =>
                                    navigator.clipboard.writeText(part.text)
                                  }
                                  label="Copy"
                                >
                                  <CopyIcon className="size-3.5" />
                                </MessageAction>
                              </MessageActions>
                            )}
                          </Message>
                        );
                      case "reasoning":
                        return (
                          <Reasoning
                            key={`${message.id}-${i}`}
                            className="w-full"
                            isStreaming={
                              status === "streaming" &&
                              i === (message.parts?.length ?? 0) - 1 &&
                              message.id === messages.at(-1)?.id
                            }
                          >
                            <ReasoningTrigger
                              partText={part.text}
                              getThinkingMessage={getThinkingMessage}
                            />
                            <ReasoningContent>{part.text}</ReasoningContent>
                          </Reasoning>
                        );
                      case "tool-search":
                        if (
                          part.state !== "output-available" &&
                          part.state !== "output-error"
                        ) {
                          return (
                            <div
                              key={part.toolCallId}
                              className="flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
                            >
                              <Globe className="size-4" />
                              <Shimmer>Searching...</Shimmer>
                              <ChevronDownIcon
                                className={cn(
                                  "size-4 ml-auto transition-transform",
                                  "group-data-[state=open]:rotate-180",
                                )}
                                aria-label="Toggle collapsible search results"
                              />
                            </div>
                          );
                        }

                        if (part.state === "output-error") {
                          return (
                            <div
                              key={part.toolCallId}
                              className="flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
                            >
                              <Globe className="size-4" />
                              Search failed
                            </div>
                          );
                        }

                        return (
                          <div
                            className="w-full my-4"
                            key={`${message.id}-${i}`}
                          >
                            {/* Import Collapsible components from shadcn/ui if not already imported */}
                            <Collapsible>
                              <CollapsibleTrigger className="flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground">
                                <Globe className="size-4" />
                                Searched {(part.output as any[]).length}{" "}
                                websites
                                {(part.output as any[]).length !== 0 && (
                                  <ChevronDownIcon
                                    className={cn(
                                      "size-4 ml-auto transition-transform",
                                      "group-data-[state=open]:rotate-180",
                                    )}
                                    aria-label="Toggle collapsible search results"
                                  />
                                )}
                              </CollapsibleTrigger>
                              <CollapsibleContent
                                className={cn(
                                  "data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-muted-foreground outline-none data-[state=closed]:animate-out data-[state=open]:animate-in",
                                )}
                              >
                                <div className="space-y-4 mt-4">
                                  {Array.isArray((part as any).output) &&
                                    (part as any).output.length > 0 &&
                                    (part as any).output.map(
                                      (
                                        result: {
                                          title: string;
                                          url: string;
                                          description: string;
                                        },
                                        idx: number,
                                      ) => (
                                        <div
                                          key={result.url}
                                          className="p-0! bg-accent/40 hover:bg-accent rounded-md transition-colors"
                                        >
                                          <Link
                                            href={result.url}
                                            className="block p-3"
                                          >
                                            <p className="text-sm text-primary mb-1 line-clamp-2">
                                              <span className="text-muted-foreground">
                                                {`${new URL(result.url).protocol}//`}
                                              </span>
                                              {new URL(result.url).hostname}
                                              <span className="text-muted-foreground">
                                                {`${new URL(result.url).pathname.slice(0, 50)}${new URL(result.url).pathname.length > 50 ? "..." : ""}`}
                                              </span>
                                            </p>
                                            <p className="font-medium text-sm text-primary mb-1 line-clamp-2">
                                              {result.title}
                                            </p>
                                            <div className="p-0">
                                              <div className="text-xs text-muted-foreground line-clamp-3 mb-1">
                                                {result.description.slice(
                                                  0,
                                                  100,
                                                )}
                                                {result.description.length >
                                                  100 && "..."}
                                              </div>
                                            </div>
                                          </Link>
                                        </div>
                                      ),
                                    )}
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          </div>
                        );
                      default:
                        return null;
                    }
                  })}

                  {message.parts?.some((p) => p.type === "source-url") && (
                    <Sources className="mt-2">
                      <SourcesTrigger
                        count={
                          message.parts.filter((p) => p.type === "source-url")
                            .length
                        }
                      >
                        Sources
                      </SourcesTrigger>
                      <SourcesContent>
                        {message.parts
                          .filter((p) => p.type === "source-url")
                          .map((part, index) => (
                            <Source
                              key={`${message.id}-source-${index}`}
                              href={part.url || "#"}
                              title={part.title || part.url || "Source"}
                            />
                          ))}
                      </SourcesContent>
                    </Sources>
                  )}
                </div>
              )}
            </div>
          ))}
          {status === "submitted" && <Loader />}

          {error && (
            <Card className="my-4 border-destructive/30 bg-destructive/10">
              <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2">
                  <span>Error</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-destructive text-sm break-words">
                  {typeof error === "string"
                    ? error
                    : error?.message || "An unexpected error occurred."}
                </div>
              </CardContent>
            </Card>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <Composer
        onSubmit={handleSubmit}
        className="mt-4"
        globalDrop
        multiple
        headerClassName="py-0.5!"
        value={input}
        onValueChange={(value) => setInput(value)}
        webSearch={webSearch}
        onToggleWebSearch={() => setWebSearch(!webSearch)}
        status={status}
        tools={
          <PromptInputSelect
            onValueChange={(value) => {
              setModel(value);
            }}
            value={model}
          >
            <PromptInputSelectTrigger>
              <PromptInputSelectValue>
                {(() => {
                  switch (models.find((m) => m.value === model)?.author) {
                    case "openai":
                      return <SiOpenai />;
                    case "anthropic":
                      return <SiAnthropic />;
                    case "google":
                      return <SiGooglegemini />;
                    case "xai":
                      return <SiX />;
                    default:
                      return <Bot />;
                  }
                })()}
                {models.find((m) => m.value === model)?.name}
              </PromptInputSelectValue>
            </PromptInputSelectTrigger>
            <PromptInputSelectContent className="max-h-[300px] md:max-h-[400px] overflow-y-auto">
              {selectedModel && (
                <ModelItem model={selectedModel} isSelected={true} />
              )}
              <Separator className="my-1" />
              {goodModels.map((m) => (
                <ModelItem key={m.value} model={m} isSelected={false} />
              ))}
              <Separator className="my-1" />
              {defaultModels.map((m) => (
                <ModelItem key={m.value} model={m} isSelected={false} />
              ))}
              {otherModels.length > 0 && <Separator className="my-1" />}
              {otherModels.map((m) => (
                <ModelItem key={m.value} model={m} isSelected={false} />
              ))}
            </PromptInputSelectContent>
          </PromptInputSelect>
        }
      />
    </div>
  );
}

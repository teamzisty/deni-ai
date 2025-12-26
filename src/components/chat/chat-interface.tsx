"use client";

import { useChat } from "@ai-sdk/react";
import {
  SiAnthropic,
  SiGooglegemini,
  SiOpenai,
  SiX,
} from "@icons-pack/react-simple-icons";
import type {
  ToolUIPart,
  UIDataTypes,
  UIMessage,
  UIMessagePart,
  UITools,
} from "ai";
import { DefaultChatTransport } from "ai";
import type { LucideIcon } from "lucide-react";
import {
  ArrowBigUpDash,
  ArrowUpRight,
  Ban,
  Bot,
  BrainCircuit,
  BrainIcon,
  Code,
  CopyIcon,
  Diamond,
  Film,
  Globe,
  Plug,
  RefreshCcwIcon,
  Sparkle,
  StarIcon,
  TriangleAlert,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtSearchResult,
  ChainOfThoughtSearchResults,
  ChainOfThoughtStep,
} from "@/components/ai-elements/chain-of-thought";
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
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources";
import { Composer, type ComposerMessage } from "@/components/chat/composer";
import { featureMap, models } from "@/lib/constants";
import { trpc } from "@/lib/trpc/react";
import { cn } from "@/lib/utils";
import { Shimmer } from "../ai-elements/shimmer";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import { Separator } from "../ui/separator";
import { Spinner } from "../ui/spinner";

type SearchResult = {
  title: string;
  url: string;
  description: string;
};

type VideoToolOutput = {
  videoUrl: string;
  operationName?: string | null;
  model?: string | null;
  modelLabel?: string | null;
  aspectRatio?: string | null;
  resolution?: string | null;
  durationSeconds?: number | null;
  seed?: number | null;
  negativePrompt?: string | null;
};

const reasoningEffortValues = ["low", "medium", "high"] as const;
type ReasoningEffort = (typeof reasoningEffortValues)[number];

function isReasoningEffort(value: string): value is ReasoningEffort {
  return (reasoningEffortValues as readonly string[]).includes(value);
}

const isSearchResultArray = (value: unknown): value is SearchResult[] =>
  Array.isArray(value) &&
  value.every(
    (item) =>
      item !== null &&
      typeof item === "object" &&
      "title" in item &&
      "url" in item &&
      "description" in item,
  );

const isVideoToolOutput = (value: unknown): value is VideoToolOutput => {
  if (!value || typeof value !== "object") {
    return false;
  }
  return typeof (value as { videoUrl?: unknown }).videoUrl === "string";
};

type VideoToolPart = ToolUIPart<{
  video: {
    input: unknown;
    output: VideoToolOutput;
  };
}>;

const isVideoToolPart = (
  part: UIMessagePart<UIDataTypes, UITools>,
): part is VideoToolPart => part.type === "tool-video";

type ToolChipProps = {
  icon: LucideIcon;
  label: string;
  onRemove: () => void;
};

function ToolChip({ icon: Icon, label, onRemove }: ToolChipProps) {
  return (
    <Button
      variant="ghost"
      className="group flex items-center gap-1.5 rounded-md px-2 py-1 font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      onClick={onRemove}
      aria-label={`Remove ${label}`}
    >
      <Icon className="size-3.5 group-hover:hidden" />
      <XIcon className="size-3.5 hidden group-hover:block" />
      <span>{label}</span>
    </Button>
  );
}

interface ChatInterfaceProps {
  id: string;
  initialMessages?: UIMessage[];
}

type BaseModelOption = (typeof models)[number];
type CustomModelOption = {
  name: string;
  value: string;
  description: string;
  author: "openai_compatible";
  features: string[];
  premium?: boolean;
  default?: boolean;
  source: "custom";
};
type ModelOption = BaseModelOption | CustomModelOption;

function ModelItem({
  model,
  isSelected,
}: {
  model: ModelOption;
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
              if (model.premium) {
                return <Diamond className="size-4" />;
              }

              switch (model?.author) {
                case "openai":
                  return <SiOpenai />;
                case "anthropic":
                  return <SiAnthropic />;
                case "google":
                  return <SiGooglegemini />;
                case "xai":
                  return <SiX />;
                case "openai_compatible":
                  return <Plug className="size-4" />;
                default:
                  return <Bot />;
              }
            })()}
            {model.name}
            {model.author === "openai_compatible" && (
              <Badge variant="secondary" className="bg-primary/10">
                BYOK
              </Badge>
            )}
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
    </PromptInputSelectItem>
  );
}

export function ChatInterface({
  id,
  initialMessages = [],
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [model, setModel] = useState(models[0].value);
  const [webSearch, setWebSearch] = useState(false);
  const [videoMode, setVideoMode] = useState(false);
  const [reasoningEffort, setReasoningEffort] =
    useState<ReasoningEffort>("high");
  const utils = trpc.useUtils();
  const usageQuery = trpc.billing.usage.useQuery(undefined, {
    refetchOnWindowFocus: true,
    staleTime: 30000,
  });
  const providersQuery = trpc.providers.getConfig.useQuery(undefined, {
    refetchOnWindowFocus: false,
    staleTime: 30000,
  });

  const customModels = useMemo<ModelOption[]>(() => {
    return (providersQuery.data?.customModels ?? []).map((entry) => ({
      name: entry.name,
      value: `custom:${entry.id}`,
      description: entry.description ?? "Custom model",
      author: "openai_compatible",
      features: [],
      premium: entry.premium,
      default: false,
      source: "custom",
    }));
  }, [providersQuery.data?.customModels]);

  const availableModels = useMemo<ModelOption[]>(
    () => [...models, ...customModels],
    [customModels],
  );

  const requestBody = useMemo(
    () => ({
      model,
      webSearch,
      reasoningEffort,
      video: videoMode,
      id,
    }),
    [id, model, reasoningEffort, videoMode, webSearch],
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

  const selectedModel = availableModels.find((m) => m.value === model);
  const supportsReasoningEffort =
    selectedModel?.features?.includes("reasoning");
  const usageCategory = selectedModel?.premium ? "premium" : "basic";
  const categoryUsage = usageQuery.data?.usage.find(
    (usage) => usage.category === usageCategory,
  );
  const remainingUsage = categoryUsage?.remaining;
  const usageLimit = categoryUsage?.limit;
  const usageTier = usageQuery.data?.tier ?? "free";
  const lowUsageThreshold = useMemo(() => {
    if (
      remainingUsage === null ||
      remainingUsage === undefined ||
      usageLimit === null ||
      usageLimit === undefined
    ) {
      return null;
    }
    const computed = Math.ceil(usageLimit * 0.1);
    return Math.max(3, Math.min(20, computed));
  }, [remainingUsage, usageLimit]);
  const providerSettings = useMemo(() => {
    return new Map(
      (providersQuery.data?.settings ?? []).map((setting) => [
        setting.provider,
        setting,
      ]),
    );
  }, [providersQuery.data?.settings]);

  const providerKeys = useMemo(() => {
    return new Set(
      (providersQuery.data?.keys ?? []).map((entry) => entry.provider),
    );
  }, [providersQuery.data?.keys]);

  const selectedProvider = selectedModel?.author ?? null;
  const openAiCompatSetting = providerSettings.get("openai_compatible");
  const openAiCompatReady =
    providerKeys.has("openai_compatible") &&
    Boolean(openAiCompatSetting?.baseUrl);

  const isByokActive = (() => {
    if (!selectedProvider) return false;
    if (selectedProvider === "openai_compatible") {
      return openAiCompatReady;
    }
    const prefer = providerSettings.get(selectedProvider)?.preferByok ?? false;
    return prefer && providerKeys.has(selectedProvider);
  })();

  const isByokMissingConfig =
    selectedProvider === "openai_compatible" && !openAiCompatReady;

  const isUsageLow =
    !isByokActive &&
    remainingUsage !== null &&
    remainingUsage !== undefined &&
    usageLimit !== null &&
    usageLimit !== undefined &&
    lowUsageThreshold !== null &&
    remainingUsage > 0 &&
    remainingUsage <= lowUsageThreshold;
  const isUsageBlocked =
    !isByokActive &&
    remainingUsage !== null &&
    remainingUsage !== undefined &&
    remainingUsage <= 0;
  const usageTierLabel = usageTier.charAt(0).toUpperCase() + usageTier.slice(1);
  const usageLabel =
    remainingUsage === null || remainingUsage === undefined
      ? null
      : `${remainingUsage} request${remainingUsage === 1 ? "" : "s"}`;
  const isSubmitBlocked = isUsageBlocked || isByokMissingConfig;

  const handleSubmit = (message: ComposerMessage) => {
    if (isSubmitBlocked) {
      return;
    }
    const attachments =
      message.files && message.files.length > 0 ? message.files : undefined;

    if (message.text) {
      Promise.resolve(
        sendMessage(
          {
            text: message.text,
            files: attachments,
          },
          {
            body: requestBody,
          },
        ),
      ).finally(() => {
        usageQuery.refetch();
        utils.chat.getChats.invalidate();
      });
      setInput("");
    }
  };

  const handleVideoToggle = (enabled: boolean) => {
    setVideoMode(enabled);
    if (enabled) {
      setWebSearch(false);
    }
  };

  const handleSearchToggle = (enabled: boolean) => {
    setWebSearch(enabled);
    if (enabled) {
      setVideoMode(false);
    }
  };

  useEffect(() => {
    if (!selectedModel && availableModels.length > 0) {
      setModel(availableModels[0].value);
    }
  }, [availableModels, selectedModel]);

  const goodModels = availableModels.filter(
    (m) =>
      m.value !== model && m.features?.filter((f) => f.includes("est")).length,
  );
  const defaultModels = availableModels.filter(
    (m) =>
      m.value !== model &&
      m.default !== false &&
      m.features?.filter((f) => f.includes("est")).length === 0,
  );
  const otherModels = availableModels.filter(
    (m) => m.value !== model && m.default === false,
  );

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
                  {/* Chain of Thought - reasoning と search を統合表示 */}
                  {message.parts?.some(
                    (p) => p.type === "reasoning" || p.type === "tool-search",
                  ) && (
                    <ChainOfThought
                      defaultOpen={
                        status === "streaming" &&
                        message.id === messages.at(-1)?.id
                      }
                    >
                      <ChainOfThoughtHeader>
                        {status === "streaming" &&
                        message.id === messages.at(-1)?.id &&
                        !message.parts?.some((p) => p.type === "text") ? (
                          <Shimmer duration={2}>Thinking...</Shimmer>
                        ) : (
                          "Thought process"
                        )}
                      </ChainOfThoughtHeader>
                      <ChainOfThoughtContent>
                        {message.parts
                          ?.filter(
                            (p) =>
                              p.type === "reasoning" ||
                              p.type === "tool-search",
                          )
                          .map((part, i) => {
                            if (part.type === "reasoning") {
                              const lines = (part.text ?? "")
                                .replace(/\r\n?/g, "\n")
                                .split("\n");
                              const titleRegex = /^\*\*(.+?)\*\*\s*$/;

                              type Section = {
                                title: string;
                                content: string[];
                              };
                              const sections: Section[] = [];

                              let currentTitle: string | null = null;
                              let currentContent: string[] = [];

                              const flush = () => {
                                if (
                                  currentTitle === null &&
                                  currentContent.length === 0
                                )
                                  return;

                                sections.push({
                                  title:
                                    (currentTitle ?? "Reasoning").trim() ||
                                    "Reasoning",
                                  content: currentContent,
                                });

                                currentTitle = null;
                                currentContent = [];
                              };

                              for (const rawLine of lines) {
                                const line = rawLine;
                                const trimmed = line.trim();
                                const m = trimmed.match(titleRegex);

                                if (m) {
                                  flush();
                                  currentTitle = m[1]; // **Title** の中身
                                } else {
                                  currentContent.push(line);
                                }
                              }
                              flush();

                              if (sections.length === 0) {
                                sections.push({
                                  title: "Reasoning",
                                  content: [],
                                });
                              }

                              return (
                                <>
                                  {sections.map((s, sIdx) => {
                                    const content = s.content.join("\n").trim();
                                    return (
                                      <ChainOfThoughtStep
                                        key={`${message.id}-cot-${i}-${sIdx}`}
                                        icon={BrainIcon}
                                        label={s.title || "Reasoning"}
                                        description={content || "No details"}
                                        className="whitespace-pre-wrap"
                                        status="complete"
                                      />
                                    );
                                  })}
                                </>
                              );
                            }

                            if (part.type === "tool-search") {
                              const isSearching =
                                part.state !== "output-available" &&
                                part.state !== "output-error";
                              const searchResults = isSearchResultArray(
                                part.output,
                              )
                                ? part.output
                                : [];
                              return (
                                <ChainOfThoughtStep
                                  key={`${message.id}-cot-${i}`}
                                  icon={Globe}
                                  label={
                                    isSearching ? (
                                      <Shimmer duration={2}>
                                        Searching...
                                      </Shimmer>
                                    ) : part.state === "output-error" ? (
                                      "Search failed"
                                    ) : (
                                      `Found ${searchResults.length} results`
                                    )
                                  }
                                  status={isSearching ? "active" : "complete"}
                                >
                                  {searchResults.length > 0 && (
                                    <ChainOfThoughtSearchResults>
                                      {searchResults.map((result) => (
                                        <Link
                                          key={result.url}
                                          href={result.url}
                                          target="_blank"
                                          rel="noreferrer"
                                        >
                                          <ChainOfThoughtSearchResult>
                                            <Globe className="size-3" />
                                            {new URL(result.url).hostname}
                                          </ChainOfThoughtSearchResult>
                                        </Link>
                                      ))}
                                    </ChainOfThoughtSearchResults>
                                  )}
                                </ChainOfThoughtStep>
                              );
                            }
                            return null;
                          })}
                      </ChainOfThoughtContent>
                    </ChainOfThought>
                  )}

                  {/* テキスト応答 */}
                  {message.parts
                    ?.filter((p) => p.type === "text")
                    .map((part, i, textParts) => (
                      <Message
                        key={`${message.id}-text-${i}`}
                        from={message.role}
                      >
                        <MessageContent>
                          <MessageResponse>{part.text}</MessageResponse>
                        </MessageContent>
                        {i === textParts.length - 1 && (
                          <MessageActions>
                            <MessageAction
                              disabled={isSubmitBlocked}
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
                    ))}

                  {message.parts?.filter(isVideoToolPart).map((part, i) => {
                    if (
                      part.state !== "output-available" &&
                      part.state !== "output-error"
                    ) {
                      return (
                        <Message
                          key={`${message.id}-video-${i}`}
                          from="assistant"
                        >
                          <MessageContent className="w-full gap-2 rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Spinner className="size-4" />
                              <span>Generating video...</span>
                            </div>
                          </MessageContent>
                        </Message>
                      );
                    }

                    if (part.state === "output-error") {
                      return (
                        <Message
                          key={`${message.id}-video-${i}`}
                          from="assistant"
                        >
                          <MessageContent className="w-full">
                            <Alert className="border-destructive/50 bg-destructive/10 text-destructive">
                              <AlertTitle>Video generation failed</AlertTitle>
                              <AlertDescription>
                                Please try again with a different prompt.
                              </AlertDescription>
                            </Alert>
                          </MessageContent>
                        </Message>
                      );
                    }

                    const output = isVideoToolOutput(part.output)
                      ? part.output
                      : null;

                    if (!output) {
                      return (
                        <Message
                          key={`${message.id}-video-${i}`}
                          from="assistant"
                        >
                          <MessageContent className="w-full">
                            <Alert className="border-destructive/50 bg-destructive/10 text-destructive">
                              <AlertTitle>
                                Video response unavailable
                              </AlertTitle>
                              <AlertDescription>
                                The video output could not be displayed.
                              </AlertDescription>
                            </Alert>
                          </MessageContent>
                        </Message>
                      );
                    }

                    return (
                      <Message
                        key={`${message.id}-video-${i}`}
                        from="assistant"
                      >
                        <MessageContent className="w-full gap-3 rounded-lg border border-border/60 bg-background/90 px-4 py-3">
                          {output.negativePrompt && (
                            <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs">
                              <p className="text-xs font-medium text-foreground">
                                Negative prompt
                              </p>
                              <p className="text-muted-foreground">
                                {output.negativePrompt}
                              </p>
                            </div>
                          )}
                          <div className="overflow-hidden rounded-lg border border-border/70 bg-muted/30">
                            {/* biome-ignore lint/a11y/useMediaCaption: generated videos don't include captions. */}
                            <video
                              controls
                              src={output.videoUrl}
                              className="h-auto w-full"
                            />
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            {output.resolution && (
                              <Badge variant="secondary">
                                {output.resolution}
                              </Badge>
                            )}
                            {output.aspectRatio && (
                              <Badge variant="secondary">
                                {output.aspectRatio}
                              </Badge>
                            )}
                            {output.durationSeconds && (
                              <Badge variant="secondary">
                                {output.durationSeconds}s
                              </Badge>
                            )}
                            {output.modelLabel || output.model ? (
                              <Badge variant="outline">
                                {output.modelLabel ?? output.model}
                              </Badge>
                            ) : null}
                            {output.seed !== null &&
                              output.seed !== undefined && (
                                <Badge variant="outline">
                                  Seed {output.seed}
                                </Badge>
                              )}
                          </div>
                          {output.operationName && (
                            <p className="break-words text-xs text-muted-foreground">
                              Operation: {output.operationName}
                            </p>
                          )}
                          <div>
                            <Button asChild size="sm" variant="outline">
                              <a href={output.videoUrl} download>
                                Download video
                              </a>
                            </Button>
                          </div>
                        </MessageContent>
                      </Message>
                    );
                  })}

                  {/* ソース */}
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

      {isByokMissingConfig && (
        <Alert className="mt-3 border-destructive/40 bg-destructive/10 text-destructive-foreground dark:border-destructive/30">
          <Ban className="mt-0.5 size-4" />
          <AlertTitle>Endpoint not configured</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <p>
              Configure an OpenAI-compatible base URL and API key before using
              this model.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" asChild>
                <Link href="/settings/providers">
                  Open settings
                  <ArrowUpRight className="ml-1.5 size-3.5" />
                </Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {isByokActive && !isByokMissingConfig && (
        <Alert className="mt-3 border-emerald-500/40 bg-emerald-100/40 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-50">
          <Plug className="mt-0.5 size-4" />
          <AlertTitle>BYOK active</AlertTitle>
          <AlertDescription>
            Requests use your own API key and do not count toward usage limits.
          </AlertDescription>
        </Alert>
      )}

      {(isUsageLow || isUsageBlocked) && (
        <Alert
          className={cn(
            "mt-3 border-amber-500/50 bg-amber-100/40 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-50",
            isUsageBlocked &&
              "border-destructive/40 bg-destructive/10 text-destructive-foreground dark:border-destructive/30",
          )}
        >
          {isUsageBlocked ? (
            <Ban className="mt-0.5 size-4" />
          ) : (
            <TriangleAlert className="mt-0.5 size-4" />
          )}
          <AlertTitle>
            {isUsageBlocked ? "Usage limit reached" : "You are running low"}
          </AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <p>
              {isUsageBlocked
                ? `You've hit the ${usageCategory} usage limit on your ${usageTierLabel} plan.`
                : `Only ${usageLabel ?? "a few"} ${usageCategory} requests left on your ${usageTierLabel} plan.`}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" asChild>
                <Link href="/settings/billing">
                  Upgrade plan
                  <ArrowUpRight className="ml-1.5 size-3.5" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => usageQuery.refetch()}
              >
                Refresh usage
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Composer
        onSubmit={handleSubmit}
        className="mt-4"
        globalDrop
        multiple
        placeholder={
          videoMode
            ? "Describe the video scene, style, motion, and lighting."
            : undefined
        }
        headerClassName="py-0.5!"
        value={input}
        onValueChange={(value) => setInput(value)}
        status={status}
        isSubmitDisabled={isSubmitBlocked}
        actionMenuItems={
          <>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={videoMode}
              onCheckedChange={(checked) => handleVideoToggle(Boolean(checked))}
            >
              <Film className="size-4" />
              Video
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={webSearch}
              onCheckedChange={(checked) =>
                handleSearchToggle(Boolean(checked))
              }
            >
              <Globe className="size-4" />
              Search
            </DropdownMenuCheckboxItem>
          </>
        }
        tools={
          <>
            {videoMode && (
              <ToolChip
                icon={Film}
                label="Video"
                onRemove={() => handleVideoToggle(false)}
              />
            )}
            {webSearch && (
              <ToolChip
                icon={Globe}
                label="Search"
                onRemove={() => handleSearchToggle(false)}
              />
            )}
            <PromptInputSelect
              onValueChange={(value) => {
                setModel(value);
              }}
              value={model}
            >
              <PromptInputSelectTrigger>
                <PromptInputSelectValue>
                  {(() => {
                    if (selectedModel?.premium) {
                      return <Diamond className="size-4" />;
                    }

                    switch (selectedModel?.author) {
                      case "openai":
                        return <SiOpenai />;
                      case "anthropic":
                        return <SiAnthropic />;
                      case "google":
                        return <SiGooglegemini />;
                      case "xai":
                        return <SiX />;
                      case "openai_compatible":
                        return <Plug className="size-4" />;
                      default:
                        return <Bot />;
                    }
                  })()}
                  {selectedModel?.name ?? "Select model"}
                  {isByokActive && (
                    <Badge variant="secondary" className="bg-primary/10">
                      BYOK
                    </Badge>
                  )}
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

            <PromptInputSelect
              value={reasoningEffort}
              onValueChange={(value) => {
                if (isReasoningEffort(value)) {
                  setReasoningEffort(value);
                }
              }}
              disabled={!supportsReasoningEffort}
            >
              <PromptInputSelectTrigger>
                <PromptInputSelectValue>
                  <BrainIcon className="size-4" />
                  {reasoningEffort}
                </PromptInputSelectValue>
              </PromptInputSelectTrigger>
              <PromptInputSelectContent>
                <PromptInputSelectItem value="low">low</PromptInputSelectItem>
                <PromptInputSelectItem value="medium">
                  medium
                </PromptInputSelectItem>
                <PromptInputSelectItem value="high">high</PromptInputSelectItem>
              </PromptInputSelectContent>
            </PromptInputSelect>
          </>
        }
      />
    </div>
  );
}

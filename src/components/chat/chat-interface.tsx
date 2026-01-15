"use client";

import { useChat } from "@ai-sdk/react";
import { sendGAEvent } from "@next/third-parties/google";
import type { ToolUIPart, UIDataTypes, UIMessage, UIMessagePart, UITools } from "ai";
import { DefaultChatTransport } from "ai";
import {
  ArrowUpRight,
  Ban,
  BrainIcon,
  CopyIcon,
  Globe,
  Plug,
  RefreshCcwIcon,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useExtracted } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { Source, Sources, SourcesContent, SourcesTrigger } from "@/components/ai-elements/sources";
import {
  ChatComposer,
  type ComposerMessage,
  isReasoningEffort,
  type ModelOption,
  type ReasoningEffort,
} from "@/components/chat/chat-composer";
import { authClient } from "@/lib/auth-client";
import { isBillingDisabled } from "@/lib/billing-config";
import { GA_ID, models } from "@/lib/constants";
import { trpc } from "@/lib/trpc/react";
import { cn } from "@/lib/utils";
import { Shimmer } from "../ai-elements/shimmer";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
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

type ImageToolOutput = {
  imageUrls: string[];
  model?: string | null;
  modelLabel?: string | null;
  aspectRatio?: string | null;
  resolution?: string | null;
  numberOfImages?: number | null;
};

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

const isImageToolOutput = (value: unknown): value is ImageToolOutput => {
  if (!value || typeof value !== "object") {
    return false;
  }
  return (
    Array.isArray((value as { imageUrls?: unknown }).imageUrls) &&
    (value as { imageUrls?: unknown[] }).imageUrls?.every((url) => typeof url === "string") === true
  );
};

type VideoToolPart = ToolUIPart<{
  video: {
    input: unknown;
    output: VideoToolOutput;
  };
}>;

const isVideoToolPart = (part: UIMessagePart<UIDataTypes, UITools>): part is VideoToolPart =>
  part.type === "tool-video";

type ImageToolPart = ToolUIPart<{
  image: {
    input: unknown;
    output: ImageToolOutput;
  };
}>;

const isImageToolPart = (part: UIMessagePart<UIDataTypes, UITools>): part is ImageToolPart =>
  part.type === "tool-image";

interface ChatInterfaceProps {
  id: string;
  initialMessages?: UIMessage[];
}

export function ChatInterface({ id, initialMessages = [] }: ChatInterfaceProps) {
  const t = useExtracted();
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = authClient.useSession();
  const isAnonymous = Boolean(session.data?.user?.isAnonymous);
  const billingDisabled = isBillingDisabled;
  const [input, setInput] = useState("");
  const [model, setModel] = useState(models[0].value);
  const [webSearch, setWebSearch] = useState(false);
  const [videoMode, setVideoMode] = useState(false);
  const [imageMode, setImageMode] = useState(false);
  const [reasoningEffort, setReasoningEffort] = useState<ReasoningEffort>("high");
  const initialMessageSentRef = useRef(false);
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
      description: entry.description ?? t("Custom model"),
      author: "openai_compatible",
      features: [],
      premium: entry.premium,
      default: false,
      source: "custom",
    }));
  }, [providersQuery.data?.customModels, t]);

  const availableModels = useMemo<ModelOption[]>(() => {
    const baseModels = isAnonymous
      ? (models as unknown as ModelOption[]).filter((entry) => !entry.premium)
      : (models as unknown as ModelOption[]);
    const filteredCustomModels = isAnonymous
      ? customModels.filter((entry) => !entry.premium)
      : customModels;
    return [...baseModels, ...filteredCustomModels];
  }, [customModels, isAnonymous]);

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

  // Storage key for initial message data (must match home.tsx)
  const INITIAL_MESSAGE_STORAGE_KEY = "deni_initial_message";

  // Auto-send initial message from sessionStorage or query parameter
  useEffect(() => {
    if (initialMessageSentRef.current || initialMessages.length > 0) {
      return;
    }

    // Try to get initial message from sessionStorage first (new method with file support)
    const storedData = sessionStorage.getItem(INITIAL_MESSAGE_STORAGE_KEY);
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData) as {
          text: string;
          files: Array<{
            type: "file";
            filename?: string;
            mediaType: string;
            url: string;
          }>;
          webSearch: boolean;
          model?: string;
          videoMode?: boolean;
          imageMode?: boolean;
          reasoningEffort?: string;
        };

        initialMessageSentRef.current = true;

        // Clear the stored data to prevent re-sending on refresh
        sessionStorage.removeItem(INITIAL_MESSAGE_STORAGE_KEY);

        // Set state from stored data
        if (parsed.webSearch) {
          setWebSearch(true);
        }
        if (parsed.model) {
          setModel(parsed.model);
        }
        if (parsed.videoMode) {
          setVideoMode(true);
        }
        if (parsed.imageMode) {
          setImageMode(true);
        }
        const parsedReasoningEffort =
          parsed.reasoningEffort && isReasoningEffort(parsed.reasoningEffort)
            ? parsed.reasoningEffort
            : "high";
        setReasoningEffort(parsedReasoningEffort);

        // Send the message with files
        Promise.resolve(
          sendMessage(
            {
              text: parsed.text,
              files: parsed.files.length > 0 ? parsed.files : undefined,
            },
            {
              body: {
                model: parsed.model ?? model,
                webSearch: parsed.webSearch,
                reasoningEffort: parsedReasoningEffort,
                video: parsed.videoMode ?? false,
                image: parsed.imageMode ?? false,
                id,
              },
            },
          ),
        ).finally(() => {
          utils.chat.getChats.invalidate();
        });

        return;
      } catch (e) {
        console.error("Failed to parse initial message from sessionStorage:", e);
        sessionStorage.removeItem(INITIAL_MESSAGE_STORAGE_KEY);
      }
    }

    // Fallback: check query parameters (legacy method, no file support)
    const initialMessage = searchParams.get("message");
    const initialWebSearch = searchParams.get("webSearch") === "true";

    if (initialMessage) {
      initialMessageSentRef.current = true;
      const decodedMessage = decodeURIComponent(initialMessage);

      // Set webSearch state if it was passed from home
      if (initialWebSearch) {
        setWebSearch(true);
      }

      // Remove the query params from URL to prevent re-sending on refresh
      router.replace(`/chat/${id}`, { scroll: false });

      // Send the message with the webSearch setting from query params
      Promise.resolve(
        sendMessage(
          { text: decodedMessage },
          {
            body: {
              model,
              webSearch: initialWebSearch,
              reasoningEffort: "high",
              video: false,
              id,
            },
          },
        ),
      ).finally(() => {
        utils.chat.getChats.invalidate();
      });
    }
  }, [searchParams, initialMessages.length, sendMessage, router, id, model, utils.chat.getChats]);

  const selectedModel = availableModels.find((m) => m.value === model);
  const usageCategory = selectedModel?.premium ? "premium" : "basic";
  const categoryUsage = usageQuery.data?.usage.find((usage) => usage.category === usageCategory);
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
      (providersQuery.data?.settings ?? []).map((setting) => [setting.provider, setting]),
    );
  }, [providersQuery.data?.settings]);

  const providerKeys = useMemo(() => {
    return new Set((providersQuery.data?.keys ?? []).map((entry) => entry.provider));
  }, [providersQuery.data?.keys]);

  const selectedProvider = selectedModel?.author ?? null;
  const openAiCompatSetting = providerSettings.get("openai_compatible");
  const openAiCompatReady =
    providerKeys.has("openai_compatible") && Boolean(openAiCompatSetting?.baseUrl);

  const isByokActive = (() => {
    if (!selectedProvider) return false;
    if (selectedProvider === "openai_compatible") {
      return openAiCompatReady;
    }
    const prefer = providerSettings.get(selectedProvider)?.preferByok ?? false;
    return prefer && providerKeys.has(selectedProvider);
  })();

  const isByokMissingConfig = selectedProvider === "openai_compatible" && !openAiCompatReady;

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
    !isByokActive && remainingUsage !== null && remainingUsage !== undefined && remainingUsage <= 0;
  const usageCategoryLabel = usageCategory === "premium" ? t("Premium") : t("Basic");
  const usageTierLabel =
    usageTier === "free" ? t("Free") : usageTier === "plus" ? t("Plus") : t("Pro");
  const isSubmitBlocked = isUsageBlocked || isByokMissingConfig;

  const resolveImageModelLabel = (imageModel?: string | null, modelLabel?: string | null) => {
    if (modelLabel) {
      return modelLabel;
    }
    if (imageModel === "gemini-3-pro-image-preview") {
      return "Nano Banana Pro";
    }
    return imageModel ?? null;
  };

  const resolveVeoModelLabel = (veoModel?: string | null, modelLabel?: string | null) => {
    if (modelLabel) {
      return modelLabel;
    }
    switch (veoModel) {
      case "veo-3.1-generate-preview":
        return t("Veo 3.1");
      case "veo-3.1-fast-generate-preview":
        return t("Veo 3.1 Fast");
      default:
        return veoModel ?? null;
    }
  };

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
      // Log event to Google Analytics
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
                <div className="space-y-2">
                  {/* Chain of Thought - reasoning と search を統合表示 */}
                  {message.parts?.some(
                    (p) => p.type === "reasoning" || p.type === "tool-search",
                  ) && (
                    <ChainOfThought
                      defaultOpen={status === "streaming" && message.id === messages.at(-1)?.id}
                    >
                      <ChainOfThoughtHeader>
                        {status === "streaming" &&
                        message.id === messages.at(-1)?.id &&
                        !message.parts?.some((p) => p.type === "text") ? (
                          <Shimmer duration={2}>{t("Thinking...")}</Shimmer>
                        ) : (
                          t("Thought process")
                        )}
                      </ChainOfThoughtHeader>
                      <ChainOfThoughtContent>
                        {message.parts
                          ?.filter((p) => p.type === "reasoning" || p.type === "tool-search")
                          .map((part, i) => {
                            if (part.type === "reasoning") {
                              const lines = (part.text ?? "").replace(/\r\n?/g, "\n").split("\n");
                              const titleRegex = /^\*\*(.+?)\*\*\s*$/;

                              type Section = {
                                title: string;
                                content: string[];
                              };
                              const sections: Section[] = [];

                              let currentTitle: string | null = null;
                              let currentContent: string[] = [];

                              const flush = () => {
                                if (currentTitle === null && currentContent.length === 0) return;

                                sections.push({
                                  title: (currentTitle ?? t("Reasoning")).trim() || t("Reasoning"),
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
                                  title: t("Reasoning"),
                                  content: [],
                                });
                              }

                              return sections.map((s, sIdx) => {
                                const content = s.content.join("\n").trim();
                                return (
                                  <ChainOfThoughtStep
                                    key={`${message.id}-cot-${i}-${sIdx}`}
                                    icon={BrainIcon}
                                    label={s.title || t("Reasoning")}
                                    description={content || t("No details")}
                                    className="whitespace-pre-wrap"
                                    status="complete"
                                  />
                                );
                              });
                            }

                            if (part.type === "tool-search") {
                              const isSearching =
                                part.state !== "output-available" && part.state !== "output-error";
                              const searchResults = isSearchResultArray(part.output)
                                ? part.output
                                : [];
                              return (
                                <ChainOfThoughtStep
                                  key={`${message.id}-cot-${i}`}
                                  icon={Globe}
                                  label={
                                    isSearching ? (
                                      <Shimmer duration={2}>{t("Searching...")}</Shimmer>
                                    ) : part.state === "output-error" ? (
                                      t("Search failed")
                                    ) : (
                                      t("Found {count} results", {
                                        count: searchResults.length.toString(),
                                      })
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
                      <Message key={`${message.id}-text-${i}`} from={message.role}>
                        <MessageContent>
                          <MessageResponse>{part.text}</MessageResponse>
                        </MessageContent>
                        {i === textParts.length - 1 && showMessageActions && (
                          <MessageActions>
                            <MessageAction
                              disabled={isSubmitBlocked}
                              onClick={() =>
                                regenerate({
                                  body: requestBody,
                                })
                              }
                              label={t("Retry")}
                              tooltip={t("Retry")}
                            >
                              <RefreshCcwIcon className="size-3.5" />
                            </MessageAction>
                            <MessageAction
                              onClick={() => navigator.clipboard.writeText(part.text)}
                              label={t("Copy")}
                              tooltip={t("Copy")}
                            >
                              <CopyIcon className="size-3.5" />
                            </MessageAction>
                          </MessageActions>
                        )}
                      </Message>
                    ))}

                  {message.parts?.filter(isVideoToolPart).map((part, i) => {
                    if (part.state !== "output-available" && part.state !== "output-error") {
                      return (
                        <Message key={`${message.id}-video-${i}`} from="assistant">
                          <MessageContent className="w-full gap-2 rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Spinner className="size-4" />
                              <span>{t("Generating video...")}</span>
                            </div>
                          </MessageContent>
                        </Message>
                      );
                    }

                    if (part.state === "output-error") {
                      return (
                        <Message key={`${message.id}-video-${i}`} from="assistant">
                          <MessageContent className="w-full">
                            <Alert className="border-destructive/50 bg-destructive/10 text-destructive">
                              <AlertTitle>{t("Video generation failed")}</AlertTitle>
                              <AlertDescription>
                                {t("Please try again with a different prompt.")}
                              </AlertDescription>
                            </Alert>
                          </MessageContent>
                        </Message>
                      );
                    }

                    const output = isVideoToolOutput(part.output) ? part.output : null;

                    if (!output) {
                      return (
                        <Message key={`${message.id}-video-${i}`} from="assistant">
                          <MessageContent className="w-full">
                            <Alert className="border-destructive/50 bg-destructive/10 text-destructive">
                              <AlertTitle>{t("Video response unavailable")}</AlertTitle>
                              <AlertDescription>
                                {t("The video output could not be displayed.")}
                              </AlertDescription>
                            </Alert>
                          </MessageContent>
                        </Message>
                      );
                    }

                    const resolvedModelLabel = resolveVeoModelLabel(
                      output.model,
                      output.modelLabel,
                    );

                    return (
                      <Message key={`${message.id}-video-${i}`} from="assistant">
                        <MessageContent className="w-full gap-3 rounded-lg border border-border/60 bg-background/90 px-4 py-3">
                          {output.negativePrompt && (
                            <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs">
                              <p className="text-xs font-medium text-foreground">
                                {t("Negative prompt")}
                              </p>
                              <p className="text-muted-foreground">{output.negativePrompt}</p>
                            </div>
                          )}
                          <div className="overflow-hidden rounded-lg border border-border/70 bg-muted/30">
                            {/* oxlint-disable-next-line: generated videos don't include captions. */}
                            <video controls src={output.videoUrl} className="h-auto w-full" />
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            {output.resolution && (
                              <Badge variant="secondary">{output.resolution}</Badge>
                            )}
                            {output.aspectRatio && (
                              <Badge variant="secondary">{output.aspectRatio}</Badge>
                            )}
                            {output.durationSeconds && (
                              <Badge variant="secondary">{output.durationSeconds}s</Badge>
                            )}
                            {resolvedModelLabel ? (
                              <Badge variant="outline">{resolvedModelLabel}</Badge>
                            ) : null}
                            {output.seed !== null && output.seed !== undefined && (
                              <Badge variant="outline">
                                {t("Seed {seed}", {
                                  seed: output.seed.toString(),
                                })}
                              </Badge>
                            )}
                          </div>
                          {output.operationName && (
                            <p className="break-words text-xs text-muted-foreground">
                              {t("Operation: {name}", {
                                name: output.operationName,
                              })}
                            </p>
                          )}
                          <div>
                            <Button asChild size="sm" variant="outline">
                              <a href={output.videoUrl} download>
                                {t("Download video")}
                              </a>
                            </Button>
                          </div>
                        </MessageContent>
                      </Message>
                    );
                  })}

                  {message.parts?.filter(isImageToolPart).map((part, i) => {
                    if (part.state !== "output-available" && part.state !== "output-error") {
                      return (
                        <Message key={`${message.id}-image-${i}`} from="assistant">
                          <MessageContent className="w-full gap-2 rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Spinner className="size-4" />
                              <span>{t("Generating image...")}</span>
                            </div>
                          </MessageContent>
                        </Message>
                      );
                    }

                    if (part.state === "output-error") {
                      return (
                        <Message key={`${message.id}-image-${i}`} from="assistant">
                          <MessageContent className="w-full">
                            <Alert className="border-destructive/50 bg-destructive/10 text-destructive">
                              <AlertTitle>{t("Image generation failed")}</AlertTitle>
                              <AlertDescription>
                                {t("Please try again with a different prompt.")}
                              </AlertDescription>
                            </Alert>
                          </MessageContent>
                        </Message>
                      );
                    }

                    const output = isImageToolOutput(part.output) ? part.output : null;

                    if (!output) {
                      return (
                        <Message key={`${message.id}-image-${i}`} from="assistant">
                          <MessageContent className="w-full">
                            <Alert className="border-destructive/50 bg-destructive/10 text-destructive">
                              <AlertTitle>{t("Image response unavailable")}</AlertTitle>
                              <AlertDescription>
                                {t("The image output could not be displayed.")}
                              </AlertDescription>
                            </Alert>
                          </MessageContent>
                        </Message>
                      );
                    }

                    const resolvedModelLabel = resolveImageModelLabel(
                      output.model,
                      output.modelLabel,
                    );

                    return (
                      <Message key={`${message.id}-image-${i}`} from="assistant">
                        <MessageContent className="w-full gap-3 rounded-lg border border-border/60 bg-background/90 px-4 py-3">
                          <div className="grid gap-3">
                            {output.imageUrls.map((imageUrl: string, idx: number) => (
                              <div
                                key={`${message.id}-image-${i}-img-${idx}`}
                                className="overflow-hidden rounded-lg border border-border/70 bg-muted/30"
                              >
                                {/* oxlint-disable-next-line: generated images don't include captions. */}
                                <img
                                  src={imageUrl}
                                  alt={t("Generated image {index}", { index: String(idx + 1) })}
                                  className="h-auto w-full"
                                />
                              </div>
                            ))}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            {output.resolution && (
                              <Badge variant="secondary">{output.resolution}</Badge>
                            )}
                            {output.aspectRatio && (
                              <Badge variant="secondary">{output.aspectRatio}</Badge>
                            )}
                            {output.numberOfImages && output.numberOfImages > 1 && (
                              <Badge variant="secondary">
                                {t("{count} images", { count: String(output.numberOfImages) })}
                              </Badge>
                            )}
                            {resolvedModelLabel ? (
                              <Badge variant="outline">{resolvedModelLabel}</Badge>
                            ) : null}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {output.imageUrls.map((imageUrl: string, idx: number) => (
                              <Button key={`download-${idx}`} asChild size="sm" variant="outline">
                                <a
                                  href={imageUrl}
                                  download={t("image-{index}.png", { index: String(idx + 1) })}
                                >
                                  {t("Download image {index}", { index: String(idx + 1) })}
                                </a>
                              </Button>
                            ))}
                          </div>
                        </MessageContent>
                      </Message>
                    );
                  })}

                  {/* ソース */}
                  {message.parts?.some((p) => p.type === "source-url") && (
                    <Sources className="mt-2">
                      <SourcesTrigger
                        count={message.parts.filter((p) => p.type === "source-url").length}
                      >
                        {t("Sources")}
                      </SourcesTrigger>
                      <SourcesContent>
                        {message.parts
                          .filter((p) => p.type === "source-url")
                          .map((part, index) => (
                            <Source
                              key={`${message.id}-source-${index}`}
                              href={part.url || "#"}
                              title={part.title || part.url || t("Source")}
                            />
                          ))}
                      </SourcesContent>
                    </Sources>
                  )}
                </div>
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

      {isByokMissingConfig && (
        <Alert className="mt-3 border-destructive/40 bg-destructive/10 text-destructive-foreground dark:border-destructive/30">
          <Ban className="mt-0.5 size-4" />
          <AlertTitle>{t("Endpoint not configured")}</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <p>
              {t("Configure an OpenAI-compatible base URL and API key before using this model.")}
            </p>
            {!isAnonymous && (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" asChild>
                  <Link href="/settings/providers">
                    {t("Open settings")}
                    <ArrowUpRight className="ml-1.5 size-3.5" />
                  </Link>
                </Button>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {isByokActive && !isByokMissingConfig && (
        <Alert className="mt-3 border-emerald-500/40 bg-emerald-100/40 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-50">
          <Plug className="mt-0.5 size-4" />
          <AlertTitle>{t("BYOK active")}</AlertTitle>
          <AlertDescription>
            {t("Requests use your own API key and do not count toward usage limits.")}
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
            {isUsageBlocked ? t("Usage limit reached") : t("You are running low")}
          </AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <p>
              {isUsageBlocked
                ? t("You've hit the {category} usage limit on your {tier} plan.", {
                    category: usageCategoryLabel,
                    tier: usageTierLabel,
                  })
                : remainingUsage === null || remainingUsage === undefined
                  ? t("Only a few {category} requests left on your {tier} plan.", {
                      category: usageCategoryLabel,
                      tier: usageTierLabel,
                    })
                  : t(
                      "Only {count, plural, one {#} other {#}} {category} requests left on your {tier} plan.",
                      {
                        count: remainingUsage,
                        category: usageCategoryLabel,
                        tier: usageTierLabel,
                      },
                    )}
            </p>
            <div className="flex flex-wrap gap-2">
              {!isAnonymous && !billingDisabled && (
                <Button size="sm" asChild>
                  <Link href="/settings/billing">
                    {t("Upgrade plan")}
                    <ArrowUpRight className="ml-1.5 size-3.5" />
                  </Link>
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => usageQuery.refetch()}>
                {t("Refresh usage")}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

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

"use client";

import type { ToolUIPart, UIDataTypes, UIMessage, UIMessagePart, UITools } from "ai";
import {
  ArrowUpIcon,
  BookmarkPlusIcon,
  BrainIcon,
  CheckIcon,
  CopyIcon,
  Globe,
  ListFilterIcon,
  RefreshCcwIcon,
} from "lucide-react";
import Link from "next/link";
import { useExtracted } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtSearchResult,
  ChainOfThoughtSearchResults,
  ChainOfThoughtStep,
} from "@/components/ai-elements/chain-of-thought";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Source, Sources, SourcesContent, SourcesTrigger } from "@/components/ai-elements/sources";
import type { ReasoningEffort } from "@/components/chat/chat-composer";
import {
  isImageToolOutput,
  isSearchResultArray,
  isVideoToolOutput,
  resolveImageModelLabel,
  resolveVeoModelLabel,
  type ImageToolOutput,
  type VideoToolOutput,
} from "@/components/chat/chat-utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { trpc } from "@/lib/trpc/react";
import type { ModelOption } from "./chat-composer";

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

type TextMessagePart = Extract<UIMessage["parts"][number], { type: "text"; text: string }>;

const isTextMessagePart = (part: UIMessage["parts"][number]): part is TextMessagePart =>
  part.type === "text";

interface RequestBody {
  model: string;
  webSearch: boolean;
  reasoningEffort: ReasoningEffort;
  video: boolean;
  image: boolean;
  id: string;
  deepResearch?: boolean;
  responseStyle?: "retry" | "detailed" | "concise";
  forceWebSearch?: boolean;
  additionalInstruction?: string;
}

interface AssistantMessageProps {
  message: UIMessage;
  isLastMessage: boolean;
  isStreaming: boolean;
  showActions: boolean;
  isSubmitBlocked: boolean;
  projectId?: string | null;
  requestBody: RequestBody;
  onRegenerate: (options?: { body?: RequestBody; messageId?: string }) => void;
  availableModels: ModelOption[];
  onModelChange: (value: string) => void;
  onWebSearchChange: (value: boolean) => void;
}

export function AssistantMessage({
  message,
  isLastMessage,
  isStreaming,
  showActions,
  isSubmitBlocked,
  projectId,
  requestBody,
  onRegenerate,
  availableModels,
  onModelChange,
  onWebSearchChange,
}: AssistantMessageProps) {
  const t = useExtracted();
  const isStreamingThis = isStreaming && isLastMessage;
  const [retryMenuOpen, setRetryMenuOpen] = useState(false);
  const [additionalInstruction, setAdditionalInstruction] = useState("");
  const saveArtifact = trpc.projects.createArtifactFromText.useMutation({
    onSuccess: () => {
      toast.success(t("Saved as artifact"));
    },
    onError: (error) => {
      toast.error(error.message || t("Failed to save artifact"));
    },
  });

  const textContent =
    message.parts
      ?.filter(isTextMessagePart)
      .map((part) => part.text.trim())
      .filter(Boolean)
      .join("\n\n") ?? "";

  const handleSaveAsArtifact = () => {
    if (!projectId || !textContent.trim()) {
      return;
    }

    saveArtifact.mutate({
      projectId,
      text: textContent,
      positionX: 120 + (Date.now() % 160),
      positionY: 120 + (Date.now() % 120),
    });
  };

  const regenerateMessage = (overrides?: Partial<RequestBody>) => {
    onRegenerate({
      messageId: message.id,
      body: {
        ...requestBody,
        responseStyle: "retry",
        forceWebSearch: false,
        additionalInstruction: undefined,
        ...overrides,
      },
    });
  };
  const handleAdditionalInstructionSubmit = () => {
    const instruction = additionalInstruction.trim();
    if (!instruction) {
      return;
    }
    regenerateMessage({ additionalInstruction: instruction });
    setAdditionalInstruction("");
    setRetryMenuOpen(false);
  };

  return (
    <div className="space-y-2">
      {/* Chain of Thought - reasoning と search を統合表示 */}
      {message.parts?.some((p) => p.type === "reasoning" || p.type === "tool-search") && (
        <ChainOfThought defaultOpen={isStreamingThis}>
          <ChainOfThoughtHeader>
            {isStreamingThis && !message.parts?.some((p) => p.type === "text") ? (
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
                  const searchResults = isSearchResultArray(part.output) ? part.output : [];
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

      {message.parts
        ?.filter((p) => p.type === "text")
        .map((part, i, textParts) => (
          <Message key={`${message.id}-text-${i}`} from={message.role}>
            <MessageContent>
              <MessageResponse>{part.text}</MessageResponse>
            </MessageContent>
            {i === textParts.length - 1 && showActions && (
              <MessageActions>
                <DropdownMenu
                  open={retryMenuOpen}
                  onOpenChange={(open) => {
                    setRetryMenuOpen(open);
                    if (!open) {
                      setAdditionalInstruction("");
                    }
                  }}
                >
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            disabled={isSubmitBlocked}
                            aria-label={t("Retry")}
                          >
                            <RefreshCcwIcon className="size-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t("Retry")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <DropdownMenuContent align="start" className="w-64">
                    <form
                      className="flex items-center gap-2 p-1"
                      onSubmit={(event) => {
                        event.preventDefault();
                        handleAdditionalInstructionSubmit();
                      }}
                    >
                      <Input
                        value={additionalInstruction}
                        onChange={(event) => setAdditionalInstruction(event.target.value)}
                        placeholder={t("Refine this answer")}
                        aria-label={t("Refine this answer")}
                        className="h-7 bg-transparent! border-none! select-none! outline-none!"
                      />
                      <Button
                        type="submit"
                        size="icon-sm"
                        className="h-7"
                        disabled={isSubmitBlocked || additionalInstruction.trim().length === 0}
                        aria-label={t("Send")}
                      >
                        <ArrowUpIcon className="size-4" />
                      </Button>
                    </form>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => regenerateMessage()}>
                      <RefreshCcwIcon className="size-4" />
                      {t("Regenerate")}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={() => regenerateMessage({ responseStyle: "detailed" })}
                    >
                      <ListFilterIcon className="size-4" />
                      {t("Expand answer")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => regenerateMessage({ responseStyle: "concise" })}
                    >
                      <ListFilterIcon className="size-4" />
                      {t("Shorten answer")}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={() => {
                        onWebSearchChange(true);
                        regenerateMessage({
                          webSearch: true,
                          forceWebSearch: true,
                        });
                      }}
                    >
                      <Globe className="size-4" />
                      {t("Use web search")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => {
                        onWebSearchChange(true);
                        regenerateMessage({
                          webSearch: true,
                          deepResearch: true,
                          forceWebSearch: true,
                        });
                      }}
                    >
                      <BrainIcon className="size-4" />
                      {t("Run deep research")}
                    </DropdownMenuItem>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <BrainIcon className="size-4" />
                        {t("Change model")}
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="max-h-80 w-72 overflow-y-auto">
                        {availableModels.map((modelOption) => (
                          <DropdownMenuItem
                            key={modelOption.value}
                            onSelect={() => {
                              onModelChange(modelOption.value);
                              regenerateMessage({ model: modelOption.value });
                            }}
                          >
                            <CheckIcon
                              className={
                                modelOption.value === requestBody.model
                                  ? "size-4 opacity-100"
                                  : "size-4 opacity-0"
                              }
                            />
                            <span className="truncate">{modelOption.name}</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  </DropdownMenuContent>
                </DropdownMenu>
                <MessageAction
                  onClick={() => navigator.clipboard.writeText(part.text)}
                  label={t("Copy")}
                  tooltip={t("Copy")}
                >
                  <CopyIcon className="size-3.5" />
                </MessageAction>
                {projectId ? (
                  <MessageAction
                    onClick={handleSaveAsArtifact}
                    disabled={saveArtifact.isPending || !textContent.trim()}
                    label={t("Save as Artifact")}
                    tooltip={t("Save as Artifact")}
                  >
                    <BookmarkPlusIcon className="size-3.5" />
                  </MessageAction>
                ) : null}
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

        const resolvedModelLabel = resolveVeoModelLabel(output.model, output.modelLabel, t);

        return (
          <Message key={`${message.id}-video-${i}`} from="assistant">
            <MessageContent className="w-full gap-3 rounded-lg border border-border/60 bg-background/90 px-4 py-3">
              {output.negativePrompt && (
                <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs">
                  <p className="text-xs font-medium text-foreground">{t("Negative prompt")}</p>
                  <p className="text-muted-foreground">{output.negativePrompt}</p>
                </div>
              )}
              <div className="overflow-hidden rounded-lg border border-border/70 bg-muted/30">
                {/* oxlint-disable-next-line: generated videos don't include captions. */}
                <video controls src={output.videoUrl} className="h-auto w-full" />
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {output.resolution && <Badge variant="secondary">{output.resolution}</Badge>}
                {output.aspectRatio && <Badge variant="secondary">{output.aspectRatio}</Badge>}
                {output.durationSeconds && (
                  <Badge variant="secondary">{output.durationSeconds}s</Badge>
                )}
                {resolvedModelLabel ? <Badge variant="outline">{resolvedModelLabel}</Badge> : null}
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

        const resolvedModelLabel = resolveImageModelLabel(output.model, output.modelLabel);

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
                      alt={t("Generated image {index}", {
                        index: String(idx + 1),
                      })}
                      className="h-auto w-full"
                    />
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {output.resolution && <Badge variant="secondary">{output.resolution}</Badge>}
                {output.aspectRatio && <Badge variant="secondary">{output.aspectRatio}</Badge>}
                {output.numberOfImages && output.numberOfImages > 1 && (
                  <Badge variant="secondary">
                    {t("{count} images", {
                      count: String(output.numberOfImages),
                    })}
                  </Badge>
                )}
                {resolvedModelLabel ? <Badge variant="outline">{resolvedModelLabel}</Badge> : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {output.imageUrls.map((imageUrl: string, idx: number) => (
                  <Button key={`download-${idx}`} asChild size="sm" variant="outline">
                    <a
                      href={imageUrl}
                      download={t("image-{index}.png", {
                        index: String(idx + 1),
                      })}
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
          <SourcesTrigger count={message.parts.filter((p) => p.type === "source-url").length}>
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
  );
}

"use client";

import type { ToolUIPart, UIDataTypes, UIMessage, UIMessagePart, UITools } from "ai";
import { BrainIcon, CopyIcon, Globe, RefreshCcwIcon } from "lucide-react";
import Link from "next/link";
import { useExtracted } from "next-intl";
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
import { Spinner } from "@/components/ui/spinner";

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

interface RequestBody {
  model: string;
  webSearch: boolean;
  reasoningEffort: ReasoningEffort;
  video: boolean;
  image: boolean;
  id: string;
}

interface AssistantMessageProps {
  message: UIMessage;
  isLastMessage: boolean;
  isStreaming: boolean;
  showActions: boolean;
  isSubmitBlocked: boolean;
  requestBody: RequestBody;
  onRegenerate: (options: { body: RequestBody }) => void;
}

export function AssistantMessage({
  message,
  isLastMessage,
  isStreaming,
  showActions,
  isSubmitBlocked,
  requestBody,
  onRegenerate,
}: AssistantMessageProps) {
  const t = useExtracted();
  const isStreamingThis = isStreaming && isLastMessage;

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

      {/* テキスト応答 */}
      {message.parts
        ?.filter((p) => p.type === "text")
        .map((part, i, textParts) => (
          <Message key={`${message.id}-text-${i}`} from={message.role}>
            <MessageContent>
              <MessageResponse>{part.text}</MessageResponse>
            </MessageContent>
            {i === textParts.length - 1 && showActions && (
              <MessageActions>
                <MessageAction
                  disabled={isSubmitBlocked}
                  onClick={() =>
                    onRegenerate({
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
                      alt={t("Generated image {index}", { index: String(idx + 1) })}
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
                    {t("{count} images", { count: String(output.numberOfImages) })}
                  </Badge>
                )}
                {resolvedModelLabel ? <Badge variant="outline">{resolvedModelLabel}</Badge> : null}
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

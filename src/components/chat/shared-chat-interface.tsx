"use client";

import type { UIMessage } from "ai";
import { ChevronDownIcon, CopyIcon, GitFork, Globe, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useExtracted } from "next-intl";
import { toast } from "sonner";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { Reasoning, ReasoningContent, ReasoningTrigger } from "@/components/ai-elements/reasoning";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Spinner } from "@/components/ui/spinner";
import {
  isSearchResultArray,
  isVideoToolOutput,
  resolveVeoModelLabel,
} from "@/components/chat/chat-utils";
import { trpc } from "@/lib/trpc/react";
import { cn } from "@/lib/utils";

interface SharedChatInterfaceProps {
  shareId: string;
  chat: { id: string; title: string | null };
  messages: UIMessage[];
  owner: { id: string; name: string; image: string | null } | null | undefined;
  allowFork: boolean;
  isOwner: boolean;
  isLoggedIn: boolean;
}

export function SharedChatInterface({
  shareId,
  chat,
  messages,
  owner,
  allowFork,
  isOwner: _isOwner,
  isLoggedIn,
}: SharedChatInterfaceProps) {
  const t = useExtracted();
  const router = useRouter();

  const forkChat = trpc.share.forkChat.useMutation({
    onSuccess: (forkedChat) => {
      toast.success(t("Conversation forked!"));
      router.push(`/chat/${forkedChat.id}`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleFork = () => {
    if (!isLoggedIn) {
      router.push("/auth/sign-in");
      return;
    }
    forkChat.mutate({ shareId });
  };

  return (
    <div className="flex h-full flex-1 min-h-0 flex-col w-full max-w-3xl mx-auto p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-4 pb-4 border-b">
        <div className="flex items-center gap-3">
          <Avatar className="size-8">
            <AvatarImage src={owner?.image ?? undefined} />
            <AvatarFallback>
              <User className="size-4" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-semibold">{chat.title || t("Untitled")}</h1>
            <p className="text-xs text-muted-foreground">
              {t("Shared by {name}", { name: owner?.name || t("Unknown") })}
            </p>
          </div>
        </div>

        {allowFork && (
          <Button onClick={handleFork} disabled={forkChat.isPending}>
            {forkChat.isPending ? <Spinner /> : <GitFork className="size-4" />}
            {isLoggedIn ? t("Fork & Continue") : t("Sign in to Fork")}
          </Button>
        )}
      </div>

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
                  {message.parts?.map((part, i) => {
                    switch (part.type) {
                      case "text":
                        return (
                          <Message key={`${message.id}-${i}`} from={message.role}>
                            <MessageContent>
                              <MessageResponse>{part.text}</MessageResponse>
                            </MessageContent>
                            {i === (message.parts?.length ?? 0) - 1 && (
                              <MessageActions>
                                <MessageAction
                                  onClick={() => navigator.clipboard.writeText(part.text)}
                                  label={t("Copy")}
                                >
                                  <CopyIcon className="size-3.5" />
                                </MessageAction>
                              </MessageActions>
                            )}
                          </Message>
                        );
                      case "reasoning":
                        return (
                          <Reasoning key={`${message.id}-${i}`} className="w-full">
                            <ReasoningTrigger />
                            <ReasoningContent>{part.text}</ReasoningContent>
                          </Reasoning>
                        );
                      case "tool-search": {
                        if (part.state !== "output-available" && part.state !== "output-error") {
                          return (
                            <div
                              key={part.toolCallId}
                              className="flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
                            >
                              <Globe className="size-4" />
                              <Shimmer>{t("Searching...")}</Shimmer>
                            </div>
                          );
                        }

                        if (part.state === "output-error") {
                          return (
                            <div
                              key={part.toolCallId}
                              className="flex items-center gap-2 text-muted-foreground text-sm"
                            >
                              <Globe className="size-4" />
                              {t("Search failed")}
                            </div>
                          );
                        }

                        const searchResults = isSearchResultArray(part.output) ? part.output : [];

                        return (
                          <div className="w-full my-4" key={`${message.id}-${i}`}>
                            <Collapsible>
                              <CollapsibleTrigger className="flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground">
                                <Globe className="size-4" />
                                {t("Searched {count} websites", {
                                  count: searchResults.length.toString(),
                                })}
                                {searchResults.length !== 0 && (
                                  <ChevronDownIcon
                                    className={cn(
                                      "size-4 ml-auto transition-transform",
                                      "group-data-[state=open]:rotate-180",
                                    )}
                                  />
                                )}
                              </CollapsibleTrigger>
                              <CollapsibleContent
                                className={cn(
                                  "data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-muted-foreground outline-none data-[state=closed]:animate-out data-[state=open]:animate-in",
                                )}
                              >
                                <div className="space-y-4 mt-4">
                                  {searchResults.map((result) => (
                                    <div
                                      key={result.url}
                                      className="p-0! bg-accent/40 hover:bg-accent rounded-md transition-colors"
                                    >
                                      <Link
                                        href={result.url}
                                        className="block p-3"
                                        target="_blank"
                                        rel="noopener noreferrer"
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
                                        <div className="text-xs text-muted-foreground line-clamp-3">
                                          {result.description.slice(0, 100)}
                                          {result.description.length > 100 && "..."}
                                        </div>
                                      </Link>
                                    </div>
                                  ))}
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          </div>
                        );
                      }
                      case "tool-video": {
                        if (part.state !== "output-available" && part.state !== "output-error") {
                          return (
                            <Message key={`${message.id}-${i}`} from={message.role}>
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
                            <Message key={`${message.id}-${i}`} from={message.role}>
                              <MessageContent className="w-full text-sm text-destructive">
                                {t("Video generation failed.")}
                              </MessageContent>
                            </Message>
                          );
                        }

                        const output = isVideoToolOutput(part.output) ? part.output : null;

                        if (!output) {
                          return (
                            <Message key={`${message.id}-${i}`} from={message.role}>
                              <MessageContent className="w-full text-sm text-destructive">
                                {t("Video output unavailable.")}
                              </MessageContent>
                            </Message>
                          );
                        }

                        const resolvedModelLabel = resolveVeoModelLabel(
                          output.model,
                          output.modelLabel,
                          t,
                        );

                        return (
                          <Message key={`${message.id}-${i}`} from={message.role}>
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
                      }
                      default:
                        return null;
                    }
                  })}
                </div>
              )}
            </div>
          ))}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
    </div>
  );
}

import {
  FC,
  memo,
  useEffect,
  useMemo,
  useState,
  useCallback,
  Fragment,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Clock,
  Copy,
  MousePointer,
  RefreshCw,
  Paintbrush,
  X,
  Search,
  Bot,
} from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { EasyTip } from "@/components/easytip";
import { Pre } from "@/components/markdown";
import Image from "next/image";
import { UIMessage } from "ai";
import React from "react";
import { marked } from "marked";
import { useChatSessions } from "@/hooks/use-chat-sessions";
import { Link as MarkdownLink } from "@/components/markdown";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import { SiBrave, SiGoogle } from "@icons-pack/react-simple-icons";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  modelDescriptions,
  modelDescriptionType,
} from "@/lib/modelDescriptions";
import Canvas from "./Canvas";
import { useCanvas } from "@/context/CanvasContext";
import { ModelSelector } from "./ModelSelector";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet";

interface DeepResearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
  message: UIMessage | null;
}

const DeepResearchPanel: FC<DeepResearchPanelProps> = ({
  isOpen,
  onClose,
  message,
}) => {
  const t = useTranslations();

  if (!message) return null;

  const renderPart = (part: UIMessage["parts"][number], index: number) => {
    switch (part.type) {
      case "tool-invocation":
        const { toolName, args, state, toolCallId } = part.toolInvocation;
        const result =
          state === "result" ? part.toolInvocation.result : undefined;
        const key = `${message.id}_panel_tool_${toolCallId}_${index}`;

        if (toolName === "search") {
          const query = args?.query || t("messageLog.unknownSearch");
          const searchResults =
            state === "result" && result
              ? (JSON.parse(result) as {
                  searchResults: {
                    title: string;
                    url: string;
                    summary: string;
                    description: string;
                    type: string;
                  }[];
                  type: string;
                })
              : null;

          return (
            <div key={key} className="mb-1 w-full max-w-full px-3 rounded-lg">
              <p className="font-medium mb-1 inline-flex items-center gap-1">
                <Search size={16} className="text-primary" />{" "}
                {t("messageLog.searchedFor")} {query}
              </p>
              {state === "result" && searchResults ? (
                searchResults.searchResults.map((item, idx) => (
                  <div key={`${key}_result_${idx}`} className="mt-1">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold hover:underline block truncate"
                    >
                      <div className="inline-flex items-center gap-1">
                        <Search size={16} />
                        <span className="block truncate">{item.title}</span>
                      </div>
                    </a>
                    <div className="flex items-start my-2 gap-2 w-full">
                      <Bot size={24} />
                      <span className="text-muted-foreground w-full">
                        {item.summary}
                      </span>
                    </div>
                  </div>
                ))
              ) : state === "call" || state === "partial-call" ? (
                <span className="text-xs text-muted-foreground animate-pulse">
                  {t("messageLog.searching")}...
                </span>
              ) : (
                <span className="text-xs text-red-500">
                  {t("messageLog.searchFailed")}
                </span>
              )}
            </div>
          );
        } else if (toolName === "canvas") {
          const title = args?.title || t("messageLog.untitledCanvas");
          return (
            <div key={key} className="mb-3 p-3 rounded-lg">
              <p className="text-sm font-semibold text-muted-foreground mb-1 inline-flex items-center gap-1">
                <Paintbrush size={14} /> {t("messageLog.updatedCanvas")} "
                {title}"
              </p>
              <br />
              {state === "result" ? (
                <span className="text-xs text-green-500">
                  {t("messageLog.canvasUpdateSuccess")}
                </span>
              ) : state === "call" || state === "partial-call" ? (
                <span className="text-xs text-muted-foreground animate-pulse">
                  {t("messageLog.updatingCanvas")}...
                </span>
              ) : (
                <span className="text-xs text-red-500">
                  {t("messageLog.canvasUpdateFailed")}
                </span>
              )}
            </div>
          );
        }
        return null;
      default:
        return null;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        className="w-full sm:w-3/4 lg:w-1/2 xl:w-1/3 !max-w-full p-0 flex flex-col"
        side="right"
      >
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center justify-between">
            {t("messageLog.activityLog")}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full"
            >
              <X size={18} />
            </Button>
          </SheetTitle>
        </SheetHeader>
        <div className="flex-grow p-4 w-full overflow-y-auto overflow-x-auto scrollbar-thin scrollbar-thumb-primary scrollbar-track-secondary scrollbar-thumb-rounded-md scrollbar-track-rounded-md">
          {message.parts.map((part, index) => renderPart(part, index))}
        </div>
      </SheetContent>
    </Sheet>
  );
};
DeepResearchPanel.displayName = "DeepResearchPanel";

interface MessageLogProps {
  message: UIMessage;
  sessionId: string;
  onRegenerate?: (model: string) => void;
}

export const MemoMarkdown = memo(
  ({ content }: { content: string }) => {
    return (
      <div className="text-sm md:text-base">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{ pre: Pre, a: MarkdownLink }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  },
  (prevProps, nextProps) => {
    if (prevProps.content !== nextProps.content) return false;
    return true;
  }
);
MemoMarkdown.displayName = "MemoMarkdown";

function parseMarkdownIntoBlocks(markdown: string): string[] {
  const tokens = marked.lexer(markdown);
  return tokens.map((token) => token.raw);
}

export const MemoizedMarkdown = memo(
  ({ content, id }: { content: string; id: string }) => {
    const blocks = useMemo(() => parseMarkdownIntoBlocks(content), [content]);

    return blocks.map((block, index) => (
      <MemoMarkdown content={block} key={`${id}-block_${index}`} />
    ));
  }
);
MemoizedMarkdown.displayName = "MemoizedMarkdown";

interface MessageState {
  model: string;
  canvasContent?: string;
  canvasTitle?: string;
  generationTime?: number;
}

interface messageAnnotation {
  model?: string;
  title?: string;
  canvasContent?: string;
  canvasTitle?: string;
  generationTime?: number;
}

const MessageControls = memo(
  ({
    messageContent,
    onRegenerate,
    model,
    modelDescriptions,
    generationTime,
  }: {
    messageContent: string;
    onRegenerate?: (model: string) => void;
    model: string;
    modelDescriptions: modelDescriptionType;
    generationTime?: number;
  }) => {
    const t = useTranslations();

    const handleCopy = () => {
      navigator.clipboard.writeText(messageContent);
      toast.success(t("messageLog.copied"));
    };

    const handleModelChange = (selectedModel: string) => {
      if (onRegenerate) {
        onRegenerate(selectedModel);
      }
    };

    const formatTime = (ms: number) => {
      if (ms < 1000) return `${ms}ms`;

      const seconds = Math.floor(ms / 1000);
      if (seconds < 60) return `${seconds}${t("messageLog.second")}`;

      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      if (minutes < 60) {
        return `${minutes}${t("messageLog.minute")} ${remainingSeconds}${t("messageLog.second")}`;
      }

      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}${t("messageLog.hour")} ${remainingMinutes}${t("messageLog.minute")} ${remainingSeconds}${t("messageLog.second")}`;
    };

    return (
      <div className="flex items-center justify-between rounded mt-3 bg-secondary">
        <div className="flex items-center">
          <div className="p-1 text-gray-400 hover:text-foreground">
            <EasyTip content={t("messageLog.copy")}>
              <Button
                className="p-0 mx-1 rounded-full"
                variant={"ghost"}
                onClick={handleCopy}
              >
                <Copy size="16" />
              </Button>
            </EasyTip>
          </div>
          {generationTime && (
            <div className="flex items-center p-2 text-sm cursor-default text-muted-foreground">
              <Clock size={16} className="mr-1" />
              <span>
                {t("messageLog.generationTime")} {formatTime(generationTime)}
              </span>
            </div>
          )}
          {onRegenerate && (
            <div className="flex items-center">
              <div className="p-1 text-gray-400 hover:text-foreground">
                <EasyTip content={t("messageLog.regenerate")}>
                  <ModelSelector
                    modelDescriptions={modelDescriptions}
                    model={model}
                    handleModelChange={handleModelChange}
                    refreshIcon={true}
                  />
                </EasyTip>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.messageContent === nextProps.messageContent &&
      prevProps.model === nextProps.model &&
      prevProps.modelDescriptions === nextProps.modelDescriptions &&
      prevProps.generationTime === nextProps.generationTime
    );
  }
);
MessageControls.displayName = "MessageControls";

export const MessageLog: FC<MessageLogProps> = memo(
  ({ message, sessionId, onRegenerate }) => {
    const [model, setModel] = useState<string>(
      "openai/gpt-4.1-mini-2025-04-14"
    );
    const [canvasContent, setCanvasContent] = useState<string | undefined>(
      undefined
    );
    const [canvasTitle, setCanvasTitle] = useState<string | undefined>(
      undefined
    );
    const [generationTime, setGenerationTime] = useState<number | undefined>(
      undefined
    );

    const [reasoningStates, setReasoningStates] = useState<
      Record<string, "inProgress" | "completed">
    >({});

    const [showCanvas, setShowCanvas] = useState(false);
    const [renderedSearch, setRenderedSearch] = useState(false);
    const { getCanvasData, updateCanvas } = useCanvas();
    const sessionCanvasData = useMemo(() => {
      return getCanvasData(sessionId);
    }, [getCanvasData, sessionId]);

    const sessionCanvasDataRef = React.useRef(sessionCanvasData);
    useEffect(() => {
      sessionCanvasDataRef.current = sessionCanvasData;
    }, [sessionCanvasData]);

    const { getSession, updateSession } = useChatSessions();
    const t = useTranslations();

    const toolInvocations = React.useMemo(
      () => message.parts.filter((part) => part.type === "tool-invocation"),
      [message.parts]
    );

    const searchInvocations = React.useMemo(
      () =>
        toolInvocations.filter(
          (part) => part.toolInvocation.toolName === "search"
        ),
      [toolInvocations]
    );

    const canvasInvocations = React.useMemo(
      () =>
        toolInvocations.filter(
          (part) => part.toolInvocation.toolName === "canvas"
        ),
      [toolInvocations]
    );

    const annotationsKey = useMemo(
      () => JSON.stringify(message.annotations || []),
      [message.annotations]
    );

    useEffect(() => {
      const annotations = message.annotations;
      if (!annotations) return;

      console.log(annotations);

      const modelAnnotation = annotations.find(
        (a) => (a as messageAnnotation).model
      );
      if (modelAnnotation) {
        setModel(
          (modelAnnotation as messageAnnotation).model ||
            "openai/gpt-4.1-mini-2025-04-14"
        );
      }

      const titleAnnotation = annotations.find((a) => (a as any).title);
      if (titleAnnotation) {
        const session = getSession(sessionId);
        if (session && session.title !== (titleAnnotation as any).title) {
          const updatedSession = {
            ...session,
            title: (titleAnnotation as any).title,
          };
          updateSession(sessionId, updatedSession);
        }
      }

      const canvasAnnotation = annotations.find(
        (a) => (a as messageAnnotation).canvasContent
      );
      if (canvasAnnotation) {
        const c = canvasAnnotation as messageAnnotation;
        setCanvasContent(c.canvasContent);
        setCanvasTitle(c.canvasTitle || "Untitled Document");

        updateCanvas(sessionId, {
          content: c.canvasContent || "",
          title: c.canvasTitle || "Untitled Document",
        });
      }

      const genAnnotation = annotations.find(
        (a) => (a as messageAnnotation).generationTime
      );
      if (genAnnotation) {
        setGenerationTime((genAnnotation as messageAnnotation).generationTime);
      }
    }, [annotationsKey, sessionId, getSession, updateSession, updateCanvas]);

    useEffect(() => {
      const processedInvocations = new Set<string>();

      const handler = () => {
        if (canvasInvocations.length > 0) {
          const latestInvocation =
            canvasInvocations[canvasInvocations.length - 1];
          if (
            latestInvocation &&
            latestInvocation.toolInvocation.args?.content &&
            latestInvocation.toolInvocation.state === "result"
          ) {
            const invocationId = latestInvocation.toolInvocation.toolCallId;
            if (processedInvocations.has(invocationId)) return;

            processedInvocations.add(invocationId);

            updateCanvas(sessionId, {
              content: latestInvocation.toolInvocation.args.content,
              title:
                latestInvocation.toolInvocation.args.title ||
                "Untitled Document",
            });
          }
        }
      };

      handler();

      return () => {
        processedInvocations.clear();
      };
    }, [canvasInvocations, sessionId, updateCanvas]);

    useEffect(() => {
      const reasoningParts = message.parts.filter(
        (part) => part.type === "reasoning" && part.reasoning
      );

      if (reasoningParts.length === 0) return;

      const newReasoningStates = { ...reasoningStates };
      let stateChanged = false;

      reasoningParts.forEach((part, index) => {
        const key = `${message.id}_reasoning_${index}`;

        if (newReasoningStates[key] === "completed") return;

        const hasTextParts = message.parts.some(
          (p) => p.type === "text" && p.text && p.text.trim().length > 0
        );

        if (hasTextParts || message.content) {
          newReasoningStates[key] = "completed";
          stateChanged = true;
        } else if (!newReasoningStates[key]) {
          newReasoningStates[key] = "inProgress";
          stateChanged = true;
        }
      });

      if (stateChanged) {
        setReasoningStates(newReasoningStates);
      }
    }, [message.parts, message.id, message.content, reasoningStates]);

    useEffect(() => {
      const inProgressKeys = Object.entries(reasoningStates)
        .filter(([_, state]) => state === "inProgress")
        .map(([key]) => key);

      if (inProgressKeys.length === 0) return;

      const timer = setTimeout(() => {
        setReasoningStates((prev) => {
          const newState = { ...prev };
          inProgressKeys.forEach((key) => {
            newState[key] = "completed";
          });
          return newState;
        });
      }, 5000);

      return () => clearTimeout(timer);
    }, [reasoningStates]);

    const handleShowCanvas = () => {
      setShowCanvas(true);
    };

    const handleCloseCanvas = () => {
      setShowCanvas(false);
    };

    const memoizedUpdateCanvas = useCallback(
      (sid: string, data: { content: string; title: string }) => {
        updateCanvas(sid, data);
      },
      [updateCanvas]
    );

    const canvasContentToShow = useMemo(() => {
      const currentCanvasData = sessionCanvasDataRef.current
        ? {
            content: sessionCanvasDataRef.current.content,
            title: sessionCanvasDataRef.current.title,
          }
        : null;

      if (currentCanvasData) {
        return currentCanvasData;
      }

      if (canvasContent) {
        return {
          content: canvasContent,
          title: canvasTitle || "Untitled Document",
        };
      }

      if (canvasInvocations.length > 0) {
        const latestInvocation =
          canvasInvocations[canvasInvocations.length - 1];
        if (latestInvocation && latestInvocation.toolInvocation.args?.content) {
          return {
            content: latestInvocation.toolInvocation.args.content,
            title:
              latestInvocation.toolInvocation.args.title || "Untitled Document",
          };
        }
      }

      return null;
    }, [canvasContent, canvasTitle, canvasInvocations]);

    const handleRegenerate = useCallback(
      (selectedModel: string) => {
        setModel(selectedModel);
        if (onRegenerate) {
          onRegenerate(selectedModel);
        }
      },
      [onRegenerate]
    );

    const [isDeepResearchPanelOpen, setIsDeepResearchPanelOpen] =
      useState(false);
    const [selectedMessageForPanel, setSelectedMessageForPanel] =
      useState<UIMessage | null>(null);

    const isDeepResearchMessage = useMemo(() => {
      return searchInvocations.some((inv) => {
        if (
          inv.type !== "tool-invocation" ||
          inv.toolInvocation.state !== "result"
        )
          return false;
        try {
          const result = JSON.parse(inv.toolInvocation.result);
          return result?.type === "deepResearch";
        } catch (e) {
          return false;
        }
      });
    }, [searchInvocations]);

    const firstSearchQuery = useMemo(() => {
      if (
        isDeepResearchMessage &&
        searchInvocations.length > 0 &&
        searchInvocations[0]?.type === "tool-invocation"
      ) {
        return (
          searchInvocations[0]?.toolInvocation.args?.query ||
          t("messageLog.unknownSearch")
        );
      }
      return null;
    }, [isDeepResearchMessage, searchInvocations, t]);

    const handleDeepResearchClick = useCallback(() => {
      setSelectedMessageForPanel(message);
      setIsDeepResearchPanelOpen(true);
    }, [message]);

    const handleCloseDeepResearchPanel = useCallback(() => {
      setIsDeepResearchPanelOpen(false);
      setSelectedMessageForPanel(null);
    }, []);

    return (
      <div className={`flex w-full message-log visible`}>
        <div
          className={`p-2 my-2 rounded-lg ${
            message.role == "assistant"
              ? "text-white w-full"
              : "bg-secondary ml-auto p-3"
          }`}
        >
          {message.role === "assistant" ? (
            <div key={message.id}>
              <div className="ml-3 prose dark:prose-invert w-full max-w-11/12">
                {isDeepResearchMessage ? (
                  <div
                    className="flex flex-col gap-1 bg-secondary w-full md:w-2/3 rounded-xl mb-4 px-4 py-3 overflow-hidden cursor-pointer hover:bg-secondary/80 transition-colors"
                    onClick={handleDeepResearchClick}
                  >
                    <span className="font-medium inline-flex items-center gap-1">
                      <Search size={16} className="text-primary" />{" "}
                      {t("messageLog.deepResearch")}
                    </span>
                    {firstSearchQuery && (
                      <span className="text-sm text-muted-foreground">
                        {t("messageLog.searchWord")} {firstSearchQuery}
                      </span>
                    )}
                    <span className="text-xs text-blue-400 mt-1">
                      {t("messageLog.clickForDetails")}
                    </span>
                  </div>
                ) : (
                  <>
                    {searchInvocations.map((inv, index) => {
                      if (inv.type !== "tool-invocation") return null;

                      const query =
                        inv.toolInvocation.args?.query ||
                        t("messageLog.unknownSearch");
                      const state = inv.toolInvocation.state;
                      const resultData =
                        state === "result"
                          ? inv.toolInvocation.result
                          : undefined;
                      let successfulInvocation: {
                        searchResults: {
                          title: string;
                          url: string;
                          description: string;
                        }[];
                        type?: string;
                      } | null = null;
                      if (state === "result" && resultData) {
                        try {
                          const parsed = JSON.parse(resultData);
                          if (parsed && Array.isArray(parsed.searchResults)) {
                            successfulInvocation = parsed;
                          }
                        } catch (e) {
                          console.error("Failed to parse search result:", e);
                        }
                      }
                      const callId = inv.toolInvocation.toolCallId;

                      return (
                        <div
                          className={`flex flex-col gap-1 bg-secondary w-full md:w-2/3 rounded-xl mb-4 px-4 py-3 overflow-hidden`}
                          key={`${callId}-search-${index}`}
                        >
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <SiBrave className="text-orange-400" />{" "}
                            {t("messageLog.braveSearch")}
                          </span>
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            {t("messageLog.searchWord")} {query}
                          </span>
                          {successfulInvocation ? (
                            successfulInvocation.searchResults.map(
                              (item, itemIndex) => (
                                <p
                                  key={`${callId}-${itemIndex}`}
                                  className="mb-0 mt-0 max-w-full"
                                >
                                  <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-white underline line-clamp-1 mb-0 overflow-hidden text-ellipsis"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {item.title}
                                  </a>
                                  <span className="text-muted-foreground overflow-hidden line-clamp-1">
                                    {item.description?.replace(/<[^>]*>/g, "")}
                                  </span>
                                </p>
                              )
                            )
                          ) : state === "call" || state === "partial-call" ? (
                            <span className="animate-pulse">
                              {t("messageLog.searching")}
                            </span>
                          ) : (
                            <span className="text-xs text-red-500">
                              {t("messageLog.searchFailed")}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </>
                )}

                {canvasContentToShow && (
                  <div className="mb-4">
                    <div
                      onClick={handleShowCanvas}
                      className="flex flex-col gap-1 bg-secondary w-full sm:w-fit md:w-1/2 rounded-lg p-3 cursor-pointer hover:bg-secondary/80 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Paintbrush size={16} className="text-primary" />
                        <span className="font-medium text-sm md:text-base">
                          {canvasContentToShow.title}
                        </span>
                      </div>
                      <span className="text-xs md:text-sm text-muted-foreground">
                        {t("canvas.clickToOpen")}
                      </span>
                    </div>
                    {showCanvas && canvasContentToShow && (
                      <Canvas
                        key={`canvas-${sessionId}`}
                        content={canvasContentToShow.content}
                        title={canvasContentToShow.title}
                        sessionId={sessionId}
                        onClose={handleCloseCanvas}
                        onUpdateCanvas={memoizedUpdateCanvas}
                      />
                    )}
                  </div>
                )}

                {message.parts.map((part, index) => {
                  switch (part.type) {
                    case "reasoning":
                      const reasoningKey = `${message.id}_reasoning_${index}`;
                      const isReasoningCompleted =
                        reasoningStates[reasoningKey] === "completed";

                      if (
                        (isReasoningCompleted ||
                          (part.reasoning &&
                            part.reasoning.trim().length > 0)) &&
                        !isDeepResearchMessage
                      ) {
                        return (
                          <Collapsible
                            key={reasoningKey}
                            defaultOpen={true}
                            className="mb-3"
                          >
                            <CollapsibleTrigger className="mb-0 text-sm">
                              <span className="text-muted-foreground">
                                {t("messageLog.reasoning")}
                              </span>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="border-l-2 mt-0 pl-4 outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2">
                              <MemoizedMarkdown
                                key={`${message.id}_reasoning_content_${index}`}
                                id={`${message.id}_assistant_reasoning_${index}`}
                                content={part.reasoning ?? ""}
                              />
                            </CollapsibleContent>
                          </Collapsible>
                        );
                      }
                      return null;

                    case "text":
                      if (part.text && part.text.trim().length > 0) {
                        return (
                          <MemoizedMarkdown
                            key={`${message.id}_text_${index}`}
                            id={`${message.id}_assistant_text_${index}`}
                            content={part.text}
                          />
                        );
                      }
                      return null;

                    case "tool-invocation":
                      if (
                        part.toolInvocation.toolName === "canvas" ||
                        part.toolInvocation.toolName === "search"
                      ) {
                        return null;
                      }
                      return null;

                    default:
                      return null;
                  }
                })}
              </div>
              <MessageControls
                messageContent={message.content}
                onRegenerate={handleRegenerate}
                model={model}
                modelDescriptions={modelDescriptions}
                generationTime={generationTime}
              />
            </div>
          ) : (
            <>
              {message.experimental_attachments && (
                <Image
                  alt={t("messageLog.image")}
                  src={message.experimental_attachments[0]?.url || ""}
                  width="300"
                  height="300"
                ></Image>
              )}
              <div className="prose dark:prose-invert text-sm md:text-base">
                {message.content}
              </div>
            </>
          )}
        </div>
        <DeepResearchPanel
          isOpen={isDeepResearchPanelOpen}
          onClose={handleCloseDeepResearchPanel}
          message={selectedMessageForPanel}
        />
      </div>
    );
  }
);
MessageLog.displayName = "MessageLog";

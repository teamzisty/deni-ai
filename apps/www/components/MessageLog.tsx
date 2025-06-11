import { FC, memo, useEffect, useMemo, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Clock,
  Copy,
  RefreshCw,
  Paintbrush,
  X,
  Search,
  Bot,
  MoreVertical,
  GitFork,
} from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Progress } from "@workspace/ui/components/progress";
import { EasyTip } from "@/components/easytip";
import { Pre } from "@/components/markdown";
import Image from "next/image";
import { UIMessage } from "ai";
import React from "react";
import { marked } from "marked";
import { ChatSession, useChatSessions } from "@/hooks/use-chat-sessions";
import { Link as MarkdownLink } from "@/components/markdown";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import { SiBrave } from "@icons-pack/react-simple-icons";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  modelDescriptions,
  modelDescriptionType,
} from "@/lib/modelDescriptions";
import Canvas from "./Canvas";
import { useCanvas } from "@/context/CanvasContext";
import { RefreshModelSelector } from "./ModelSelector";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@workspace/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@workspace/ui/components/dropdown-menu";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { useSettings } from "@/hooks/use-settings";

interface DeepResearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
  message: UIMessage | null;
  researchProgress?: messageAnnotation["researchProgress"];
}

const DeepResearchPanel: FC<DeepResearchPanelProps> = ({
  isOpen,
  onClose,
  message,
  researchProgress,
}) => {
  const t = useTranslations();

  if (!message) return null;

  // Check if message generation is complete
  const isMessageComplete =
    message.content && message.content.trim().length > 0;

  // If message is complete and there are no active search tools, hide panel
  const hasActiveSearchTools = message.parts.some(
    (part) =>
      part.type === "tool-invocation" &&
      part.toolInvocation.toolName === "search" &&
      (part.toolInvocation.state === "call" ||
        part.toolInvocation.state === "partial-call"),
  );

  if (isMessageComplete && !hasActiveSearchTools && !isOpen) {
    return null;
  }

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
              {/* hey cursorwrite deep research status */}
              <p className="font-medium mb-1 inline-flex items-center gap-1">
                <Search size={16} className="text-primary" />{" "}
                {t("messageLog.searchedFor")} {query}
              </p>
              <br />
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
                <span className="text-sm text-muted-foreground animate-pulse">
                  {t("messageLog.searching")}...
                </span>
              ) : (
                <span className="text-sm text-red-500">
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

  // Show research progress from annotation at the top of the panel
  const renderResearchProgressHeader = () => {
    if (!researchProgress) return null;

    return (
      <div className="mb-4 p-4 bg-secondary/30 rounded-lg w-full border border-secondary">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium inline-flex items-center gap-1">
            <RefreshCw size={16} className="mr-1 animate-spin" />
            {researchProgress.type === "deepResearch"
              ? t("messageLog.deepResearchStatus")
              : researchProgress.type === "advancedResearch"
                ? t("messageLog.advancedResearchStatus")
                : t("messageLog.shallowResearchStatus")}
          </h3>
          <span className="text-sm font-semibold">
            {Math.min(researchProgress.progress, 100)}%
          </span>
        </div>

        <div className="text-sm text-muted-foreground mb-2 overflow-hidden text-ellipsis line-clamp-2">
          {researchProgress.status}
        </div>

        <div className="w-full flex items-center">
          <Progress
            value={Math.min(researchProgress.progress, 100)}
            max={100}
          />
        </div>
      </div>
    );
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
        <div className="flex-grow p-4 w-full overflow-y-auto">
          {renderResearchProgressHeader()}
          <div className="space-y-4 max-w-full overflow-hidden">
            {message.parts.map((part, index) => renderPart(part, index))}
          </div>
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
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{ pre: Pre, a: MarkdownLink }}
      >
        {content}
      </ReactMarkdown>
    );
  },
  (prevProps, nextProps) => {
    if (prevProps.content !== nextProps.content) return false;
    return true;
  },
);
MemoMarkdown.displayName = "MemoMarkdown";

function parseMarkdownIntoBlocks(markdown: string): string[] {
  if (typeof markdown !== "string") {
    return [];
  }
  const tokens = marked.lexer(markdown);
  return tokens.map((token) => token.raw);
}

export const MemoizedMarkdown = memo(
  ({
    content,
    id,
  }: {
    content: string | { text: string; type: string }[];
    id: string;
  }) => {
    let realContent = content;
    if (Array.isArray(content)) {
      realContent = content.map((block) => block.text).join("\n");
    }
    const blocks = useMemo(
      () => parseMarkdownIntoBlocks(realContent as string),
      [realContent],
    );

    return blocks.map((block, index) => (
      <MemoMarkdown content={block} key={`${id}-block_${index}`} />
    ));
  },
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
  researchProgress?: {
    progress: number;
    status: string;
    type: "deepResearch" | "shallowResearch" | "advancedResearch";
    timestamp: number;
  };
}

const MessageControls = memo(
  ({
    message,
    onRegenerate,
    model,
    modelDescriptions,
    currentSession,
    generationTime,
  }: {
    message: UIMessage;
    onRegenerate?: (model: string) => void;
    model: string;
    modelDescriptions: modelDescriptionType;
    currentSession: ChatSession;
    generationTime?: number;
  }) => {
    const t = useTranslations();
    const { createBranchFromMessage } = useChatSessions(); // Use the hook
    const { settings } = useSettings();
    const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
    const [branchName, setBranchName] = useState("");

    const handleCopy = () => {
      navigator.clipboard.writeText(message.content || "");
      toast.success(t("messageLog.copied"));
    };

    const handleModelChange = (selectedModel: string) => {
      if (onRegenerate) {
        onRegenerate(selectedModel);
      }
    };

    const handleCreateBranch = () => {
      if (branchName.trim() && currentSession) {
        createBranchFromMessage(currentSession, message.id, branchName.trim());
        setIsBranchModalOpen(false);
        setBranchName(""); // Reset branch name
      } else {
        toast.error(branchName.trim() + currentSession);
      }
    };

    const formatTime = (ms: number) => {
      if (ms < 1000) return `${ms}ms`;

      const seconds = Math.floor(ms / 1000);
      if (seconds < 60) return `${seconds} ${t("messageLog.second")}`;

      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      if (minutes < 60) {
        return `${minutes} ${t("messageLog.minute")} ${remainingSeconds} ${t("messageLog.second")}`;
      }

      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours} ${t("messageLog.hour")} ${remainingMinutes} ${t("messageLog.minute")} ${remainingSeconds} ${t("messageLog.second")}`;
    };

    if (!generationTime) {
      return null;
    }

    return (
      <div className="flex items-center justify-between rounded mt-3 bg-secondary">
        <div className="flex items-center">
          <div className="p-1 text-gray-400 hover:text-foreground">
            <EasyTip content={t("messageLog.copy")}>
              <Button
                className="p-0 mx-0.5 md:mx-1 rounded-full"
                variant={"ghost"}
                onClick={handleCopy}
                size="sm"
              >
                <Copy size={14} className="md:size-4" />
              </Button>
            </EasyTip>
          </div>
          {generationTime && (
            <div className="flex items-center gap-1 p-1 md:p-2 text-xs md:text-sm cursor-default text-muted-foreground">
              <Clock size={14} className="mr-0.5 md:mr-1 md:size-4" />
              <span className="hidden sm:inline">
                {formatTime(generationTime)}
              </span>
              <span className="sm:hidden">
                {generationTime < 1000
                  ? `${generationTime}ms`
                  : `${Math.floor(generationTime / 1000)}s`}
              </span>
            </div>
          )}
          {onRegenerate && (
            <div className="flex items-center">
              <div className="p-0.5 md:p-1 text-gray-400 text-xs md:text-sm hover:text-foreground">
                <EasyTip content={t("messageLog.regenerate")}>
                  <RefreshModelSelector
                    modelDescriptions={modelDescriptions}
                    model={model}
                    handleModelChange={handleModelChange}
                  />
                </EasyTip>
              </div>
            </div>
          )}
          {settings.branch && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-gray-400 hover:text-foreground p-1 md:p-2"
                >
                  <MoreVertical size={14} className="md:size-[18px]" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setIsBranchModalOpen(true)}>
                  <GitFork size={14} className="mr-2" />
                  {t("messageLog.createBranchFromMessage")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Dialog open={isBranchModalOpen} onOpenChange={setIsBranchModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {t("messageLog.createBranchFromMessage")}
                </DialogTitle>
                <DialogDescription>
                  {t("messageLog.createBranchFromMessageDescription")}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="branchName" className="text-right">
                    {t("messageLog.branchName")}
                  </Label>
                  <Input
                    id="branchName"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    className="col-span-3"
                    placeholder={t("messageLog.branchNamePlaceholder")}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsBranchModalOpen(false)}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  onClick={handleCreateBranch}
                  disabled={!branchName.trim()}
                >
                  {t("common.create")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.message === nextProps.message &&
      prevProps.model === nextProps.model &&
      prevProps.modelDescriptions === nextProps.modelDescriptions &&
      prevProps.generationTime === nextProps.generationTime
    );
  },
);
MessageControls.displayName = "MessageControls";

export const MessageLog: FC<MessageLogProps> = memo(
  ({ message, sessionId, onRegenerate }) => {
    const { getSession, updateSession } = useChatSessions();
    const t = useTranslations();

    const [model, setModel] = useState<string>("openai/gpt-4.1-2025-04-14");
    const [canvasContent, setCanvasContent] = useState<string | undefined>(
      undefined,
    );
    const [canvasTitle, setCanvasTitle] = useState<string | undefined>(
      undefined,
    );
    const [generationTime, setGenerationTime] = useState<number | undefined>(
      undefined,
    );
    const [session, setSession] = useState<ChatSession | undefined>(
      getSession(sessionId),
    );
    const [researchProgress, setResearchProgress] = useState<
      messageAnnotation["researchProgress"] | undefined
    >(undefined);

    const [reasoningStates, setReasoningStates] = useState<
      Record<string, "inProgress" | "completed">
    >({});

    const [showCanvas, setShowCanvas] = useState(false);
    const [currentSession, setCurrentSession] = useState<ChatSession | null>(
      null,
    );
    const { getCanvasData, updateCanvas } = useCanvas();
    const sessionCanvasData = useMemo(() => {
      return getCanvasData(sessionId);
    }, [getCanvasData, sessionId]);

    const sessionCanvasDataRef = React.useRef(sessionCanvasData);
    useEffect(() => {
      sessionCanvasDataRef.current = sessionCanvasData;
    }, [sessionCanvasData]);

    const toolInvocations = React.useMemo(
      () => message.parts.filter((part) => part.type === "tool-invocation"),
      [message.parts],
    );

    const searchInvocations = React.useMemo(
      () =>
        toolInvocations.filter(
          (part) => part.toolInvocation.toolName === "search",
        ),
      [toolInvocations],
    );

    const canvasInvocations = React.useMemo(
      () =>
        toolInvocations.filter(
          (part) => part.toolInvocation.toolName === "canvas",
        ),
      [toolInvocations],
    );

    const annotationsKey = useMemo(
      () => JSON.stringify(message.annotations || []),
      [message.annotations],
    );

    useEffect(() => {
      const annotations = message.annotations;
      if (!annotations) return;

      const modelAnnotation = annotations.find(
        (a) => (a as messageAnnotation).model,
      );
      if (modelAnnotation) {
        setModel(
          (modelAnnotation as messageAnnotation).model ||
            "openai/gpt-4.1-2025-04-14",
        );
      }

      const canvasAnnotation = annotations.find(
        (a) => (a as messageAnnotation).canvasContent,
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

      // Find all generation time annotations
      const genAnnotations = annotations.filter(
        (a) => (a as messageAnnotation).generationTime !== undefined,
      );

      // If there are any generation time annotations, use the latest one
      // (assuming later annotations are more recent)
      if (genAnnotations.length > 0) {
        const latestGenAnnotation = genAnnotations[genAnnotations.length - 1];
        setGenerationTime(
          (latestGenAnnotation as messageAnnotation).generationTime,
        );
      }

      const progressAnnotations = annotations.filter(
        (a) => (a as messageAnnotation).researchProgress !== undefined,
      );

      // timestampがあると仮定して、timestampでソート（昇順）
      const sortedProgressAnnotations = progressAnnotations.sort((a, b) => {
        const aTime = (a as messageAnnotation).researchProgress?.timestamp || 0;
        const bTime = (b as messageAnnotation).researchProgress?.timestamp || 0;
        return aTime - bTime;
      });

      // 最新の注釈は最後の要素
      const latestProgressAnnotation =
        sortedProgressAnnotations.length > 0
          ? sortedProgressAnnotations[sortedProgressAnnotations.length - 1]
          : null;

      if (latestProgressAnnotation) {
        setResearchProgress(
          (latestProgressAnnotation as messageAnnotation).researchProgress,
        );
      }
    }, [
      annotationsKey,
      sessionId,
      getSession,
      updateSession,
      updateCanvas,
      message.id,
      message.parts,
    ]);

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
        (part) => part.type === "reasoning" && part.reasoning,
      );

      if (reasoningParts.length === 0) return;

      const newReasoningStates = { ...reasoningStates };
      let stateChanged = false;

      reasoningParts.forEach((part, index) => {
        const key = `${message.id}_reasoning_${index}`;

        if (newReasoningStates[key] === "completed") return;

        const hasTextParts = message.parts.some(
          (p) => p.type === "text" && p.text && p.text.trim().length > 0,
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
      [updateCanvas],
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
      [onRegenerate],
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

    const isShallowResearchMessage = useMemo(() => {
      return searchInvocations.some((inv) => {
        if (
          inv.type !== "tool-invocation" ||
          inv.toolInvocation.state !== "result"
        )
          return false;
        try {
          const result = JSON.parse(inv.toolInvocation.result);
          return result?.type === "shallowResearch";
        } catch (e) {
          return false;
        }
      });
    }, [searchInvocations]);

    const isAdvancedResearchMessage = useMemo(() => {
      return searchInvocations.some((inv) => {
        if (
          inv.type !== "tool-invocation" ||
          inv.toolInvocation.state !== "result"
        )
          return false;
        try {
          const result = JSON.parse(inv.toolInvocation.result);
          return result?.type === "advancedResearch";
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

    // Extract the top sources from search results to display in the UI
    const topSources = useMemo(() => {
      const sources: { title: string; url: string }[] = [];

      for (const inv of searchInvocations) {
        if (
          inv.type !== "tool-invocation" ||
          inv.toolInvocation.state !== "result"
        )
          continue;

        try {
          if (inv.toolInvocation.result) {
            const result = JSON.parse(inv.toolInvocation.result);
            if (result?.searchResults && Array.isArray(result.searchResults)) {
              result.searchResults.forEach((item: any) => {
                if (item.title && item.url) {
                  sources.push({
                    title: item.title,
                    url: item.url,
                  });
                }
              });
            }
          }
        } catch (e) {
          console.error("Failed to parse search sources:", e);
        }
      }

      // Return the first MAX_SOURCES number of sources
      return sources.length;
    }, [searchInvocations]);

    const handleDeepResearchClick = useCallback(() => {
      setSelectedMessageForPanel(message);
      setIsDeepResearchPanelOpen(true);
    }, [message]);

    const handleCloseDeepResearchPanel = useCallback(() => {
      setIsDeepResearchPanelOpen(false);
      setSelectedMessageForPanel(null);
    }, []);

    // Close panel automatically when message is complete
    useEffect(() => {
      if (message.role === "assistant" && isDeepResearchPanelOpen) {
        // Only apply auto-close logic when panel is open and we're showing this message
        if (selectedMessageForPanel?.id === message.id) {
          // Check if message has content (generation is done)
          const isMessageComplete =
            message.content && message.content.trim().length > 0;

          // Check if all search operations are completed
          const hasActiveSearches = message.parts.some(
            (part) =>
              part.type === "tool-invocation" &&
              (part.toolInvocation.toolName === "search" ||
                part.toolInvocation.toolName === "deepResearch" ||
                part.toolInvocation.toolName === "shallowResearch" ||
                part.toolInvocation.toolName === "advancedResearch") &&
              (part.toolInvocation.state === "call" ||
                part.toolInvocation.state === "partial-call"),
          );

          // Auto-close when message is complete AND all searches are done
          if (isMessageComplete && !hasActiveSearches) {
            // Only auto-close if not actively focused or visible
            if (
              !document.hasFocus() ||
              document.visibilityState !== "visible"
            ) {
              setIsDeepResearchPanelOpen(false);
            }
          }
        }
      }
    }, [message, selectedMessageForPanel, isDeepResearchPanelOpen]);

    const formatTime = (ms: number) => {
      if (ms < 1000) return `${ms}ms`;

      const seconds = Math.floor(ms / 1000);
      if (seconds < 60) return `${seconds}${t("messageLog.second")}`;

      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      if (minutes < 60) {
        return `${minutes} ${t("messageLog.minute")} ${remainingSeconds} ${t("messageLog.second")}`;
      }

      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}${t("messageLog.hour")} ${remainingMinutes}${t("messageLog.minute")} ${remainingSeconds}${t("messageLog.second")}`;
    };

    // Get all reasoning parts combined
    const combinedReasoningContent = useMemo(() => {
      const reasoningParts = message.parts.filter(
        (part) => part.type === "reasoning" && part.reasoning,
      );

      if (reasoningParts.length === 0) return "";

      return reasoningParts
        .map((part) => (part.type === "reasoning" ? part.reasoning || "" : ""))
        .join("\n\n");
    }, [message.parts]);

    const hasCompletedReasoning = useMemo(() => {
      return (
        combinedReasoningContent.trim().length > 0 &&
        (message.content ||
          message.parts.some(
            (p) => p.type === "text" && p.text && p.text.trim().length > 0,
          ))
      );
    }, [combinedReasoningContent, message.content, message.parts]);

    return (
      <div className={`flex w-full message-log visible`}>
        <div
          className={`p-2 my-2 rounded-lg ${
            message.role == "assistant"
              ? "text-white w-full"
              : message.role === "user"
                ? "bg-secondary ml-auto p-3"
                : "hidden"
          }`}
        >
          {message.role === "assistant" ? (
            <div key={message.id}>
              <div className="ml-3 prose dark:prose-invert w-full max-w-11/12">
                {isDeepResearchMessage ||
                isShallowResearchMessage ||
                isAdvancedResearchMessage ? (
                  <div
                    className="flex flex-col gap-1 bg-secondary w-full md:w-2/3 rounded-xl mb-4 px-4 py-3 overflow-hidden cursor-pointer hover:bg-secondary/80 transition-colors"
                    onClick={handleDeepResearchClick}
                  >
                    <span className="font-medium inline-flex items-center gap-1">
                      <Search size={16} className="text-primary" />{" "}
                      {isDeepResearchMessage
                        ? t("messageLog.deepResearch")
                        : isShallowResearchMessage
                          ? t("messageLog.shallowResearch")
                          : t("messageLog.advancedResearch")}
                    </span>
                    {firstSearchQuery && (
                      <span className="text-sm text-muted-foreground">
                        {t("messageLog.searchWord")} {firstSearchQuery}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {t("messageLog.sources", { count: topSources })} ･{" "}
                      {generationTime
                        ? formatTime(generationTime)
                        : t("messageLog.searching")}
                    </span>
                    {researchProgress && (
                      <div className="mt-1">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span className="truncate max-w-[70%]">
                            {researchProgress.status}
                          </span>
                          <span>
                            {Math.min(researchProgress.progress, 100)}%
                          </span>
                        </div>
                        <div className="w-full flex items-center">
                          <Progress
                            value={Math.min(researchProgress.progress, 100)}
                            max={100}
                          />
                        </div>
                      </div>
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
                              ),
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

                {/* Render reasoning parts individually with connected visual elements */}
                {message.parts.some(
                  (part) =>
                    part.type === "reasoning" &&
                    "reasoning" in part &&
                    part.reasoning,
                ) &&
                  !isDeepResearchMessage &&
                  hasCompletedReasoning && (
                    <Collapsible key={`${message.id}_reasoning_combined`}>
                      <CollapsibleTrigger className="mb-0 w-full text-left">
                        <span className="text-muted-foreground">
                          {generationTime
                            ? t("messageLog.reasoned")
                            : t("messageLog.reasoning")}
                        </span>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 mt-2 space-y-1">
                        {message.parts
                          .filter(
                            (part) =>
                              part.type === "reasoning" &&
                              "reasoning" in part &&
                              part.reasoning,
                          )
                          .map((part, index, array) => (
                            <div key={`${message.id}_reasoning_${index}`}>
                              <div className="flex items-start mb-3">
                                <div className="min-w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground mr-3 flex-shrink-0 mt-0.5">
                                  {index + 1}
                                </div>
                                <div className="flex-1">
                                  <div className="-mt-3">
                                    <MemoizedMarkdown
                                      key={`${message.id}_reasoning_content_${index}`}
                                      id={`${message.id}_assistant_reasoning_${index}`}
                                      content={
                                        part.type === "reasoning"
                                          ? (() => {
                                              const reasoning =
                                                part.reasoning as any;
                                              if (
                                                typeof reasoning === "string"
                                              ) {
                                                return reasoning;
                                              }
                                              if (Array.isArray(reasoning)) {
                                                return reasoning
                                                  .filter(
                                                    (item: any) =>
                                                      item.type === "text",
                                                  )
                                                  .map((item: any) => item.text)
                                                  .join("");
                                              }
                                              if (
                                                reasoning &&
                                                typeof reasoning === "object" &&
                                                "text" in reasoning
                                              ) {
                                                return (reasoning as any).text;
                                              }
                                              return "";
                                            })()
                                          : ""
                                      }
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                {message.parts.map((part, index) => {
                  switch (part.type) {
                    case "reasoning":
                      // Skip rendering individual reasoning parts as they're now handled above
                      return null;

                    case "text":
                      if (part.text) {
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
                      switch (part.toolInvocation.toolName) {
                        case "generateImage":
                          if (part.toolInvocation.state === "result") {
                            const result = part.toolInvocation.result;
                            return (
                              <div
                                key={`${part.toolInvocation.toolCallId}-image`}
                                className="flex flex-col gap-1 w-full rounded-xl mb-2 p-2 max-w-[320px] overflow-hidden"
                              >
                                <img
                                  src={result.image}
                                  width="300"
                                  height="300"
                                  alt="Generated Image"
                                />
                              </div>
                            );
                          }

                          return (
                            <span className="animate-pulse text-xs text-muted-foreground">
                              {t("messageLog.generatingImage")}
                            </span>
                          );

                        default:
                          return null;
                      }

                    default:
                      return null;
                  }
                })}
              </div>
              <MessageControls
                message={message}
                onRegenerate={handleRegenerate}
                model={model}
                currentSession={currentSession!}
                modelDescriptions={modelDescriptions}
                generationTime={generationTime}
              />
            </div>
          ) : message.role === "user" ? (
            <div className="prose dark:prose-invert whitespace-pre-wrap break-words">
              {message.parts.map((part, index) => {
                switch (part.type) {
                  case "text":
                    return (
                      <MemoizedMarkdown
                        key={`${message.id}_user_text_${index}`}
                        id={`${message.id}_user_text_${index}`}
                        content={part.text}
                      />
                    );
                  default:
                    return null;
                }
              })}
            </div>
          ) : null}
        </div>
        <DeepResearchPanel
          isOpen={isDeepResearchPanelOpen}
          onClose={handleCloseDeepResearchPanel}
          message={selectedMessageForPanel}
          researchProgress={researchProgress}
        />
      </div>
    );
  },
);
MessageLog.displayName = "MessageLog";

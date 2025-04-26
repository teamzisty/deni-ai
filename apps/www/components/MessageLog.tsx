import { FC, memo, useEffect, useMemo, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Clock, Copy, MousePointer, RefreshCw, Paintbrush } from "lucide-react";
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
import { SiBrave } from "@icons-pack/react-simple-icons";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  modelDescriptions,
  modelDescriptionType,
} from "@/lib/modelDescriptions";
import Canvas from "./Canvas";
import { useCanvas } from "@/context/CanvasContext";
import { ModelSelector } from "./ModelSelector";

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

// メッセージのコントロール部分（コピーボタンと生成時間）を別コンポーネントとして抽出
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
            <span>{t("messageLog.generationTime")} {formatTime(generationTime)}</span>
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
    // Replace useReducer with individual useState hooks
    const [model, setModel] = useState<string>("openai/gpt-4.1-mini-2025-04-14");
    const [canvasContent, setCanvasContent] = useState<string | undefined>(undefined);
    const [canvasTitle, setCanvasTitle] = useState<string | undefined>(undefined);
    const [generationTime, setGenerationTime] = useState<number | undefined>(undefined);
    
    // Create a state object to track reasoning state for all reasoning parts
    const [reasoningStates, setReasoningStates] = useState<Record<string, "inProgress" | "completed">>({});

    const [showCanvas, setShowCanvas] = useState(false);
    const { getCanvasData, updateCanvas } = useCanvas();
    // Ref to track if we've processed the thinking time from parts
    // セッション固有のキャンバスデータの取得
    const sessionCanvasData = useMemo(() => {
      return getCanvasData(sessionId);
    }, [getCanvasData, sessionId]);

    // Keep a stable reference to sessionCanvasData
    const sessionCanvasDataRef = React.useRef(sessionCanvasData);
    // Update ref when sessionCanvasData changes (without causing renders)
    useEffect(() => {
      sessionCanvasDataRef.current = sessionCanvasData;
    }, [sessionCanvasData]);

    const { getSession, updateSession } = useChatSessions();
    const t = useTranslations();

    const toolInvocations = React.useMemo(
      () => message.parts.filter((part) => part.type === "tool-invocation"),
      [message.parts]
    );

    // Canvas tool invocations
    const canvasInvocations = React.useMemo(
      () =>
        toolInvocations.filter(
          (part) => part.toolInvocation.toolName === "canvas"
        ),
      [toolInvocations]
    );

    // 「search」ツールの呼び出しだけをまとめる
    const searchInvocations = React.useMemo(
      () =>
        toolInvocations.filter(
          (part) => part.toolInvocation.toolName === "search"
        ),
      [toolInvocations]
    );

    // 「visit」ツールの呼び出しだけをまとめる
    const visitInvocations = React.useMemo(
      () =>
        toolInvocations.filter(
          (part) => part.toolInvocation.toolName === "visit"
        ),
      [toolInvocations]
    );

    // Key for annotation changes
    const annotationsKey = useMemo(() => JSON.stringify(message.annotations || []), [message.annotations]);

    // アノテーションとキャンバスデータを処理
    useEffect(() => {
      const annotations = message.annotations;
      if (!annotations) return;

      // Process model annotation
      const modelAnnotation = annotations.find(
        (a) => (a as messageAnnotation).model
      );
      if (modelAnnotation) {
        setModel((modelAnnotation as messageAnnotation).model || 
          "openai/gpt-4.1-mini-2025-04-14");
      }

      // Process title annotation
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

      // Process canvas annotation
      const canvasAnnotation = annotations.find(
        (a) => (a as messageAnnotation).canvasContent
      );
      if (canvasAnnotation) {
        const c = canvasAnnotation as messageAnnotation;
        setCanvasContent(c.canvasContent);
        setCanvasTitle(c.canvasTitle || "Untitled Document");
        
        updateCanvas(sessionId, { content: c.canvasContent || "", title: c.canvasTitle || "Untitled Document" });
      }

      // Process generation time annotation
      const genAnnotation = annotations.find(
        (a) => (a as messageAnnotation).generationTime
      );
      if (genAnnotation) {
        setGenerationTime((genAnnotation as messageAnnotation).generationTime);
      }
    }, [annotationsKey, sessionId, getSession, updateSession, updateCanvas]);

    // ツール呼び出しからキャンバスを更新するuseEffectを修正
    useEffect(() => {
      // 処理済みの呼び出しを追跡するための参照を作成
      const processedInvocations = new Set<string>();

      // canvasInvocationsが変更された時のみ実行し、stateやcontextの更新による再レンダリングを防ぐ
      const handler = () => {
        if (canvasInvocations.length > 0) {
          const latestInvocation =
            canvasInvocations[canvasInvocations.length - 1];
          // すでに処理済みの呼び出しはスキップ（二重処理防止）
          if (
            latestInvocation &&
            latestInvocation.toolInvocation.args?.content &&
            latestInvocation.toolInvocation.state === "result"
          ) {
            // 呼び出しIDを使って処理済みかどうかチェック
            const invocationId = latestInvocation.toolInvocation.toolCallId;
            if (processedInvocations.has(invocationId)) return;

            // 処理済みセットに追加
            processedInvocations.add(invocationId);

            // 通常のcreateまたはreplaceモード
            updateCanvas(sessionId, {
              content: latestInvocation.toolInvocation.args.content,
              title:
                latestInvocation.toolInvocation.args.title ||
                "Untitled Document",
            });
          }
        }
      };

      // 初回レンダリング時のみ実行
      handler();

      // クリーンアップ関数
      return () => {
        // 処理済みセットをクリア
        processedInvocations.clear();
      };
      // canvasInvocationsのみを依存配列に含めてループを防止
      // Use only stable dependencies to prevent re-runs
    }, [canvasInvocations, sessionId, updateCanvas]);

    // Check reasoning completion for all reasoning parts
    useEffect(() => {
      // Find all reasoning parts
      const reasoningParts = message.parts.filter(
        (part) => part.type === "reasoning" && part.reasoning
      );
      
      if (reasoningParts.length === 0) return;
      
      // Create a new state object to avoid direct mutations
      const newReasoningStates = { ...reasoningStates };
      let stateChanged = false;
      
      reasoningParts.forEach((part, index) => {
        const key = `${message.id}_reasoning_${index}`;
        
        // Skip already completed reasoning
        if (newReasoningStates[key] === "completed") return;
        
        // Check if message has text parts which would indicate reasoning is done
        const hasTextParts = message.parts.some(p => 
          p.type === "text" && p.text && p.text.trim().length > 0
        );
        
        // If message has text parts or is otherwise complete, mark reasoning as completed
        if (hasTextParts || message.content) {
          newReasoningStates[key] = "completed";
          stateChanged = true;
        } else if (!newReasoningStates[key]) {
          newReasoningStates[key] = "inProgress";
          stateChanged = true;
        }
      });
      
      // Only update state if changes were made
      if (stateChanged) {
        setReasoningStates(newReasoningStates);
      }
    }, [message.parts, message.id, message.content, reasoningStates]);
    
    // Set a timer to mark all reasoning as completed after a timeout
    useEffect(() => {
      // Find all reasoning parts that are still in progress
      const inProgressKeys = Object.entries(reasoningStates)
        .filter(([_, state]) => state === "inProgress")
        .map(([key]) => key);
      
      if (inProgressKeys.length === 0) return;
      
      // Set a fallback timer for any reasoning still in progress
      const timer = setTimeout(() => {
        setReasoningStates(prev => {
          const newState = { ...prev };
          inProgressKeys.forEach(key => {
            newState[key] = "completed";
          });
          return newState;
        });
      }, 5000);
      
      return () => clearTimeout(timer);
    }, [reasoningStates]);

    // クリック時にCanvasを表示するハンドラー修正
    const handleShowCanvas = () => {
      setShowCanvas(true);
    };

    // Canvasを閉じるハンドラー
    const handleCloseCanvas = () => {
      setShowCanvas(false);
    };

    // カスタムフック使用部分を最適化
    const memoizedUpdateCanvas = useCallback(
      (sid: string, data: { content: string; title: string }) => {
        updateCanvas(sid, data);
      },
      [updateCanvas]
    );

    // 表示するキャンバスコンテンツを取得する部分も最適化
    const canvasContentToShow = useMemo(() => {
      // ここでのsessionCanvasDataへの参照が問題を起こす可能性があるため、
      // 一旦sessionCanvasDataのコピーを作成して参照
      const currentCanvasData = sessionCanvasDataRef.current
        ? {
            content: sessionCanvasDataRef.current.content,
            title: sessionCanvasDataRef.current.title,
          }
        : null;

      // 最初にsessionCanvasDataを確認（もし存在するなら優先的に使う）
      if (currentCanvasData) {
        return currentCanvasData;
      }

      // 次にアノテーションを確認
      if (canvasContent) {
        return {
          content: canvasContent,
          title: canvasTitle || "Untitled Document",
        };
      }

      // 最後にキャンバスツール呼び出しを確認
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
      // Remove sessionCanvasData from dependencies to prevent infinite loops
    }, [canvasContent, canvasTitle, canvasInvocations]);

    // Regenerate handler with model selection
    const handleRegenerate = useCallback(
      (selectedModel: string) => {
        setModel(selectedModel);
        if (onRegenerate) {
          onRegenerate(selectedModel);
        }
      },
      [onRegenerate]
    );

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
                {/** Search ツールが1回以上実行されていればまとめて表示 */}
                {searchInvocations.length > 0 && (
                  <div className="flex flex-col gap-1 bg-secondary w-full md:w-2/3 rounded-xl mb-4 px-4 py-3 overflow-hidden">
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <SiBrave className="text-orange-400" />{" "}
                      {t("messageLog.braveSearch")}
                    </span>
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      {t("messageLog.searchWord")}{" "}
                      {searchInvocations[0]?.toolInvocation.args?.query}
                    </span>
                    {(() => {
                      // 最初の成功した検索結果だけを表示
                      const successfulInvocation = searchInvocations.find(
                        (inv) => inv.toolInvocation.state === "result"
                      );

                      if (
                        successfulInvocation &&
                        successfulInvocation.toolInvocation.state === "result"
                      ) {
                        const callId =
                          successfulInvocation.toolInvocation.toolCallId;
                        const toolResult = JSON.parse(
                          successfulInvocation.toolInvocation.result
                        );
                        const result = toolResult as {
                          title: string;
                          url: string;
                          description: string;
                        }[];

                        return result.map((item, index) => (
                          <p
                            key={`${callId}-${index}`}
                            className="mb-0 mt-0 max-w-full"
                          >
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-white underline line-clamp-1 mb-0 overflow-hidden text-ellipsis"
                            >
                              {item.title}
                            </a>
                            <span className="text-muted-foreground overflow-hidden line-clamp-1">
                              {item.description.replace(/<[^>]*>/g, "")}
                            </span>
                          </p>
                        ));
                      }

                      // 成功した検索がなければ、検索中の表示
                      return (
                        <span className="animate-pulse">
                          {t("messageLog.searching")}
                        </span>
                      );
                    })()}
                  </div>
                )}

                {/** Visit ツールが1回以上実行されていればまとめて表示 */}
                {visitInvocations.length > 0 && (
                  <div className="flex flex-col gap-1 bg-secondary rounded-xl w-full md:w-2/3 mb-4 px-4 py-3 overflow-hidden">
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <MousePointer />
                      {t("messageLog.visitedWebsites")}
                    </span>
                    {(() => {
                      // 最初の成功した訪問結果だけを表示
                      const successfulInvocations = visitInvocations.filter(
                        (inv) => inv.toolInvocation.state === "result"
                      );

                      if (successfulInvocations.length > 0) {
                        // URLの重複を排除
                        const uniqueUrls = new Set<string>();

                        return successfulInvocations
                          .map((invocation) => {
                            if (invocation.toolInvocation.state === "result") {
                              if (!invocation.toolInvocation.args) {
                                return null;
                              }

                              const url = invocation.toolInvocation.args?.url;

                              // 既に表示したURLはスキップ
                              if (uniqueUrls.has(url)) {
                                return null;
                              }

                              uniqueUrls.add(url);

                              return (
                                <a
                                  key={invocation.toolInvocation.toolCallId}
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-white underline truncate overflow-hidden text-ellipsis"
                                >
                                  {url}
                                </a>
                              );
                            }
                            return null;
                          })
                          .filter(Boolean);
                      }

                      // 成功した訪問がなければ、検索中の表示
                      return (
                        <span className="animate-pulse">
                          {t("messageLog.searching")}
                        </span>
                      );
                    })()}
                  </div>
                )}

                {/** Display Canvas preview if available */}
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
                    {/* Only render Canvas when showCanvas is true */}
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

                {/** Display message parts */}
                {message.parts.map((part, index) => {
                  switch (part.type) {
                    case "reasoning":
                      // Get reasoning state from our state object using a unique key
                      
                      return (
                        <Collapsible
                          key={`${message.id}_reasoning_${index}`}
                          defaultOpen={true}
                        >
                          <CollapsibleTrigger className="mb-0">
                            <span className="text-muted-foreground">
                              {generationTime && generationTime > 0 ? 
                                (() => {
                                  const seconds = Math.abs(Math.floor(generationTime / 1000));
                                  let baseTime = "";
                                  if (seconds >= 3600) {
                                    const hours = Math.floor(seconds / 3600);
                                    const minutes = Math.floor((seconds % 3600) / 60);
                                    const remainingSeconds = seconds % 60;
                                    baseTime = `${hours} ${t("messageLog.hour")} ${minutes}$ {t("messageLog.minute")} ${remainingSeconds} ${t("messageLog.second")}`;
                                  } else if (seconds >= 60) {
                                    const minutes = Math.floor(seconds / 60);
                                    const remainingSeconds = seconds % 60;
                                    baseTime = `${minutes} ${t("messageLog.minute")} ${remainingSeconds}$ {t("messageLog.second")}`;
                                  } else {
                                    baseTime = `${seconds} ${t("messageLog.second")}`;
                                  }
                                  return t("messageLog.reasonedFor", { time: baseTime });
                                })() 
                                : t("messageLog.reasoning")}
                            </span>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="border-l-2 mt-0 pl-4 outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2">
                            <MemoizedMarkdown
                              key={`${message.id}_reasoning_content_${index}`}
                              id={`${message.id}_assistant_${index}`}
                              content={part.reasoning ?? ""}
                            />
                          </CollapsibleContent>
                        </Collapsible>
                      );

                    case "text":
                      return (
                        <MemoizedMarkdown
                          key={`${message.id}_text_${index}`}
                          id={`${message.id}_assistant_${index}`}
                          content={part.text ?? ""}
                        />
                      );

                    case "tool-invocation":
                      // Skip canvas invocations as we're handling them separately
                      if (part.toolInvocation.toolName === "canvas") {
                        return null;
                      }
                      if (part.toolInvocation.toolName === "search") {
                        <div className="flex flex-col gap-1 bg-secondary w-full md:w-2/3 rounded-xl mb-4 px-4 py-3 overflow-hidden">
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <SiBrave className="text-orange-400" />{" "}
                          {t("messageLog.braveSearch")}
                        </span>
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          {t("messageLog.searchWord")}{" "}
                          {part.toolInvocation.args?.query}
                        </span>
                        {(() => {
                          // 最初の成功した検索結果だけを表示
                          const successfulInvocation = part.toolInvocation.state === "result" ? part.toolInvocation : null;
    
                          if (
                            successfulInvocation &&
                            successfulInvocation.state === "result"
                          ) {
                            const callId =
                              successfulInvocation.toolCallId;
                            const toolResult = JSON.parse(
                              successfulInvocation.result
                            );
                            const result = toolResult as {
                              title: string;
                              url: string;
                              description: string;
                            }[];
    
                            return result.map((item, index) => (
                              <p
                                key={`${callId}-${index}`}
                                className="mb-0 mt-0 max-w-full"
                              >
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-white underline line-clamp-1 mb-0 overflow-hidden text-ellipsis"
                                >
                                  {item.title}
                                </a>
                                <span className="text-muted-foreground overflow-hidden line-clamp-1">
                                  {item.description.replace(/<[^>]*>/g, "")}
                                </span>
                              </p>
                            ));
                          }
    
                          // 成功した検索がなければ、検索中の表示
                          return (
                            <span className="animate-pulse">
                              {t("messageLog.searching")}
                            </span>
                          );
                        })()}
                      </div>
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
      </div>
    );
  }
);
MessageLog.displayName = "MessageLog";

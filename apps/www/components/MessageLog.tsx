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
import { modelDescriptions } from "@/lib/modelDescriptions";
import Canvas from "./Canvas";
import { useCanvas } from "@/context/CanvasContext";

interface MessageLogProps {
  message: UIMessage;
  sessionId: string;
  onRegenerate?: () => void;
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
  thinkingTime: number;
  canvasContent?: string;
  canvasTitle?: string;
}

interface messageAnnotation {
  model?: string;
  title?: string;
  thinkingTime?: number;
  canvasContent?: string;
  canvasTitle?: string;
}

type MessageAction =
  | { type: "SET_MODEL"; payload: string }
  | { type: "SET_THINKING_TIME"; payload: number }
  | { type: "SET_CANVAS_CONTENT"; payload: { content: string; title: string } }
  | { type: "UPDATE_FROM_ANNOTATIONS"; payload: any[] };

function messageReducer(
  state: MessageState,
  action: MessageAction
): MessageState {
  switch (action.type) {
    case "SET_MODEL":
      return { ...state, model: action.payload };
    case "SET_THINKING_TIME":
      return { ...state, thinkingTime: action.payload };
    case "SET_CANVAS_CONTENT":
      return { 
        ...state, 
        canvasContent: action.payload.content,
        canvasTitle: action.payload.title
      };
    case "UPDATE_FROM_ANNOTATIONS":
      const annotations = action.payload;
      const updates: Partial<MessageState> = {};

      const modelAnnotation = annotations?.find(
        (a) => (a as messageAnnotation).model
      );
      if (modelAnnotation) {
        updates.model =
          (modelAnnotation as messageAnnotation).model || "gpt-4o-2024-11-20";
      }

      const timeAnnotation = annotations?.find(
        (a) => (a as messageAnnotation).thinkingTime
      );
      if (timeAnnotation) {
        updates.thinkingTime = (
          timeAnnotation as messageAnnotation
        ).thinkingTime;
      }

      const canvasAnnotation = annotations?.find(
        (a) => (a as messageAnnotation).canvasContent
      );
      if (canvasAnnotation) {
        updates.canvasContent = (canvasAnnotation as messageAnnotation).canvasContent;
        updates.canvasTitle = (canvasAnnotation as messageAnnotation).canvasTitle || "Untitled Document";
      }

      return { ...state, ...updates };
    default:
      return state;
  }
}

// メッセージのコントロール部分（コピーボタンと生成時間）を別コンポーネントとして抽出
const MessageControls = memo(
  ({
    messageContent,
    thinkingTime,
    onRegenerate,
    model,
  }: {
    messageContent: string;
    thinkingTime: number;
    onRegenerate?: () => void;
    model: string;
  }) => {
    const t = useTranslations();

    const handleCopy = () => {
      navigator.clipboard.writeText(messageContent);
      toast.success(t("messageLog.copied"));
    };

    return (
      <div className="flex items-center rounded mt-3 bg-secondary text-xs">
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
        {onRegenerate && (
          <div className="p-1 text-gray-400 hover:text-foreground">
            <EasyTip content={t("messageLog.regenerate")}>
              <Button
                className="p-0 mx-1 rounded-full"
                variant={"ghost"}
                onClick={onRegenerate}
              >
                <RefreshCw size="16" />
                {modelDescriptions[model]?.displayName}
              </Button>
            </EasyTip>
          </div>
        )}
        <div className="p-1 text-gray-400 transition-all cursor-default hover:text-foreground">
          <EasyTip content={t("messageLog.generationTime")}>
            <div className="flex items-center gap-1 mx-1 p-1 m-0 px-1">
              <Clock size="16" />
              <span className="text-sm">
                {thinkingTime < 0
                  ? t("messageLog.thinking")
                  : thinkingTime > 3600000
                    ? `${Math.floor(
                        thinkingTime / 3600000
                      )} ${t("messageLog.hour")} ${Math.floor(
                        (thinkingTime % 3600000) / 60000
                      )} ${t("messageLog.minute")} ${Math.floor(
                        (thinkingTime % 60000) / 1000
                      )} ${t("messageLog.second")}`
                    : thinkingTime > 60000
                      ? `${Math.floor(
                          thinkingTime / 60000
                        )} ${t("messageLog.minute")} ${Math.floor(
                          (thinkingTime % 60000) / 1000
                        )} ${t("messageLog.second")}`
                      : `${Math.floor(
                          thinkingTime / 1000
                        )} ${t("messageLog.second")}`}{" "}
              </span>
            </div>
          </EasyTip>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // メッセージ内容とthinkingTimeが変わらない限り再レンダリングしない
    return (
      prevProps.messageContent === nextProps.messageContent &&
      prevProps.thinkingTime === nextProps.thinkingTime
    );
  }
);
MessageControls.displayName = "MessageControls";

export const MessageLog: FC<MessageLogProps> = memo(
  ({ message, sessionId, onRegenerate }) => {
    const [state, dispatch] = React.useReducer(messageReducer, {
      model: "gpt-4o-2024-11-20",
      thinkingTime: 0,
    });

    const [showCanvas, setShowCanvas] = useState(false);
    const { getCanvasData, updateCanvas } = useCanvas();
    
    // セッション固有のキャンバスデータの取得
    const sessionCanvasData = useMemo(() => {
      return getCanvasData(sessionId);
    }, [getCanvasData, sessionId]);

    const { getSession, updateSession } = useChatSessions();
    const t = useTranslations();

    const toolInvocations = React.useMemo(
      () => message.parts.filter((part) => part.type === "tool-invocation"),
      [message.parts]
    );

    // Canvas tool invocations
    const canvasInvocations = React.useMemo(
      () => toolInvocations.filter(
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

    // ツール呼び出しからキャンバスを更新するuseEffectを修正
    useEffect(() => {
      // 処理済みの呼び出しを追跡するための参照を作成
      const processedInvocations = new Set<string>();
      
      // canvasInvocationsが変更された時のみ実行し、stateやcontextの更新による再レンダリングを防ぐ
      const handler = () => {
        if (canvasInvocations.length > 0) {
          const latestInvocation = canvasInvocations[canvasInvocations.length - 1];
          // すでに処理済みの呼び出しはスキップ（二重処理防止）
          if (latestInvocation && 
              latestInvocation.toolInvocation.args?.content && 
              latestInvocation.toolInvocation.state === "result") {
            
            // 呼び出しIDを使って処理済みかどうかチェック
            const invocationId = latestInvocation.toolInvocation.toolCallId;
            if (processedInvocations.has(invocationId)) return;
            
            // 処理済みセットに追加
            processedInvocations.add(invocationId);
            
            // もしappendモードなら自分自身でコンテンツを結合する
            if (latestInvocation.toolInvocation.args.mode === "append" && sessionCanvasData) {
              const existingContent = sessionCanvasData.content;
              const newContent = latestInvocation.toolInvocation.args.content;
              const finalContent = `${existingContent}\n\n${newContent}`;
              
              updateCanvas(sessionId, {
                content: finalContent,
                title: latestInvocation.toolInvocation.args.title || sessionCanvasData.title || "Untitled Document",
              });
            } else {
              // 通常のcreateまたはreplaceモード
              updateCanvas(sessionId, {
                content: latestInvocation.toolInvocation.args.content,
                title: latestInvocation.toolInvocation.args.title || "Untitled Document",
              });
            }
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
    }, [canvasInvocations, sessionCanvasData, getCanvasData, updateCanvas]);

    // アノテーションとキャンバスデータを処理
    useEffect(() => {
      const annotations = message.annotations;
      if (!annotations) return;

      dispatch({ type: "UPDATE_FROM_ANNOTATIONS", payload: annotations });

      const titleAnnotation = annotations?.find((a) => (a as any).title);
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

      // セッション固有のキャンバス状態を更新
      const canvasAnnotation = annotations?.find(
        (a) => (a as messageAnnotation).canvasContent
      );
      if (canvasAnnotation) {
        updateCanvas(sessionId, {
          content: (canvasAnnotation as messageAnnotation).canvasContent || "",
          title: (canvasAnnotation as messageAnnotation).canvasTitle || "Untitled Document",
        });
      }
    }, [message.annotations, sessionId, getSession, updateSession, updateCanvas]);

    // クリック時にCanvasを表示するハンドラー修正
    const handleShowCanvas = () => {
      setShowCanvas(true);
    };

    // Canvasを閉じるハンドラー
    const handleCloseCanvas = () => {
      setShowCanvas(false);
    };

    // カスタムフック使用部分を最適化
    const memoizedUpdateCanvas = useCallback((sid: string, data: { content: string; title: string }) => {
      updateCanvas(sid, data);
    }, [updateCanvas]);

    // 表示するキャンバスコンテンツを取得する部分も最適化
    const canvasContentToShow = useMemo(() => {
      // ここでのsessionCanvasDataへの参照が問題を起こす可能性があるため、
      // 一旦sessionCanvasDataのコピーを作成して参照
      const currentCanvasData = sessionCanvasData ? {
        content: sessionCanvasData.content,
        title: sessionCanvasData.title
      } : null;
      
      // 最初にsessionCanvasDataを確認（もし存在するなら優先的に使う）
      if (currentCanvasData) {
        return currentCanvasData;
      }
      
      // 次にアノテーションを確認
      if (state.canvasContent) {
        return {
          content: state.canvasContent,
          title: state.canvasTitle || "Untitled Document",
        };
      }
      
      // 最後にキャンバスツール呼び出しを確認
      if (canvasInvocations.length > 0) {
        const latestInvocation = canvasInvocations[canvasInvocations.length - 1];
        if (latestInvocation && latestInvocation.toolInvocation.args?.content) {
          return {
            content: latestInvocation.toolInvocation.args.content,
            title: latestInvocation.toolInvocation.args.title || "Untitled Document",
          };
        }
      }
      
      return null;
      // 依存関係を最小限に抑える
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.canvasContent, state.canvasTitle, canvasInvocations.length]);

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
                        <span className="font-medium">{canvasContentToShow.title}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {t("canvas.clickToOpen")}
                      </span>
                    </div>
                    {showCanvas && (
                      <Canvas 
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
                      return (
                        <Collapsible
                          key={`${message.id}_reasoning_${index}`}
                          defaultOpen={true}
                        >
                          <CollapsibleTrigger className="mb-0">
                            <span className="text-muted-foreground">
                              {state.thinkingTime <= 0
                                ? t("messageLog.reasoning")
                                : state.thinkingTime > 3600000
                                  ? `${Math.floor(
                                      state.thinkingTime / 3600000
                                    )} ${t("messageLog.hour")} ${Math.floor(
                                      (state.thinkingTime % 3600000) / 60000
                                    )} ${t("messageLog.minute")} ${Math.floor(
                                      (state.thinkingTime % 60000) / 1000
                                    )} ${t("messageLog.second")} ${t("messageLog.reasonedFor")}`
                                  : state.thinkingTime > 60000
                                    ? `${Math.floor(
                                        state.thinkingTime / 60000
                                      )} ${t("messageLog.minute")} ${Math.floor(
                                        (state.thinkingTime % 60000) / 1000
                                      )} ${t("messageLog.second")} ${t("messageLog.reasonedFor")}`
                                    : state.thinkingTime < 1000
                                      ? t("messageLog.reasoning")
                                      : `${Math.floor(
                                          state.thinkingTime / 1000
                                        )} ${t("messageLog.second")} ${t("messageLog.reasonedFor")}`}{" "}
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
                      return null;
                    
                    default:
                      return null;
                  }
                })}
              </div>
              <MessageControls
                messageContent={message.content}
                thinkingTime={state.thinkingTime}
                onRegenerate={onRegenerate}
                model={state.model}
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
              <div className="prose dark:prose-invert">{message.content}</div>
            </>
          )}
        </div>
      </div>
    );
  }
);
MessageLog.displayName = "MessageLog";

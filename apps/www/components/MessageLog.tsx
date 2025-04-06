import { FC, memo, useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Clock, Copy, MousePointer } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { EasyTip } from "@/components/easytip";
import { Pre } from "@/components/markdown";
import Image from "next/image";
import { UIMessage } from "ai";
import React from "react";
import { useChatSessions } from "@/hooks/use-chat-sessions";
import { Link as MarkdownLink } from "@/components/markdown";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@repo/ui/components/collapsible";
import { SiBrave } from "@icons-pack/react-simple-icons";
import { useTranslations } from "next-intl";
interface MessageLogProps {
  message: UIMessage;
  sessionId: string;
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

// マークダウンをブロックに分割する最適化された関数
function parseMarkdownIntoBlocks(markdown: string): string[] {
  // キャッシュを使用して同じマークダウンに対して複数回パースしないようにする
  if (!markdown) return [];
  
  // 簡易的なブロック分割（空行で区切る）
  // これはmarked.lexerよりも高速だが、完全な互換性はない
  return markdown.split(/\n\s*\n/).filter(block => block.trim().length > 0);
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
}

interface messageAnnotation {
  model?: string;
  title?: string;
  thinkingTime?: number;
}

type MessageAction =
  | { type: "SET_MODEL"; payload: string }
  | { type: "SET_THINKING_TIME"; payload: number }
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
    case "UPDATE_FROM_ANNOTATIONS":
      const annotations = action.payload;
      const updates: Partial<MessageState> = {};

      const modelAnnotation = annotations?.find(
        (a) => (a as messageAnnotation).model
      );
      if (modelAnnotation) {
        updates.model =
          (modelAnnotation as messageAnnotation).model || "gpt-4o-2024-08-06";
      }

      const timeAnnotation = annotations?.find(
        (a) => (a as messageAnnotation).thinkingTime
      );
      if (timeAnnotation) {
        updates.thinkingTime = (
          timeAnnotation as messageAnnotation
        ).thinkingTime;
      }

      return { ...state, ...updates };
    default:
      return state;
  }
}
// メッセージのコントロール部分（コピーボタンと生成時間）を別コンポーネントとして抽出
const MessageControls = memo(
  ({ messageContent, thinkingTime }: { messageContent: string; thinkingTime: number }) => {
    const t = useTranslations();

    const handleCopy = React.useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        navigator.clipboard.writeText(messageContent);
        const target = event.currentTarget;
        target.querySelector("svg")!.outerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><polyline points="20 6 9 17 4 12"/></svg>';
        setTimeout(() => {
          target.querySelector("svg")!.outerHTML =
            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>';
        }, 1000);
      },
      [messageContent]
    );

    return (
      <div className="flex items-center rounded mt-3 bg-secondary text-xs">
        <div className="p-1 text-gray-400 hover:text-foreground">
          <EasyTip content={t("messageLog.copy")}>
            <Button
              size="sm"
              className="p-0 ml-2 rounded-full"
              variant={"ghost"}
              onClick={handleCopy}
            >
              <Copy size="16" />
            </Button>
          </EasyTip>
        </div>
        <div className="p-1 text-gray-400 transition-all cursor-default hover:text-foreground">
          <EasyTip content={t("messageLog.generationTime")}>
            <Button
              variant={"ghost"}
              className="flex items-center ml-2 p-2 m-0 !px-1"
            >
              <Clock size="16" />
              <span>
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
            </Button>
          </EasyTip>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // メッセージ内容とthinkingTimeが変わらない限り再レンダリングしない
    return prevProps.messageContent === nextProps.messageContent &&
           prevProps.thinkingTime === nextProps.thinkingTime;
  }
);
MessageControls.displayName = "MessageControls";

export const MessageLog: FC<MessageLogProps> = memo(
  ({ message, sessionId }) => {
    const [state, dispatch] = React.useReducer(messageReducer, {
      model: "gpt-4o-2024-08-06",
      thinkingTime: 0,
    });

    const { getSession, updateSession } = useChatSessions();
    const t = useTranslations();

    const toolInvocations = React.useMemo(
      () => message.parts.filter((part) => part.type === "tool-invocation"),
      [message.parts]
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
    // ▲▲▲ まとめるための処理部分 ▲▲▲

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
    }, [getSession, message.annotations, sessionId, updateSession]);

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
                        <SiBrave className="text-orange-400" /> {t("messageLog.braveSearch")}
                      </span>
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        {t("messageLog.searchWord")}{" "}
                        {searchInvocations[0]?.toolInvocation.args?.query}
                      </span>
                      {searchInvocations.map((invocation) => {
                        const callId = invocation.toolInvocation.toolCallId;

                        if (invocation.toolInvocation.state === "result") {
                          const toolResult = JSON.parse(
                            invocation.toolInvocation.result
                          );
                          const result = toolResult as {
                            title: string;
                            url: string;
                            description: string;
                          }[];
                          return result.map((item, index) => {
                            return (
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
                                <span
                                  className="text-muted-foreground overflow-hidden line-clamp-1"
                                >
                                  {item.description.replace(/<[^>]*>/g, '')}
                                </span>
                              </p>
                            );
                          });
                        }

                        return t("messageLog.searching");
                      })}
                    </div>
                  )}

                  {/** Visit ツールが1回以上実行されていればまとめて表示 */}
                  {visitInvocations.length > 0 && (
                    <div className="flex flex-col gap-1 bg-secondary rounded-xl w-full md:w-2/3 mb-4 px-4 py-3 overflow-hidden">
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <MousePointer />
                        {t("messageLog.visitedWebsites")}
                      </span>
                      {visitInvocations.map((invocation) => {
                        const callId = invocation.toolInvocation.toolCallId;
                        // args に url があると仮定した場合

                        if (invocation.toolInvocation.state === "result") {
                          if (!invocation.toolInvocation.args) {
                            console.log(invocation.toolInvocation.args);
                            return t("messageLog.urlNotFound");
                          }
                          const url = invocation.toolInvocation.args?.url;
                          return (
                            <a
                              key={callId}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-white underline truncate overflow-hidden text-ellipsis"
                            >
                              {url}
                            </a>
                          );
                        }

                        return t("messageLog.searching");
                      })}
                    </div>
                  )}

                  {/** ここで「tool-invocation」以外のパートを表示する、たとえば text のみなど */}
                  {message.parts.map((part) => {
                    switch (part.type) {
                      case "reasoning":
                        return (
                          <Collapsible
                            key={message.id + "_reasoning"}
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
                                key={message.id + "_reasoning_content"}
                                id={message.id + "_assistant"}
                                content={part.reasoning ?? ""}
                              />
                            </CollapsibleContent>
                          </Collapsible>
                        );

                      case "text":
                        // text のみ表示
                        return (
                          <MemoizedMarkdown
                            key={message.id + "_text"}
                            id={message.id + "_assistant"}
                            content={part.text ?? ""}
                          />
                        );
                    }
                  })}
                </div>
                <MessageControls
                  messageContent={message.content}
                  thinkingTime={state.thinkingTime}
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

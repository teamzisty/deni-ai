import { FC, memo, useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Clock, Copy, MousePointer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EasyTip } from "@/components/easytip";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Pre } from "@/components/markdown";
import Image from "next/image";
import { UIMessage } from "ai";
import React from "react";
import { useChatSessions } from "@/hooks/use-chat-sessions";
import { marked } from "marked";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Link as MarkdownLink } from "@/components/markdown";
import { SiBrave } from "@icons-pack/react-simple-icons";

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
  searchedWebsites: { title: string; description: string; url: string }[];
  searchQuery: string;
  visitedWebsites: string[];
  thinkingTime: number;
}

interface messageAnnotation {
  model?: string;
  searchResults?: Array<{
    title: string;
    description: string;
    url: string;
  }>;
  title?: string;
  searchQuery?: string;
  visitedWebsites?: string;
  thinkingTime?: number;
}

interface searchResult {
  title: string;
  description: string;
  url: string;
}

type MessageAction =
  | { type: "SET_MODEL"; payload: string }
  | {
      type: "SET_SEARCHED_WEBSITES";
      payload: { title: string; description: string; url: string }[];
    }
  | { type: "SET_SEARCH_QUERY"; payload: string }
  | { type: "SET_VISITED_WEBSITES"; payload: string[] }
  | { type: "SET_THINKING_TIME"; payload: number }
  | { type: "UPDATE_FROM_ANNOTATIONS"; payload: any[] };

function messageReducer(
  state: MessageState,
  action: MessageAction
): MessageState {
  switch (action.type) {
    case "SET_MODEL":
      return { ...state, model: action.payload };
    case "SET_SEARCHED_WEBSITES":
      return { ...state, searchedWebsites: action.payload };
    case "SET_SEARCH_QUERY":
      return { ...state, searchQuery: action.payload };
    case "SET_VISITED_WEBSITES":
      return { ...state, visitedWebsites: action.payload };
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

      const searchedAnnotations = annotations?.filter(
        (a) => (a as messageAnnotation).searchResults
      );
      if (searchedAnnotations) {
        updates.searchedWebsites = searchedAnnotations.flatMap((a) => {
          if (a.searchResults) {
            return a.searchResults.map((result: searchResult) => ({
              title: result.title,
              description: result.description,
              url: result.url,
            }));
          }
          return [];
        });
      }

      const searchQueryAnnotation = annotations?.find(
        (a) => (a as messageAnnotation).searchQuery
      );
      if (searchQueryAnnotation) {
        updates.searchQuery = (
          searchQueryAnnotation as messageAnnotation
        ).searchQuery;
      }

      const visitedWebsitesAnnotation = annotations?.find((a) =>
        Array.isArray((a as messageAnnotation).visitedWebsites)
      ) as { visitedWebsites: string[] } | undefined;
      if (visitedWebsitesAnnotation?.visitedWebsites) {
        updates.visitedWebsites = visitedWebsitesAnnotation.visitedWebsites;
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

export const MessageLog: FC<MessageLogProps> = memo(
  ({ message, sessionId }) => {
    const [state, dispatch] = React.useReducer(messageReducer, {
      model: "gpt-4o-2024-08-06",
      searchedWebsites: [],
      searchQuery: "",
      visitedWebsites: [],
      thinkingTime: 0,
    });

    const { getSession, updateSession } = useChatSessions();

    const handleCopy = React.useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        navigator.clipboard.writeText(message.content);
        const target = event.currentTarget;
        target.querySelector("svg")!.outerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><polyline points="20 6 9 17 4 12"/></svg>';
        setTimeout(() => {
          target.querySelector("svg")!.outerHTML =
            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>';
        }, 1000);
      },
      [message.content]
    );

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
      <TooltipProvider>
        <div className={`flex w-full message-log visible`}>
          <div
            className={`p-2 my-2 rounded-lg ${
              message.role == "assistant"
                ? "text-white w-full"
                : "bg-secondary ml-auto p-3"
            }`}
          >
            {message.role == "assistant" ? (
              <div>
                {state.thinkingTime > 0 && (
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <p className="ml-3 cursor-default text-muted-foreground">
                        {state.searchedWebsites?.length > 0 &&
                        state.visitedWebsites?.length > 0
                          ? `ウェブサイトを検索し、閲覧済み`
                          : state.searchedWebsites?.length > 0
                          ? `ウェブサイトを検索済み`
                          : state.visitedWebsites?.length > 0
                          ? "ウェブサイトを閲覧済み"
                          : ""}
                      </p>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="prose dark:prose-invert outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2">
                      <div className="border-l pl-4 mb-4">
                        {state.searchedWebsites.length > 0 && (
                          <div className="flex flex-col gap-1 bg-secondary rounded-xl mb-4 px-4 py-3">
                            <span className="inline-flex items-center gap-1 text-muted-foreground">
                              <SiBrave className="text-orange-400" /> Brave
                              Search を使用した検索
                            </span>
                            {state.searchQuery && (
                              <span className="text-muted-foreground">
                                検索ワード: {state.searchQuery}
                              </span>
                            )}
                            {state.searchedWebsites.map(
                              (
                                site: {
                                  url: string;
                                  title: string;
                                  description: string;
                                },
                                index: number
                              ) => (
                                <span
                                  key={index}
                                  className="flex flex-col gap-1"
                                >
                                  <a
                                    href={site.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-white underline min-w-0 truncate"
                                  >
                                    {site.title || site.url}
                                  </a>{" "}
                                  {site.description && (
                                    <span
                                      className="text-muted-foreground text-sm"
                                      dangerouslySetInnerHTML={{
                                        __html: site.description,
                                      }}
                                    />
                                  )}
                                </span>
                              )
                            )}
                          </div>
                        )}

                        {state.visitedWebsites.length > 0 && (
                          <div className="flex flex-col gap-1 bg-secondary rounded-xl mb-4 px-4 py-3">
                            <span className="inline-flex items-center gap-1 text-muted-foreground">
                              <MousePointer />
                              閲覧したウェブサイト
                            </span>
                            {state.visitedWebsites.map(
                              (visitedWebsite: string, index: number) => (
                                <a
                                  key={index}
                                  href={String(visitedWebsite)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-white underline truncate"
                                >
                                  {String(visitedWebsite)}
                                </a>
                              )
                            )}
                          </div>
                        )}

                        {message.content.match(/<think>(.*?)<\/think>/s)?.[1] ||
                          ""}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
                <div className="ml-3 prose dark:prose-invert w-full max-w-11/12">
                  <MemoizedMarkdown
                    id={message.id + "_assistant"}
                    content={
                      message.content.startsWith("<think>") &&
                      !message.content.includes("</think>")
                        ? ""
                        : message.content.replace(/<think>(.*?)<\/think>/s, "")
                    }
                  />
                </div>{" "}
                <div className="flex items-center rounded mt-3 bg-secondary text-xs">
                  <div className="p-1 text-gray-400 hover:text-foreground">
                    <EasyTip content="コピー">
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
                    <EasyTip content="生成時間">
                      <Button
                        variant={"ghost"}
                        className="flex items-center ml-2 p-2 m-0 !px-1"
                      >
                        <Clock size="16" />
                        <span>
                          {state.thinkingTime < 0
                            ? "考え中..."
                            : state.thinkingTime > 3600000
                            ? `${Math.floor(
                                state.thinkingTime / 3600000
                              )} 時間 ${Math.floor(
                                (state.thinkingTime % 3600000) / 60000
                              )} 分 ${Math.floor(
                                (state.thinkingTime % 60000) / 1000
                              )} 秒`
                            : state.thinkingTime > 60000
                            ? `${Math.floor(
                                state.thinkingTime / 60000
                              )} 分 ${Math.floor(
                                (state.thinkingTime % 60000) / 1000
                              )} 秒`
                            : `${Math.floor(
                                state.thinkingTime / 1000
                              )} 秒`}{" "}
                        </span>
                      </Button>
                    </EasyTip>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {message.experimental_attachments && (
                  <Image
                    alt="画像"
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
      </TooltipProvider>
    );
  }
);
MessageLog.displayName = "MessageLog";

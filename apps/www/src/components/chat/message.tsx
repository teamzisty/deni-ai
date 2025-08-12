import { UIMessage } from "ai";
import { memo, useMemo, useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { marked } from "marked";
import { Separator } from "@workspace/ui/components/separator";
import { internalModels } from "@/lib/constants";
import { CodeBlock, Pre } from "./markdown-components";
import { Button } from "@workspace/ui/components/button";
import {
  Globe,
  ExternalLink,
  ArrowDown,
  ArrowUp,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCanvas } from "@/context/canvas-context";
import { useTranslations } from "@/hooks/use-translations";
import { cn } from "@workspace/ui/lib/utils";
import { MessageControls } from "./message-controls";
import { models } from "@/lib/constants";

interface SearchResult {
  title: string;
  description: string;
  time: number; // Time taken to scrape the page
  url: string;
  content: {
    long: string;
    short: string;
  };
}

interface MessageProps {
  message: UIMessage;
  conversationId?: string;
}

function parseMarkdownIntoBlocks(markdown: string): string[] {
  const tokens = marked.lexer(markdown);
  return tokens.map((token) => token.raw);
}

const MemoizedMarkdownBlock = memo(
  ({ content }: { content: string }) => {
    return (
      <ReactMarkdown
        components={{
          code: CodeBlock,
          pre: Pre,
        }}
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
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

MemoizedMarkdownBlock.displayName = "MemoizedMarkdownBlock";

export const MemoizedMarkdown = memo(
  ({ content, id }: { content: string; id: string }) => {
    const blocks = useMemo(() => parseMarkdownIntoBlocks(content), [content]);

    return blocks.map((block, index) => (
      <MemoizedMarkdownBlock content={block} key={`${id}-block_${index}`} />
    ));
  },
);

MemoizedMarkdown.displayName = "MemoizedMarkdown";

const Message = memo<MessageProps>(({ message, conversationId }) => {
  const [showSearchResults, setShowSearchResults] = useState<
    Record<string, boolean>
  >({});
  const [showReasoning, setShowReasoning] = useState(false);
  const { openCanvas } = useCanvas();
  const t = useTranslations();
  const latestReasoningPrev = useRef<string | null>(null);

  // Track which canvas contents have been auto-opened
  const [autoOpenedCanvas, setAutoOpenedCanvas] = useState<Set<string>>(
    new Set(),
  );

  // Auto-open canvas for new tool-canvas outputs
  useEffect(() => {
    message.parts.forEach((part, index) => {
      if (part.type === "tool-canvas" && part.input) {
        const content = (part.input as any).content;
        const partKey = `${message.id}-${index}`;

        if (content && !autoOpenedCanvas.has(partKey)) {
          openCanvas(content);
          setAutoOpenedCanvas((prev) => new Set(prev).add(partKey));
        }
      }
    });
  }, [message.parts, message.id, openCanvas, autoOpenedCanvas]);

  const toggleSearchResults = (toolCallId: string) => {
    setShowSearchResults((prev) => ({
      ...prev,
      [toolCallId]: !prev[toolCallId],
    }));
  };

  switch (message.role) {
    case "user":
      return (
        <div className="flex items-start gap-4 mb-4">
          <div className="prose ml-auto bg-secondary rounded-2xl p-4 w-fit max-w-[80%]">
            {message.parts.map((part, index) => {
              switch (part.type) {
                case "file":
                  return (
                    <img
                      key={index}
                      src={part.url}
                      alt={part.filename}
                      className="rounded-lg"
                    />
                  );
                case "text":
                  return (
                    <MemoizedMarkdown
                      key={index}
                      content={part.text}
                      id={`${message.id}-text_${index}`}
                    />
                  );

                default:
                  return null;
              }
            })}
          </div>
        </div>
      );
    case "assistant":
      const allText = message.parts
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("\n\n");
      return (
        <div className="flex items-start gap-4 mb-4 group">
          <div className="prose prose-sm max-w-none flex-1">
            {/* Reasoning Section */}
            {message.parts.some(
              (part) => part.type === "reasoning" && part.text.length > 0,
            ) && (
              <div className="mb-4 not-prose" key={message.id}>
                <div>
                  <Button
                    onClick={() => setShowReasoning(!showReasoning)}
                    variant="ghost"
                    className={cn(
                      "flex items-center bg-muted/75 h-fit p-4 w-full",
                      showReasoning && "!rounded-b-none",
                    )}
                  >
                    {(() => {
                      // 最新（最後）のreasoning partを取得（findLast未対応の環境向けに後方から検索）
                      const latestReasoning = (() => {
                        for (let i = message.parts.length - 1; i >= 0; i--) {
                          const t = String(message.parts[i]?.type)
                            .trim()
                            .toLowerCase();
                          if (t === "reasoning") return message.parts[i];
                        }
                        return undefined;
                      })();
                      const text = (latestReasoning as any)?.text ?? "";

                      // **Title** その本文… をすべて拾う
                      const matches = Array.from(
                        text.matchAll(
                          /\*\*(.+?)\*\*([\s\S]*?)(?=(?:\n\s*\*\*|$))/g,
                        ),
                      );

                      // 最後のペアを採用（なければ全文を本文扱い）
                      const last = matches.at(-1) as
                        | RegExpMatchArray
                        | undefined;
                      const title = last?.[1]?.trim();
                      const body = (last?.[2] ?? text).trim();
                      latestReasoningPrev.current = title + body;
                      if (!title) {
                        return (
                          <div className="text-left flex items-center gap-1 w-full">
                            {showReasoning ? <ArrowDown /> : <ArrowRight />}
                            {t("chat.message.viewReasoning")}
                          </div>
                        );
                      }
                      // JSX
                      // titleとbodyが変わるときにアニメーション
                      return (
                        <div className="text-left w-full">
                          {title || body ? (
                            latestReasoning && latestReasoningPrev ? ( // latestReasoningPrevは直前のlatestReasoningを保持するuseRef
                              <AnimatePresence mode="wait">
                                <div className="text-left flex items-center gap-1 w-full">
                                  {showReasoning ? (
                                    <ArrowDown />
                                  ) : (
                                    <ArrowRight />
                                  )}
                                  {title}
                                </div>
                              </AnimatePresence>
                            ) : (
                              <div className="text-left flex items-center gap-1 w-full">
                                {showReasoning ? <ArrowDown /> : <ArrowRight />}
                                {title}
                              </div>
                            )
                          ) : null}
                        </div>
                      );

                      // デフォルト
                      return t("chat.message.viewReasoning");
                    })()}
                  </Button>

                  <motion.div
                    className="bg-card rounded-b-2xl"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{
                      opacity: showReasoning ? 1 : 0,
                      height: showReasoning ? "auto" : 0,
                      padding: showReasoning ? "1rem 0" : "0",
                      paddingTop: "0.2rem",
                    }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    style={{ overflow: "hidden" }}
                  >
                    <div className="space-y-4 p-4">
                      {message.parts
                        .filter((part) => part.type === "reasoning")
                        .map((part, index) => (
                          <div
                            key={index}
                            className="text-sm text-muted-foreground space-y-2"
                          >
                            <MemoizedMarkdown
                              content={part.text}
                              id={`${message.id}-reasoning_${index}`}
                            />
                          </div>
                        ))}
                    </div>
                  </motion.div>
                </div>
              </div>
            )}
            {message.parts.map((part, index) => {
              switch (part.type) {
                case "tool-canvas":
                  if (!part.input) return null;
                  var canvasContent = (part.input as any).content || "";
                  var canvasTitle =
                    (part.input as any).title || t("chat.message.canvas");

                  return (
                    <div
                      key={index}
                      className="bg-secondary rounded-2xl p-4 my-4"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{canvasTitle}</h3>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openCanvas(canvasContent as string)}
                          className="flex items-center gap-1"
                        >
                          <ExternalLink className="h-4 w-4" />
                          {t("chat.message.openInCanvas")}
                        </Button>
                      </div>
                    </div>
                  );

                case "tool-search":
                  if (part.state != "output-available") {
                    return (
                      <div
                        key={index}
                      >
                        <Button
                          variant="outline"
                          className="flex items-center gap-1 mt-3"
                        >
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t("chat.message.searching")}
                        </Button>
                      </div>
                    );
                  }

                  if (!part.output) return null;

                  return (
                    <div key={index}>
                      <Button
                        onClick={() => toggleSearchResults(part.toolCallId)}
                        variant="outline"
                        className="flex items-center gap-1 mt-3"
                      >
                        <Globe className="h-4 w-4" />
                        <span>
                          {t("chat.message.searchedWebsites", {
                            count: (part.output as any).length,
                          })}
                        </span>
                      </Button>

                      {/* The large Search Results card, conditionally rendered and animated */}
                      <motion.div
                        className="bg-secondary rounded-2xl p-4 mt-2"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{
                          opacity: showSearchResults[part.toolCallId] ? 1 : 0,
                          height: showSearchResults[part.toolCallId]
                            ? "auto"
                            : 0,
                          marginTop: showSearchResults[part.toolCallId]
                            ? "0.5rem"
                            : "0",
                          padding: showSearchResults[part.toolCallId]
                            ? "1rem"
                            : "0",
                        }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        style={{ overflow: "hidden" }}
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">
                            {t("chat.message.searchResults")}
                          </h3>
                          <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                            {t("chat.message.searchedWebsites", {
                              count: (part.output as any).length,
                            })}
                          </button>
                        </div>
                        <span className="text-muted-foreground">
                          {t("chat.message.foundResults", {
                            count: (part.output as any).length,
                            query: (part.input as any).query,
                          })}
                        </span>
                        <details className="mt-2" open={true}>
                          {" "}
                          {/* Set open to true to show content initially if animated */}
                          <summary className="cursor-pointer text-sm text-foreground/80 hover:text-foreground transition-colors">
                            {t("chat.message.viewSearchResults")}
                          </summary>
                          <div className="mt-2">
                            {(part.output as any as SearchResult[]).map(
                              (result, idx) => (
                                <div
                                  key={idx}
                                  className="mb-2 border rounded-2xl p-2 w-full"
                                >
                                  <div className="flex items-center gap-2">
                                    <a
                                      href={result.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="!text-foreground transition-colors"
                                    >
                                      {result.title}
                                    </a>
                                    {result.time && (
                                      <span className="text-muted-foreground ml-auto">
                                        {new Date(result.time).getSeconds()}
                                        {"s"}
                                      </span>
                                    )}
                                  </div>
                                  <p
                                    className="!m-0 text-muted-foreground"
                                    dangerouslySetInnerHTML={{
                                      __html: result.description,
                                    }}
                                  />
                                  <div className="mt-2">
                                    <details className="mt-2">
                                      <summary className="cursor-pointer text-sm text-foreground/80 hover:text-foreground transition-colors">
                                        {t("chat.message.pageSummary", {
                                          model:
                                            models[internalModels["search-summary-model"] || "gpt-5"]?.name || "",
                                        })}
                                      </summary>
                                      <MemoizedMarkdownBlock
                                        key={`${message.id}-search-result-${index}-${idx}`}
                                        content={result.content.long}
                                      />
                                    </details>
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        </details>
                      </motion.div>
                    </div>
                  );

                case "step-start":
                  return <Separator key={index} className="my-4" />;
                case "text":
                  if (part.type === "text") {
                    return (
                      <MemoizedMarkdown
                        key={index}
                        content={part.text}
                        id={`${message.id}-part_${index}`}
                      />
                    );
                  }
                default:
                  return null;
              }
            })}
          </div>
          {allText.length > 0 && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <MessageControls text={allText} />
            </div>
          )}
        </div>
      );
    default:
      return null;
  }
});

Message.displayName = "Message";

// Memo化されたプラグイン配列
const remarkPlugins = [remarkGfm, remarkMath];
const rehypePlugins = [rehypeKatex];

export default Message;

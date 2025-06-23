import { UIMessage } from "ai";
import { memo, useMemo, useState } from "react";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { marked } from "marked";
import { Separator } from "@workspace/ui/components/separator";
import { internalModels, models } from "@/lib/constants";
import { CodeBlock, Pre } from "./markdown-components";
import { Button } from "@workspace/ui/components/button";
import { Globe, ExternalLink, ArrowRight, ArrowDown } from "lucide-react";
import { motion } from "framer-motion";
import { useCanvas } from "@/context/canvas-context";

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

const Message = memo<MessageProps>(({ message }) => {
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);
  const { openCanvas } = useCanvas();

  const toggleSearchResults = () => {
    setShowSearchResults(!showSearchResults);
  };

  switch (message.role) {
    case "user":
      return (
        <div className="flex items-start gap-4 mb-4">
          <div className="prose ml-auto bg-secondary rounded-2xl p-4 w-fit max-w-[80%]">
            {message.experimental_attachments &&
              message.experimental_attachments.map((attachment, index) => (
                <img
                  key={index}
                  src={attachment.url}
                  alt={attachment.name}
                  className="rounded-lg max-w-24 max-h-24 w-24 h-24 object-cover mb-2"
                />
              ))}
            {message.parts.map((part, index) => {
              switch (part.type) {
                case "text":
                  return (
                    <MemoizedMarkdown
                      key={index}
                      content={part.text}
                      id={`${message.id}-text_${index}`}
                    />
                  );
                case "file":
                  return (
                    <img
                      key={index}
                      src={part.data}
                      alt="A Image"
                      className="rounded-lg"
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
      return (
        <div className="flex items-start gap-4 mb-4">
          <div className="prose prose-sm max-w-none">
            {/* Reasoning Section */}
            {message.parts.some((part) => part.type === "reasoning") && (
              <div className="mb-4 not-prose" key={message.id}>
                <div>
                  <Button
                    onClick={() => setShowReasoning(!showReasoning)}
                    variant="ghost"
                    className="flex items-center gap-1"
                  >
                    {showReasoning ? <ArrowRight /> : <ArrowDown />}View
                    reasoning process
                  </Button>

                  <motion.div
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
                    <div className="space-y-4">
                      {message.parts
                        .filter((part) => part.type === "reasoning")
                        .map((part, index) => (
                          <div
                            key={index}
                            className="text-sm text-muted-foreground space-y-2"
                          >
                            <MemoizedMarkdown
                              content={part.reasoning}
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
                case "tool-invocation":
                  if (part.toolInvocation.toolName === "canvas") {
                    const canvasContent =
                      part.toolInvocation.args?.content || "";
                    const canvasTitle =
                      part.toolInvocation.args?.title || "Canvas";
                    return (
                      <div key={index} className="bg-secondary rounded-2xl p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{canvasTitle}</h3>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openCanvas(canvasContent)}
                            className="flex items-center gap-1"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Open in Canvas
                          </Button>
                        </div>
                      </div>
                    );
                  }
                  if (part.toolInvocation.toolName === "search") {
                    if (part.toolInvocation.state != "result") {
                      return (
                        <div
                          key={index}
                          className="bg-secondary rounded-2xl p-4 my-1"
                        >
                          <h3 className="font-semibold">Search Results</h3>
                          <span className="text-muted-foreground">
                            Searching with "{part.toolInvocation.args?.query}"
                          </span>
                          <div className="mt-2">
                            <p className="!m-0 animate-pulse text-muted-foreground">
                              Searching...
                            </p>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={index}>
                        <Button
                          onClick={toggleSearchResults}
                          variant="outline"
                          className="flex items-center gap-1 my-1"
                        >
                          <Globe className="h-4 w-4" />
                          <span>
                            searched {part.toolInvocation.result.length}{" "}
                            websites
                          </span>
                        </Button>

                        {/* The large Search Results card, conditionally rendered and animated */}
                        <motion.div
                          className="bg-secondary rounded-2xl p-4 mt-2"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{
                            opacity: showSearchResults ? 1 : 0,
                            height: showSearchResults ? "auto" : 0,
                            marginTop: showSearchResults ? "0.5rem" : "0",
                            padding: showSearchResults ? "1rem" : "0",
                          }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          style={{ overflow: "hidden" }}
                        >
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold">Search Results</h3>
                            <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                              searched {part.toolInvocation.result.length}{" "}
                              websites
                            </button>
                          </div>
                          <span className="text-muted-foreground">
                            Found {part.toolInvocation.result.length} results
                            for "{part.toolInvocation.args.query}"
                          </span>
                          <details className="mt-2" open={true}>
                            {" "}
                            {/* Set open to true to show content initially if animated */}
                            <summary className="cursor-pointer text-sm text-foreground/80 hover:text-foreground transition-colors">
                              View search results
                            </summary>
                            <div className="mt-2">
                              {(
                                part.toolInvocation.result as SearchResult[]
                              ).map((result, idx) => (
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
                                        Page Summary (using{" "}
                                        {
                                          internalModels["search-summary-model"]
                                            ?.name
                                        }
                                        )
                                      </summary>
                                      <MemoizedMarkdownBlock
                                        key={`${message.id}-search-result-${index}-${idx}`}
                                        content={result.content.long}
                                      />
                                    </details>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </details>
                        </motion.div>
                      </div>
                    );
                  }
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

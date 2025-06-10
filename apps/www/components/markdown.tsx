import { Button } from "@workspace/ui/components/button";
import {
  ClassAttributes,
  HTMLAttributes,
  memo,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { ExtraProps } from "react-markdown";
// import SyntaxHighlighter from "react-syntax-highlighter";
import { ShikiHighlighter } from "react-shiki";
import { vs2015 } from "react-syntax-highlighter/dist/esm/styles/hljs";

interface PreProps
  extends ClassAttributes<HTMLPreElement>,
    HTMLAttributes<HTMLPreElement>,
    ExtraProps {
  children?: ReactNode;
}

// Type guard to check if value is a non-null object
const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

interface LinkProps extends HTMLAttributes<HTMLAnchorElement>, ExtraProps {
  href?: string;
  children?: ReactNode;
}

export const Link = memo(({ href, children, ...props }: LinkProps) => {
  const isExternal = href?.startsWith("http") || href?.startsWith("https");

  return isExternal ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-foreground font-bold underline"
      {...props}
    >
      {children}
    </a>
  ) : (
    <a href={href} className="text-foreground font-bold underline" {...props}>
      {children}
    </a>
  );
});
Link.displayName = "Link";

export const MemoizedHighlighter = memo(
  ({ code, language }: { code: string; language: string }) => {
    return (
      // <SyntaxHighlighter
      //   language={language}
      //   style={vs2015}
      //   customStyle={{
      //     padding: "1rem",
      //     borderRadius: "0.75rem",
      //     fontSize: "0.875rem",
      //     lineHeight: "1.25rem",
      //   }}
      // >
      //   {code}
      // </SyntaxHighlighter>
      <ShikiHighlighter
        language={language}
        theme="github-dark"
        showLanguage={false}
        className="!rounded-t-none text-sm w-full overflow-x-auto rounded-b"
      >
        {code}
      </ShikiHighlighter>
    );
  }
);
MemoizedHighlighter.displayName = "MemoizedHighlighter";

export const MemoizedHeader = memo(({ language, handleCopy, copied }: { handleCopy: () => void; language: string, copied: boolean }) => {
  return (
    <div className="flex items-center justify-between bg-secondary rounded-t dark:bg-zinc-800 px-4 py-2 border-b border-border">
      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
        {language || "code"}
      </span>
      <Button
        onClick={handleCopy}
        variant="ghost"
        size="sm"
        className="text-xs font-medium text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-700"
      >
        {copied ? "Copied!" : "Copy"}
      </Button>
    </div>
  );
});

export const Pre = memo(({ children, ...props }: PreProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!children) return;

    // Safely extract code content from children
    let code = "";
    if (isObject(children) && "props" in children && isObject(children.props)) {
      code = String(children.props.children || "");
    }

    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  // Get language from className prop if available
  const language =
    isObject(children) &&
    "props" in children &&
    isObject(children.props) &&
    typeof children.props.className === "string"
      ? children.props.className.replace("language-", "")
      : "";

  return (
    <div className="not-prose flex flex-col">
      <div className="relative overflow-x-auto">
        {/* <MemoizedHeader
          language={language}
          handleCopy={handleCopy}
          copied={copied}
        /> */}

        <Button
          onClick={handleCopy}
          variant="secondary"
          size="sm"
          className="absolute top-2 right-2 z-10 text-xs shadow-md font-medium hover:!bg-primary hover:!text-primary-foreground"
        >
          {copied ? "Copied!" : "Copy"}
        </Button>

        <MemoizedHighlighter
          code={
            isObject(children) && "props" in children
              ? String((children.props as any)?.children || "")
              : String(children || "")
          }
          language={language}
        />
        
        {/* <div className="not-prose flex flex-col">
          <pre
            {...props}
            className={`text-sm w-full overflow-x-auto dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-700 rounded-xl dark:text-zinc-50 text-zinc-900`}
          >
            <code className="whitespace-pre-wrap break-words">
              {isObject(children) && "props" in children
                ? String((children.props as any)?.children || "")
                : String(children || "")}
            </code>
          </pre>
        </div> */}
      </div>{" "}
    </div>
  );
});
Pre.displayName = "Pre";

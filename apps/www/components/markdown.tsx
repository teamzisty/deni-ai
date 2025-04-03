import { Button } from "@repo/ui/components/button";
import {
  ClassAttributes,
  HTMLAttributes,
  memo,
  useState,
  ReactNode,
} from "react";
import { ExtraProps } from "react-markdown";
import SyntaxHighlighter from "react-syntax-highlighter";
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
      <SyntaxHighlighter
        language={language}
        style={vs2015}
        customStyle={{
          padding: "1rem",
          borderRadius: "0.75rem",
          fontSize: "0.875rem",
          lineHeight: "1.25rem",
        }}
      >
        {code}
      </SyntaxHighlighter>
    );
  }
);
MemoizedHighlighter.displayName = "MemoizedHighlighter";

export const Pre = memo(({ children, ...props }: PreProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!children) return;

    // Safely extract code content from children
    let code = "";
    if (isObject(children) && "props" in children && isObject(children.props)) {
      code = String(children.props.children || "");
    }

    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Get language from className prop if available
  // const language =
  //   isObject(children) &&
  //   "props" in children &&
  //   isObject(children.props) &&
  //   typeof children.props.className === "string"
  //     ? children.props.className.replace("language-", "")
  //     : "";

  return (
    <div className="not-prose flex flex-col">
      <div className="relative">
        <Button
          onClick={handleCopy}
          variant="ghost"
          className="absolute right-2 top-2 rounded-md px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          {copied ? "Copied!" : "Copy"}
        </Button>

        {/* <MemoizedHighlighter
          code={
            isObject(children) && "props" in children
              ? String((children.props as any)?.children || "")
              : String(children || "")
          }
          language={language}
        /> */}
        <div className="not-prose flex flex-col">
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
        </div>
      </div>{" "}
    </div>
  );
});
Pre.displayName = "Pre";

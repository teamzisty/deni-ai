import { Button } from "@workspace/ui/components/button";
import {
  ClassAttributes,
  HTMLAttributes,
  memo,
  useState,
  ReactNode,
  useCallback,
  ComponentProps,
  createContext,
  useContext,
} from "react";
import { ExtraProps } from "react-markdown";
import { ShikiHighlighter } from "react-shiki";

interface PreProps
  extends ClassAttributes<HTMLPreElement>,
    HTMLAttributes<HTMLPreElement>,
    ExtraProps {
  children?: ReactNode;
}

type CodeComponentProps = ComponentProps<'code'> & ExtraProps;
type MarkdownSize = 'default' | 'small';

const MarkdownSizeContext = createContext<MarkdownSize>('default');

// Type guard to check if value is a non-null object
const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

export const MemoizedHighlighter = memo(
  ({ code, language }: { code: string; language: string }) => {
    return (
      <ShikiHighlighter
        language={language}
        theme="github-dark"
        showLanguage={false}
        className="!rounded-t-none text-sm w-full overflow-x-auto rounded-b"
      >
        {code}
      </ShikiHighlighter>
    );
  },
);
MemoizedHighlighter.displayName = "MemoizedHighlighter";

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
  }, [children]);

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
      </div>
    </div>
  );
});
Pre.displayName = "Pre";

export function CodeBlock({ children, className, ...props }: CodeComponentProps) {
  const size = useContext(MarkdownSizeContext);
  const match = /language-(\w+)/.exec(className || '');

  if (match) {
    return <>{children}</>;
  }

  const inlineCodeClasses =
    size === 'small'
      ? 'mx-0.5 overflow-auto rounded-md px-1 py-0.5 bg-primary/10 text-foreground font-mono text-xs'
      : 'mx-0.5 overflow-auto rounded-md px-2 py-1 bg-primary/10 text-foreground font-mono';

  return (
    <code className={inlineCodeClasses} {...props}>
      {children}
    </code>
  );
}
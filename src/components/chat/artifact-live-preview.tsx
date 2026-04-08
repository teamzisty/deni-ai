"use client";

import type ts from "typescript";
import type { ReactNode } from "react";
import * as React from "react";
import * as ReactDomClient from "react-dom/client";
import * as ReactJsxDevRuntime from "react/jsx-dev-runtime";
import * as ReactJsxRuntime from "react/jsx-runtime";
import { AlertCircleIcon } from "lucide-react";
import { Component, startTransition, useEffect, useMemo, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

const DIRECT_JSX_REGEX = /^\s*(?:<>|<\w|<\s*[A-Z])/;
const REACT_IMPORT_SPECIFIERS = new Set([
  "react",
  "react-dom/client",
  "react/jsx-dev-runtime",
  "react/jsx-runtime",
]);

const COMPONENT_NAME_PATTERNS = [
  /\bexport\s+function\s+([A-Z]\w*)\b/,
  /\bfunction\s+([A-Z]\w*)\b/,
  /\bconst\s+([A-Z]\w*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/,
  /\blet\s+([A-Z]\w*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/,
  /\bvar\s+([A-Z]\w*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/,
] as const;

type PreviewState =
  | { status: "idle" | "loading" }
  | { status: "ready"; element: React.ReactElement; resetKey: string }
  | { status: "error"; error: Error };

const stripCodeFence = (code: string) =>
  code
    .replace(/^\s*```[\w-]*\n/, "")
    .replace(/\n```\s*$/, "")
    .trim();

const findUnsupportedImports = (source: string) =>
  Array.from(source.matchAll(/^\s*import[\s\S]*?from\s*["']([^"']+)["'];?\s*$/gm))
    .map((match) => match[1])
    .filter((specifier) => !REACT_IMPORT_SPECIFIERS.has(specifier));

const resolvePreviewSource = (rawCode: string) => {
  const source = stripCodeFence(rawCode);

  if (!source) {
    throw new Error("Nothing to preview.");
  }

  const unsupportedImports = findUnsupportedImports(source);
  if (unsupportedImports.length > 0) {
    throw new Error(
      `Live preview does not support imports from ${unsupportedImports
        .map((specifier) => `"${specifier}"`)
        .join(", ")} yet.`,
    );
  }

  if (DIRECT_JSX_REGEX.test(source)) {
    return `export default function Preview() { return (${source}); }`;
  }

  if (/\bexport\s+default\b/.test(source)) {
    return source;
  }

  for (const pattern of COMPONENT_NAME_PATTERNS) {
    const match = source.match(pattern);
    if (match) {
      return `${source}\n\nexport default ${match[1]};`;
    }
  }

  return `export default function Preview() { return (${source}); }`;
};

const formatDiagnostics = (typescript: typeof ts, diagnostics: readonly ts.Diagnostic[]) =>
  diagnostics
    .map((diagnostic) => typescript.flattenDiagnosticMessageText(diagnostic.messageText, "\n"))
    .filter(Boolean)
    .join("\n");

const evaluatePreview = async (rawCode: string) => {
  const typescript = await import("typescript");
  const source = resolvePreviewSource(rawCode);
  const transpiled = typescript.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      jsx: typescript.JsxEmit.React,
      module: typescript.ModuleKind.CommonJS,
      target: typescript.ScriptTarget.ES2020,
    },
    reportDiagnostics: true,
  });

  const diagnostics = transpiled.diagnostics?.filter(
    (diagnostic) => diagnostic.category === typescript.DiagnosticCategory.Error,
  );

  if (diagnostics && diagnostics.length > 0) {
    throw new Error(formatDiagnostics(typescript, diagnostics));
  }

  let capturedElement: React.ReactElement | null = null;
  const reactDomClientShim = {
    createRoot(_container: unknown, _options: unknown) {
      return {
        render(children: React.ReactNode) {
          if (React.isValidElement(children)) {
            capturedElement = children;
          }
        },
        unmount() {},
      };
    },
    hydrateRoot(_container: unknown, initialChildren: React.ReactNode, _options: unknown) {
      if (React.isValidElement(initialChildren)) {
        capturedElement = initialChildren;
      }
      return {
        render(children: React.ReactNode) {
          if (React.isValidElement(children)) {
            capturedElement = children;
          }
        },
        unmount() {},
      } as ReturnType<typeof ReactDomClient.hydrateRoot>;
    },
  };

  const module = { exports: {} as Record<string, unknown> };
  const exports = module.exports;
  const require = (specifier: string) => {
    if (specifier === "react") {
      return React;
    }

    if (specifier === "react-dom/client") {
      return reactDomClientShim;
    }

    if (specifier === "react/jsx-runtime") {
      return ReactJsxRuntime;
    }

    if (specifier === "react/jsx-dev-runtime") {
      return ReactJsxDevRuntime;
    }

    throw new Error(`Live preview does not support imports from "${specifier}" yet.`);
  };

  const evaluated = new Function(
    "exports",
    "module",
    "require",
    "React",
    `${transpiled.outputText}\nreturn module.exports.default ?? exports.default ?? module.exports;`,
  )(exports, module, require, React);

  if (capturedElement) {
    return capturedElement;
  }

  if (React.isValidElement(evaluated)) {
    return evaluated;
  }

  if (typeof evaluated === "function") {
    return React.createElement(evaluated);
  }

  throw new Error("Preview code must export a React component or JSX element.");
};

class PreviewErrorBoundary extends Component<
  {
    children: ReactNode;
    resetKey: string;
  },
  { error: Error | null }
> {
  override state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  override componentDidUpdate(prevProps: Readonly<{ resetKey: string }>) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  override render() {
    if (this.state.error) {
      return (
        <div className="flex h-full items-center justify-center p-6">
          <PreviewErrorMessage error={this.state.error} />
        </div>
      );
    }

    return this.props.children;
  }
}

function PreviewErrorMessage({ error, className }: { error: Error; className?: string }) {
  return (
    <div
      className={cn(
        "flex max-w-xl items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-left text-sm text-destructive",
        className,
      )}
    >
      <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
      <div className="space-y-1">
        <p className="font-medium">Preview failed</p>
        <p className="whitespace-pre-wrap break-words text-destructive/90">{error.message}</p>
      </div>
    </div>
  );
}

export function ArtifactLivePreview({ code }: { code: string }) {
  const [state, setState] = useState<PreviewState>({ status: "idle" });
  const resetKey = useMemo(() => `${code.length}:${code.slice(0, 100)}`, [code]);

  useEffect(() => {
    let cancelled = false;

    setState({ status: "loading" });

    void evaluatePreview(code)
      .then((element) => {
        if (cancelled) {
          return;
        }

        startTransition(() => {
          setState({ status: "ready", element, resetKey });
        });
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        startTransition(() => {
          setState({
            status: "error",
            error: error instanceof Error ? error : new Error("Preview failed."),
          });
        });
      });

    return () => {
      cancelled = true;
    };
  }, [code, resetKey]);

  if (state.status === "idle" || state.status === "loading") {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
        <Spinner className="size-4" />
        <span>Building preview…</span>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <PreviewErrorMessage error={state.error} />
      </div>
    );
  }

  if (state.status !== "ready") {
    return null;
  }

  return (
    <PreviewErrorBoundary resetKey={state.resetKey}>
      <div className="h-full overflow-auto bg-background p-4">{state.element}</div>
    </PreviewErrorBoundary>
  );
}

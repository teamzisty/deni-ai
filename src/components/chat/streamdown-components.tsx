"use client";

import type { ComponentProps, ReactNode } from "react";
import { EyeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useArtifactPreview } from "@/components/chat/artifact-preview-context";

const PREVIEWABLE = new Set(["html", "htm", "jsx", "tsx", "react"]);

// Streamdown renders code blocks as <pre data-language="..."><code>...</code></pre>
function PreWithPreview(props: ComponentProps<"pre">) {
  const { open } = useArtifactPreview();
  // biome-ignore lint/suspicious/noExplicitAny: streamdown passes data-language as a custom attribute
  const language = ((props as any)["data-language"] as string | undefined) ?? "";
  const isPreviewable = PREVIEWABLE.has(language.toLowerCase());

  if (!isPreviewable) {
    return <pre {...props} />;
  }

  // Extract text content from children to get the raw code
  const extractText = (node: ReactNode): string => {
    if (typeof node === "string") return node;
    if (typeof node === "number") return String(node);
    if (Array.isArray(node)) return node.map(extractText).join("");
    if (node && typeof node === "object" && "props" in node) {
      // biome-ignore lint/suspicious/noExplicitAny: React element children
      return extractText((node as any).props.children);
    }
    return "";
  };

  const code = extractText(props.children);

  return (
    <div className="group relative">
      <pre {...props} />
      <Button
        variant="outline"
        size="sm"
        className="absolute right-2 top-2 hidden gap-1.5 text-xs group-hover:flex"
        onClick={() => open(code, language)}
      >
        <EyeIcon className="size-3.5" />
        Preview
      </Button>
    </div>
  );
}

export const streamdownOverrideComponents = {
  pre: PreWithPreview,
};

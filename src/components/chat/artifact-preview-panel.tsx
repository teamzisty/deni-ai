"use client";

import { CopyIcon, ExternalLinkIcon, XIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { ArtifactLivePreview } from "@/components/chat/artifact-live-preview";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useArtifactPreview } from "@/components/chat/artifact-preview-context";

const HTML_PREVIEWABLE_LANGUAGES = new Set(["html", "htm"]);
const LIVE_PREVIEWABLE_LANGUAGES = new Set(["html", "htm", "jsx", "tsx", "react"]);

export function ArtifactPreviewPanel() {
  const { isOpen, code, language, close } = useArtifactPreview();
  const [copied, setCopied] = useState(false);

  const normalizedLanguage = language.toLowerCase();
  const isHtml = HTML_PREVIEWABLE_LANGUAGES.has(normalizedLanguage);
  const isLivePreviewable = LIVE_PREVIEWABLE_LANGUAGES.has(normalizedLanguage);

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  const handleOpenInTab = useCallback(() => {
    const blob = new Blob([code], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    // Revoke after a short delay to allow the tab to load
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }, [code]);

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <SheetContent
        side="right"
        className="flex w-[50vw] max-w-3xl min-w-80 flex-col gap-0 p-0 sm:max-w-3xl"
      >
        <SheetHeader className="flex flex-row items-center justify-between border-b px-4 py-3">
          <SheetTitle className="text-sm font-medium">
            Preview
            {language ? (
              <span className="ml-2 rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                {language}
              </span>
            ) : null}
          </SheetTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={handleCopy}
              title="Copy code"
            >
              <CopyIcon className="size-3.5" />
              <span className="sr-only">{copied ? "Copied" : "Copy"}</span>
            </Button>
            {isHtml && (
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={handleOpenInTab}
                title="Open in new tab"
              >
                <ExternalLinkIcon className="size-3.5" />
                <span className="sr-only">Open in new tab</span>
              </Button>
            )}
            <Button variant="ghost" size="icon" className="size-7" onClick={close} title="Close">
              <XIcon className="size-3.5" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-hidden">
          {isHtml ? (
            <iframe
              key={code}
              srcDoc={code}
              sandbox="allow-scripts"
              className="size-full border-0"
              title="HTML preview"
            />
          ) : isLivePreviewable ? (
            <ArtifactLivePreview code={code} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-sm text-muted-foreground">
              <p>
                Live preview is supported for HTML, JSX, and TSX. For other languages, copy the code
                into your own environment.
              </p>
              <Button variant="outline" size="sm" onClick={handleCopy}>
                <CopyIcon className="size-3.5" />
                {copied ? "Copied!" : "Copy code"}
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

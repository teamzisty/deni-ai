"use client";

import type { UIMessage } from "ai";
import { DownloadIcon, FileJsonIcon, FileTextIcon, PrinterIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportAsJson, exportAsMarkdown, exportAsPdf, triggerDownload } from "@/lib/chat-export";

interface ChatExportMenuProps {
  messages: UIMessage[];
  chatTitle?: string | null;
}

export function ChatExportMenu({ messages, chatTitle }: ChatExportMenuProps) {
  const filename = chatTitle ?? "chat";
  const safeFilename = filename.replace(/[^a-z0-9\u3040-\u9fff\s-]/gi, "").trim() || "chat";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-7 shrink-0" title="Export chat">
          <DownloadIcon className="size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onSelect={() => {
            const content = exportAsMarkdown(messages, chatTitle ?? undefined);
            triggerDownload(content, `${safeFilename}.md`, "text/markdown");
          }}
        >
          <FileTextIcon className="size-4" />
          Export as Markdown
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            const content = exportAsJson(messages);
            triggerDownload(content, `${safeFilename}.json`, "application/json");
          }}
        >
          <FileJsonIcon className="size-4" />
          Export as JSON
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={exportAsPdf}>
          <PrinterIcon className="size-4" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

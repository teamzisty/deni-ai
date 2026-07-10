"use client";

import type { UIMessage } from "ai";
import { FolderKanban } from "lucide-react";
import dynamic from "next/dynamic";
import { useExtracted } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc/react";

const ChatExportMenu = dynamic(
  () => import("@/components/chat/chat-export-menu").then((mod) => mod.ChatExportMenu),
  { ssr: false },
);

export interface ChatInterfaceHeaderProps {
  id: string;
  messages: UIMessage[];
  initialProjectId?: string | null;
  initialProjectName?: string | null;
}

export function ChatInterfaceHeader({
  id,
  messages,
  initialProjectId,
  initialProjectName,
}: ChatInterfaceHeaderProps) {
  const t = useExtracted();
  const chatTitleQuery = trpc.chat.getChat.useQuery(
    { id },
    { staleTime: Number.POSITIVE_INFINITY, refetchOnMount: false, refetchOnWindowFocus: false },
  );
  const chatTitle = chatTitleQuery.data?.[0]?.title ?? null;

  return (
    <div className="mb-3 flex items-center gap-2 min-h-7">
      {initialProjectId && initialProjectName ? (
        <Badge variant="outline" className="gap-1.5 rounded-full px-2.5 py-1 text-xs">
          <FolderKanban className="size-3.5" />
          <span className="text-muted-foreground">{t("Projects")}</span>
          <span className="text-foreground">{initialProjectName}</span>
        </Badge>
      ) : null}
      {messages.length > 0 ? (
        <div className="ml-auto">
          <ChatExportMenu messages={messages} chatTitle={chatTitle ?? null} />
        </div>
      ) : null}
    </div>
  );
}

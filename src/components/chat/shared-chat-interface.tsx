"use client";

import type { UIMessage } from "ai";
import { GitFork, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useExtracted } from "next-intl";
import { toast } from "sonner";
import { SharedChatMessages } from "@/components/chat/shared-chat-messages";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { trpc } from "@/lib/trpc/react";

interface SharedChatInterfaceProps {
  shareId: string;
  chat: { id: string; title: string | null };
  messages: UIMessage[];
  owner: { id: string; name: string; image: string | null } | null | undefined;
  allowFork: boolean;
  isOwner: boolean;
  isLoggedIn: boolean;
}

function getMessageRenderKeys(messages: UIMessage[]) {
  const occurrences = new Map<string, number>();

  return messages.map((message, index) => {
    const baseKey =
      typeof message.id === "string" && message.id.trim().length > 0
        ? message.id.trim()
        : `message-${index}`;
    const duplicateCount = occurrences.get(baseKey) ?? 0;

    occurrences.set(baseKey, duplicateCount + 1);

    return duplicateCount === 0 ? baseKey : `${baseKey}-${duplicateCount}`;
  });
}

export function SharedChatInterface({
  shareId,
  chat,
  messages,
  owner,
  allowFork,
  isOwner: _isOwner,
  isLoggedIn,
}: SharedChatInterfaceProps) {
  const t = useExtracted();
  const { push } = useRouter();
  const messageRenderKeys = getMessageRenderKeys(messages);

  const forkChat = trpc.share.forkChat.useMutation({
    onSuccess: (forkedChat) => {
      toast.success(t("Conversation forked!"));
      push(`/chat/${forkedChat.id}`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleFork = () => {
    if (!isLoggedIn) {
      push("/auth/sign-in");
      return;
    }
    forkChat.mutate({ shareId });
  };

  return (
    <div className="flex h-full flex-1 min-h-0 flex-col w-full max-w-3xl mx-auto p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-4 pb-4 border-b">
        <div className="flex items-center gap-3">
          <Avatar className="size-8">
            <AvatarImage src={owner?.image ?? undefined} />
            <AvatarFallback>
              <User className="size-4" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-semibold">{chat.title || t("Untitled")}</h1>
            <p className="text-xs text-muted-foreground">
              {t("Shared by {name}", { name: owner?.name || t("Unknown") })}
            </p>
          </div>
        </div>

        {allowFork && (
          <Button onClick={handleFork} disabled={forkChat.isPending}>
            {forkChat.isPending ? <Spinner /> : <GitFork className="size-4" />}
            {isLoggedIn ? t("Fork & Continue") : t("Sign in to Fork")}
          </Button>
        )}
      </div>

      <SharedChatMessages messages={messages} messageRenderKeys={messageRenderKeys} />
    </div>
  );
}

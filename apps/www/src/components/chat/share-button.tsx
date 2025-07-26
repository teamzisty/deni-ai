"use client";

import { FC } from "react";
import { Button } from "@workspace/ui/components/button";
import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Conversation } from "@/lib/conversations";
import { User } from "@supabase/supabase-js";
import { Message } from "ai";
import { useSupabase } from "@/context/supabase-context";
import { useTranslations } from "@/hooks/use-translations";

interface ShareButtonProps {
  conversation: Conversation | undefined;
  user: User | null;
  messages: Message[];
  authToken: string;
}

export const ShareButton: FC<ShareButtonProps> = ({
  conversation,
  user,
  messages,
  authToken,
}) => {
  const { secureFetch } = useSupabase();
  const t = useTranslations();

  const handleShare = async () => {
    if (!conversation || !user) {
      toast.error(t("chat.share.loginRequired"));
      return;
    }

    if (messages.length === 0) {
      toast.error(t("chat.share.emptyConversation"));
      return;
    }

    try {
      const response = await secureFetch("/api/share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          sessionId: conversation.id,
          title: conversation.title || t("chat.message.untitledConversation"),
          messages: messages,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t("chat.share.shareFailed"));
      }

      const data = await response.json();

      // Copy URL to clipboard
      const shareUrl = `${window.location.origin}${data.shareUrl}`;
      await navigator.clipboard.writeText(shareUrl);

      toast.success(t("chat.share.shareSuccess"), {
        description: t("chat.share.linkCopied"),
      });
    } catch (error) {
      console.error(error);
      toast.error(t("chat.share.shareFailed"), {
        description:
          error instanceof Error ? error.message : t("chat.share.unknownError"),
      });
    }
  };

  return (
    <Button
      onClick={handleShare}
      variant="ghost"
      size="sm"
      className="flex items-center gap-2"
    >
      <Share2 className="h-4 w-4" />
      <span>{t("chat.share.shareButton")}</span>
    </Button>
  );
};

"use client";

import { FC } from "react";
import { Button } from "@workspace/ui/components/button";
import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Conversation } from "@/lib/conversations";
import { UIMessage } from "ai";
import { useTranslations } from "@/hooks/use-translations";
import { User } from "better-auth";
import { trpc } from "@/trpc/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@workspace/ui/lib/utils";

interface ShareButtonProps {
  conversation: Conversation | undefined;
  user: User | null;
  messages: UIMessage[];
}

export const ShareButton: FC<ShareButtonProps> = ({
  conversation,
  user,
  messages,
}) => {
  const { mutateAsync: shareConversation } =
    trpc.conversation.shareConversation.useMutation();
  const t = useTranslations();
  const isMobile = useIsMobile();

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
      const sharedConversation = await shareConversation({
        conversationId: conversation.id,
      });

      if (!sharedConversation) {
        toast.error(t("chat.share.shareFailed"));
        return;
      }

      // Copy URL to clipboard
      const shareUrl = `${window.location.origin}/share/${sharedConversation?.id}`;
      await navigator.clipboard.writeText(shareUrl);

      toast.success(t("chat.share.shareSuccess"), {
        description: t("chat.share.linkCopied", { shareUrl }),
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
      className={cn(
        "flex items-center gap-2 fixed bg-background/40 backdrop-blur-xs shadow-sm rounded-full mt-3.5 md:mt-4 top-0",
        isMobile && "left-12",
      )}
    >
      <Share2 className="h-4 w-4" />
      <span>{t("chat.share.shareButton")}</span>
    </Button>
  );
};

import { FC } from "react";
import { Button } from "@workspace/ui/components/button";
import { Share2 } from "lucide-react"; // Assuming Share2 is from lucide-react
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
import { ChatSession } from "@/hooks/use-chat-sessions";
import { User } from "firebase/auth";
import { Message } from "ai";

interface ShareButtonProps {
  currentSession: ChatSession;
  user: User;
  messages: Message[];
}

const ShareButton: FC<ShareButtonProps> = ({
  currentSession,
  user,
  messages,
}) => {
  const t = useTranslations();
  const isMobile = useIsMobile();

  const handleShare = async () => {
    if (!currentSession || !user) {
      toast.error(t("chat.error.shareNotLoggedIn"));
      return;
    }

    if (messages.length === 0) {
      toast.error(t("chat.error.shareNoMessages"));
      return;
    }

    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: idToken,
        },
        body: JSON.stringify({
          sessionId: currentSession.id,
          title: currentSession.title,
          messages: messages,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t("chat.error.shareFailed"));
      }

      const data = await response.json();

      // クリップボードにURLをコピー
      const shareUrl = `${window.location.origin}${data.shareUrl}`;
      await navigator.clipboard.writeText(shareUrl);

      toast.success(t("chat.shareSuccess"), {
        description: t("chat.shareLinkCopied"),
      });
    } catch (error) {
      console.error(error);
      toast.error(t("chat.error.shareFailed"), {
        description:
          error instanceof Error ? error.message : t("common.error.unknown"),
      });
    }
  };

  return (
    <>
      <Share2 />
      {t("chat.share")}
    </>
  );
};

export default ShareButton;

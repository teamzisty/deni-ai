"use client";

import { FC } from "react";
import { Button } from "@workspace/ui/components/button";
import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Conversation } from "@/lib/conversations";
import { User } from "@supabase/supabase-js";
import { Message } from "ai";
import { useSupabase } from "@/context/supabase-context";

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
  
  const handleShare = async () => {
    if (!conversation || !user) {
      toast.error("Please log in to share conversations");
      return;
    }

    if (messages.length === 0) {
      toast.error("Cannot share an empty conversation");
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
          title: conversation.title || "Untitled Conversation",
          messages: messages,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to share conversation");
      }

      const data = await response.json();

      // Copy URL to clipboard
      const shareUrl = `${window.location.origin}${data.shareUrl}`;
      await navigator.clipboard.writeText(shareUrl);

      toast.success("Conversation shared!", {
        description: "Link copied to clipboard",
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to share conversation", {
        description: error instanceof Error ? error.message : "Unknown error",
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
      <span>Share</span>
    </Button>
  );
};
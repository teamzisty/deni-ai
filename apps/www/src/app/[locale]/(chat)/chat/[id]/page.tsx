"use client";

import MainChat from "@/components/main-chat";
import { useConversations } from "@/hooks/use-conversations";
import { loading_words } from "@/lib/constants";
import { Loader2 } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function ChatPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const [loadingWord] = useState<string>(
    loading_words[Math.floor(Math.random() * loading_words.length)] ||
      "Please wait...",
  );

  const { conversations, loading } = useConversations();

  if (loading && loadingWord) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader2 className="animate-spin" />
        <span className="ml-2">{loadingWord}</span>
      </div>
    );
  }

  return (
    <MainChat
      initialConversation={conversations.find((conv) => conv.id === params.id)}
      initialInput={searchParams.get("input") || ""}
    />
  );
}

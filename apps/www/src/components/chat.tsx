"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useState, useCallback, memo } from "react";
import ChatInput from "./chat/input";
import { redirect, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { loading_words } from "@/lib/constants";
import { useSupabase } from "@/context/supabase-context";
import { useConversations } from "@/hooks/use-conversations";

const Chat = memo(() => {
  const { user, loading } = useSupabase();
  const router = useRouter();
  const [loadingWord, setLoadingWord] = useState<string | undefined>(() =>
    loading_words[Math.floor(Math.random() * loading_words.length)]
  );
  const { createConversation } = useConversations();
  const [input, setInput] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      redirect("/auth/login");
    }
  }, [loading, user]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  }, []);

  const handleSubmit = useCallback(async (event?: { preventDefault?: (() => void) | undefined; }) => {
    event?.preventDefault?.();
    const conversation = await createConversation();
    router.push(`/chat/${conversation?.id}?input=${encodeURIComponent(input)}`);
  }, [createConversation, router, input]);

  if (loading && loadingWord) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader2 className="animate-spin" />
        <span className="ml-2">{loadingWord}</span>
      </div>
    );
  }

  return (
    <main>
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <div className="w-full max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">
              How can I help you today?
            </h1>
          </div>

          {/* Chat Input */}
          <ChatInput
            handleSubmit={handleSubmit}
            handleInputChange={handleInputChange}
            input={input}
          />

          <SuggestionCards />
        </div>
      </div>
    </main>
  );
});

// 提案カードコンポーネントを分離
const SuggestionCards = memo(() => {
  const suggestions = [
    "Illustrate Python dictionary comprehension",
    "Evaluate arguments for universal healthcare",
    "Debate free will in a deterministic world"
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-8 w-3/4 mx-auto">
      {suggestions.map((suggestion, index) => (
        <button key={index} className="p-4 rounded-xl shadow-sm border border-border hover:shadow-md transition-shadow text-left">
          <span className="text-sm">
            {suggestion}
          </span>
        </button>
      ))}
    </div>
  );
});

SuggestionCards.displayName = "SuggestionCards";
Chat.displayName = "Chat";

export default Chat;

"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useCallback, memo } from "react";
import ChatInput from "./chat/input";
import { useRouter } from "@/i18n/navigation";
import { Loader2 } from "lucide-react";
import { loading_words } from "@/lib/constants";
import { useAuth } from "@/context/auth-context";
import { useConversations } from "@/hooks/use-conversations";
import { useTranslations } from "@/hooks/use-translations";

const Chat = memo(() => {
  const { user, isPending } = useAuth();
  const router = useRouter();
  const [loadingWord, setLoadingWord] = useState<string | undefined>(
    () => loading_words[Math.floor(Math.random() * loading_words.length)],
  );
  const { createConversation } = useConversations();
  const [input, setInput] = useState("");
  const t = useTranslations();

  const handleInputChange = useCallback(
    (
      e:
        | React.ChangeEvent<HTMLInputElement>
        | React.ChangeEvent<HTMLTextAreaElement>,
    ) => {
      setInput(e.target.value);
    },
    [],
  );

  const sendMessage = useCallback(
    async ({ text }: { text: string }) => {
      if (!text) return;
      const conversation = await createConversation();
      router.push(
        `/chat/${conversation?.id}?input=${encodeURIComponent(text)}`,
      );
    },
    [createConversation, router],
  );

  if (isPending && loadingWord) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader2 className="animate-spin" />
        <span className="ml-2">{loadingWord}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold  bg-gradient-to-r from-lime-400 via-sky-500 to-fuchsia-600 bg-clip-text text-transparent animate-welcome mb-4">
            {t("chat.welcome.default")}
          </h1>
        </div>

        {/* Chat Input */}
        <ChatInput
          sendMessage={sendMessage as any}
          setInput={setInput}
          input={input}
        />

        <SuggestionCards />
      </div>
    </div>
  );
});

// 提案カードコンポーネントを分離
const SuggestionCards = memo(() => {
  return null;

  const t = useTranslations();
  const suggestions = [
    t("chat.suggestions.python"),
    t("chat.suggestions.healthcare"),
    t("chat.suggestions.freeWill"),
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-8 w-3/4 mx-auto">
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          className="p-4 rounded-xl shadow-sm border border-border hover:shadow-md transition-shadow text-left"
        >
          <span className="text-sm">{suggestion}</span>
        </button>
      ))}
    </div>
  );
});

SuggestionCards.displayName = "SuggestionCards";
Chat.displayName = "Chat";

export default Chat;

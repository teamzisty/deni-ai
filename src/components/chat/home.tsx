"use client";

import { useRouter } from "next/navigation";
import { useExtracted } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Composer, type ComposerMessage } from "@/components/chat/composer";
import { trpc } from "@/lib/trpc/react";

// Storage key for passing initial message data to chat page
const INITIAL_MESSAGE_STORAGE_KEY = "deni_initial_message";

export type InitialMessageData = {
  text: string;
  files: Array<{
    type: "file";
    filename?: string;
    mediaType: string;
    url: string;
  }>;
  webSearch: boolean;
};

export default function ChatHome() {
  const t = useExtracted();
  const router = useRouter();
  const [input, setInput] = useState("");
  const [webSearch, setWebSearch] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createChatMutation = trpc.chat.createChat.useMutation();

  const handleSubmit = async (message: ComposerMessage) => {
    if (!message.text.trim() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Create a new chat via tRPC
      const chatId = await createChatMutation.mutateAsync();

      // Store the initial message data in sessionStorage
      const initialMessageData: InitialMessageData = {
        text: message.text,
        files: message.files.map((file) => ({
          type: "file" as const,
          filename: file.filename,
          mediaType: file.mediaType,
          url: file.url,
        })),
        webSearch,
      };

      sessionStorage.setItem(INITIAL_MESSAGE_STORAGE_KEY, JSON.stringify(initialMessageData));

      // Navigate to the chat page
      router.push(`/chat/${chatId}`);
    } catch (error) {
      console.error("Failed to create chat:", error);
      toast.error(t("An error occurred while starting the chat."));
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col gap-8 items-center justify-center text-center p-4">
      <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tighter">
        {t("Hello, How can I help you today?")}
      </h1>

      <div className="w-full max-w-2xl text-left">
        <Composer
          onSubmit={handleSubmit}
          globalDrop
          multiple
          value={input}
          onValueChange={(value) => setInput(value)}
          placeholder={t("Ask me anything...")}
          textareaClassName="min-h-[60px]"
          webSearch={webSearch}
          onToggleWebSearch={() => setWebSearch(!webSearch)}
          isSubmitDisabled={isSubmitting}
        />
      </div>
    </main>
  );
}

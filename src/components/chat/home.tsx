"use client";

import { MessageSquare, Code, Image, FileText, PenLine } from "lucide-react";
import { useRouter } from "next/navigation";
import { useExtracted } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import {
  ChatComposer,
  type ComposerMessage,
  type ReasoningEffort,
} from "@/components/chat/chat-composer";
import { models } from "@/lib/constants";
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
  model: string;
  videoMode: boolean;
  imageMode: boolean;
  reasoningEffort: ReasoningEffort;
};

type SuggestionCardProps = {
  icon: React.ElementType;
  title: string;
  prompt: string;
  onClick: (prompt: string) => void;
};

function SuggestionCard({ icon: Icon, title, prompt, onClick }: SuggestionCardProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(prompt)}
      className="group flex flex-col gap-1.5 p-3 rounded-lg border border-border bg-card text-left transition-colors hover:bg-accent"
    >
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="font-medium text-sm">{title}</span>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
        {prompt}
      </p>
    </button>
  );
}

export default function ChatHome() {
  const t = useExtracted();
  const router = useRouter();
  const [input, setInput] = useState("");
  const [model, setModel] = useState(models[0].value);
  const [webSearch, setWebSearch] = useState(false);
  const [videoMode, setVideoMode] = useState(false);
  const [imageMode, setImageMode] = useState(false);
  const [reasoningEffort, setReasoningEffort] = useState<ReasoningEffort>("high");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createChatMutation = trpc.chat.createChat.useMutation();

  const handleSubmit = async (
    message: ComposerMessage,
    options: {
      model: string;
      webSearch: boolean;
      videoMode: boolean;
      imageMode: boolean;
      reasoningEffort: ReasoningEffort;
    },
  ) => {
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
        webSearch: options.webSearch,
        model: options.model,
        videoMode: options.videoMode,
        imageMode: options.imageMode,
        reasoningEffort: options.reasoningEffort,
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

  const handleSuggestionClick = (prompt: string) => {
    setInput(prompt);
  };

  const suggestions = [
    {
      icon: PenLine,
      title: t("Creative Writing"),
      prompt: t("Write a short story about a robot learning to paint"),
    },
    {
      icon: Code,
      title: t("Code Help"),
      prompt: t("Explain how async/await works in JavaScript"),
    },
    {
      icon: FileText,
      title: t("Summarize"),
      prompt: t("Summarize the key benefits of renewable energy"),
    },
    {
      icon: Image,
      title: t("Analyze"),
      prompt: t("What makes a good user interface design?"),
    },
  ];

  return (
    <section
      aria-labelledby="chat-home-title"
      className="relative flex min-h-screen flex-col items-center justify-center p-4"
    >
      <div className="w-full max-w-2xl space-y-6">
        {/* Greeting */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-secondary mb-2">
            <MessageSquare className="w-6 h-6 text-muted-foreground" />
          </div>
          <h1
            className="text-2xl md:text-3xl font-semibold tracking-tight"
            id="chat-home-title"
          >
            {t("How can I help you today?")}
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            {t("Ask me anything. I'm here to assist with your questions, creative projects, and more.")}
          </p>
        </div>

        {/* Suggestions */}
        <div className="grid grid-cols-2 gap-2">
          {suggestions.map((suggestion) => (
            <SuggestionCard
              key={suggestion.title}
              icon={suggestion.icon}
              title={suggestion.title}
              prompt={suggestion.prompt}
              onClick={handleSuggestionClick}
            />
          ))}
        </div>

        {/* Composer */}
        <div>
          <ChatComposer
            value={input}
            onValueChange={setInput}
            onSubmit={handleSubmit}
            placeholder={t("Ask me anything...")}
            isSubmitDisabled={isSubmitting}
            model={model}
            onModelChange={setModel}
            webSearch={webSearch}
            onWebSearchChange={setWebSearch}
            videoMode={videoMode}
            onVideoModeChange={setVideoMode}
            imageMode={imageMode}
            onImageModeChange={setImageMode}
            reasoningEffort={reasoningEffort}
            onReasoningEffortChange={setReasoningEffort}
          />
        </div>
      </div>
    </section>
  );
}

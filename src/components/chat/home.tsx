"use client";

import { MessageSquare, Sparkles, Code, Image, FileText } from "lucide-react";
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
  delay: string;
};

function SuggestionCard({ icon: Icon, title, prompt, onClick, delay }: SuggestionCardProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(prompt)}
      className={`group relative flex flex-col gap-2 p-4 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm text-left transition-all duration-300 hover:border-primary/30 hover:bg-card/80 hover:shadow-md animate-fade-in-up ${delay}`}
    >
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative flex items-center gap-2">
        <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
          <Icon className="w-4 h-4" />
        </div>
        <span className="font-medium text-sm">{title}</span>
      </div>
      <p className="relative text-xs text-muted-foreground line-clamp-2 leading-relaxed">
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
      icon: Sparkles,
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
      {/* Atmospheric background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] animate-pulse-soft" />
        <div className="absolute bottom-1/4 right-1/3 w-[300px] h-[300px] bg-primary/8 rounded-full blur-[80px] animate-pulse-soft delay-300" />
      </div>

      <div className="w-full max-w-2xl space-y-8">
        {/* Greeting */}
        <div className="text-center space-y-3 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-2">
            <MessageSquare className="w-7 h-7 text-primary" />
          </div>
          <h1
            className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-[-0.03em]"
            id="chat-home-title"
          >
            {t("How can I help you today?")}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto">
            {t("Ask me anything. I'm here to assist with your questions, creative projects, and more.")}
          </p>
        </div>

        {/* Suggestions */}
        <div className="grid grid-cols-2 gap-3">
          {suggestions.map((suggestion, index) => (
            <SuggestionCard
              key={suggestion.title}
              icon={suggestion.icon}
              title={suggestion.title}
              prompt={suggestion.prompt}
              onClick={handleSuggestionClick}
              delay={`delay-${(index + 1) * 100}`}
            />
          ))}
        </div>

        {/* Composer */}
        <div className="animate-fade-in-up delay-500">
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

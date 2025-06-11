"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@workspace/ui/lib/utils";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useChatSessions } from "@/hooks/use-chat-sessions";
import { toast } from "sonner";
import { UIMessage } from "ai";
import { createClient } from "@/lib/supabase/client";

export default function ChatHomepage() {
  const t = useTranslations("chatHomepage");
  const { user } = useAuth();
  const router = useRouter();
  const { createSession } = useChatSessions();
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Create Supabase client instance
  const supabase = createClient();

  const promptCards = [
    {
      title: t("promptCards.creative.title"),
      description: t("promptCards.creative.description"),
      icon: "✍️",
      prompt: "Help me write a creative story about...",
    },
    {
      title: t("promptCards.research.title"),
      description: t("promptCards.research.description"),
      icon: "🔍",
      prompt: "Research and summarize information about...",
    },
    {
      title: t("promptCards.coding.title"),
      description: t("promptCards.coding.description"),
      icon: "💻",
      prompt: "Help me debug this code or explain...",
    },
    {
      title: t("promptCards.planning.title"),
      description: t("promptCards.planning.description"),
      icon: "📋",
      prompt: "Help me create a plan for...",
    },
  ];
  const sendMessage = async (messageContent: string) => {
    if (!user) {
      toast.error(t("chatSessions.loginRequired"));
      router.push("/login");
      return;
    }

    if (!messageContent.trim()) {
      toast.error(t("chat.error.messageSendFailed"), {
        description: "Message content is required",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Get auth token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error(t("chatSessions.loginRequired"));
        router.push("/login");
        return;
      }

      // Create new chat session
      const newSession = createSession();

      // Navigate to the chat page with the message
      router.push(
        `/chat/${newSession.id}?message=${encodeURIComponent(messageContent)}`,
      );
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(t("chat.error.messageSendFailed"), {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromptClick = (prompt: string) => {
    sendMessage(prompt);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      sendMessage(inputValue.trim());
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center w-full justify-center px-6 py-8">
      <div className="w-full max-w-4xl mx-auto space-y-8">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {" "}
          <h1 className="text-4xl md:text-6xl font-semibold text-foreground mb-2">
            {t("greeting", {
              name:
                user?.user_metadata?.full_name ||
                user?.email?.split("@")[0] ||
                "User",
            })}
          </h1>
        </motion.div>

        {/* Prompt Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
        >
          {promptCards.map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="cursor-pointer"
              onClick={() => !isLoading && handlePromptClick(card.prompt)}
            >
              <div
                className={cn(
                  "bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 hover:border-border hover:bg-card/70 transition-all duration-300 group",
                  isLoading && "opacity-50 cursor-not-allowed",
                )}
              >
                <div className="flex items-start space-x-4">
                  <div className="text-2xl">{card.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {card.description}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="relative max-w-2xl mx-auto"
        >
          <form onSubmit={handleSubmit}>
            <div className="relative">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={t("placeholder")}
                disabled={isLoading}
                className="w-full h-14 pl-6 pr-14 text-base border-border/50 bg-card/50 backdrop-blur-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 rounded-full"
              />
              <Button
                type="submit"
                size="sm"
                variant="ghost"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full hover:bg-primary/10"
                disabled={!inputValue.trim() || isLoading}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                )}
              </Button>
            </div>
          </form>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center"
        >
          <p className="text-sm text-muted-foreground">{t("footer.privacy")}</p>
        </motion.div>
      </div>
    </div>
  );
}

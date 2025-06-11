"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import { useTranslations } from "next-intl";
import { useIntellipulseSessions } from "@/hooks/use-intellipulse-sessions";
import { Send, Sparkles } from "lucide-react";

export default function IntellipulsePage() {
  const router = useRouter();
  const { createSession: createIntellipulseSession } =
    useIntellipulseSessions();
  const { locale } = useParams() as { locale: string };
  const t = useTranslations();
  const [inputMessage, setInputMessage] = useState("");

  const createSession = () => {
    const session = createIntellipulseSession();
  };

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      // Create a new session with the initial message
      createSession();
      // In the future, this would send the message to the new session
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-none border-b border-border p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold">
            {t("intellipulseHomePage.title")}
          </h1>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="max-w-2xl w-full space-y-6">
          {/* Welcome Message */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              Welcome to Intellipulse
            </h2>
            <p className="text-muted-foreground text-lg">
              Start a conversation to begin your development session. Ask
              questions, get code assistance, or explore ideas.
            </p>
          </div>

          {/* Chat Input Area */}
          <div className="space-y-4">
            <div className="relative">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message to start a new session..."
                className="w-full min-h-[100px] p-4 pr-12 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                rows={3}
              />
              <Button
                size="sm"
                className="absolute bottom-3 right-3"
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {/* Quick Start Button */}
            <div className="text-center">
              <Button
                variant="outline"
                onClick={createSession}
                className="min-w-[200px]"
              >
                {t("intellipulseHomePage.button")}
              </Button>
            </div>
          </div>

          {/* Suggested Prompts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={() =>
                setInputMessage("Help me create a new React component")
              }
              className="p-4 text-left rounded-lg border border-border hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <div className="font-medium">Create React Component</div>
              <div className="text-sm text-muted-foreground">
                Get help building a new React component
              </div>
            </button>

            <button
              onClick={() => setInputMessage("Debug my code issue")}
              className="p-4 text-left rounded-lg border border-border hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <div className="font-medium">Debug Code</div>
              <div className="text-sm text-muted-foreground">
                Find and fix issues in your code
              </div>
            </button>

            <button
              onClick={() => setInputMessage("Explain this code to me")}
              className="p-4 text-left rounded-lg border border-border hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <div className="font-medium">Code Explanation</div>
              <div className="text-sm text-muted-foreground">
                Understand how code works
              </div>
            </button>

            <button
              onClick={() =>
                setInputMessage("Optimize my application performance")
              }
              className="p-4 text-left rounded-lg border border-border hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <div className="font-medium">Performance Tips</div>
              <div className="text-sm text-muted-foreground">
                Improve your app's performance
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

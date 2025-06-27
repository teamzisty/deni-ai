"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Button } from "@workspace/ui/components/button";
import { Mic, MicOff, Volume2, VolumeX, ArrowLeft, Settings } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { VoiceInput } from "@/components/voice/voice-input";
import { generateSpeech, playAudioBlob, playBrowserSpeech } from "@/components/voice/voice-utils";
import { toast } from "sonner";
import { useChat } from "@ai-sdk/react";
import { useSupabase } from "@/context/supabase-context";

export default function VoiceChatPage() {
  const [isListening, setIsListening] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [conversationHistory, setConversationHistory] = useState<Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
  }>>([]);
  
  const { supabase, user, clientAddUses } = useSupabase();
  const router = useRouter();
  const [authToken, setAuthToken] = useState<string>("");

  useEffect(() => {
    const getAuthToken = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setAuthToken(session?.access_token || "");
    };
    getAuthToken();
  }, [supabase]);

  const {
    messages,
    handleSubmit: chatHandleSubmit,
    handleInputChange,
    input,
    status,
  } = useChat({
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    body: {
      model: "gpt-4o",
      voiceMode: true,
    },
    onFinish: async (message) => {
      await clientAddUses("gpt-4o");
      // Auto-play TTS response
      handlePlayResponse(message.content);
    },
  });

  const handleVoiceInput = useCallback((transcript: string) => {
    setCurrentTranscript(transcript);
    
    // Add to conversation history
    const userMessage = {
      role: "user" as const,
      content: transcript,
      timestamp: new Date(),
    };
    setConversationHistory(prev => [...prev, userMessage]);

    // Submit to AI
    handleInputChange({ target: { value: transcript } } as any);
    setTimeout(() => {
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      Object.defineProperty(submitEvent, 'preventDefault', {
        value: () => {},
        writable: false
      });
      chatHandleSubmit(submitEvent as any);
    }, 100);
  }, [handleInputChange, chatHandleSubmit]);

  const handlePlayResponse = useCallback(async (text: string) => {
    if (!text?.trim()) return;
    
    setIsPlaying(true);
    try {
      const audioBlob = await generateSpeech(text);
      await playAudioBlob(audioBlob);
    } catch (error) {
      console.error("TTS error:", error);
      playBrowserSpeech(text);
    } finally {
      setIsPlaying(false);
    }
  }, []);

  const lastAssistantMessage = useMemo(() => {
    const assistantMessages = messages.filter(m => m.role === "assistant");
    return assistantMessages[assistantMessages.length - 1]?.content || "";
  }, [messages]);

  // Auto-update conversation history from chat messages
  useEffect(() => {
    if (messages.length > conversationHistory.length) {
      const newMessages = messages.slice(conversationHistory.length);
      const formattedMessages = newMessages.map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
        timestamp: new Date(),
      }));
      setConversationHistory(prev => [...prev, ...formattedMessages]);
    }
  }, [messages, conversationHistory.length]);

  const handleVoiceError = useCallback((error: string) => {
    toast.error(`Voice recognition error: ${error}`);
    setIsListening(false);
  }, []);

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Authentication Required</h2>
          <p className="text-muted-foreground mb-4">Please log in to use Voice Chat</p>
          <Link href="/auth/login">
            <Button>Log In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/30">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/chat">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-semibold">Voice Chat</h1>
              <p className="text-sm text-muted-foreground">
                {status === "streaming" ? "AI is responding..." : "Speak naturally with AI"}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col h-[calc(100vh-80px)]">
        {/* Conversation History */}
        <div className="flex-1 overflow-y-auto mb-8 space-y-4">
          {conversationHistory.length === 0 && (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center">
                <Mic className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Start Your Voice Chat</h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-4">
                Hold the microphone button and speak. AI will respond with voice automatically.
              </p>
              <div className="text-sm text-muted-foreground max-w-lg mx-auto space-y-1">
                <p>💡 <strong>How to use:</strong></p>
                <p>1. Hold the microphone button and speak</p>
                <p>2. Release the button when finished speaking</p>
                <p>3. AI will respond with voice automatically</p>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                  ⚠️ Microphone access permission required on first use
                </p>
              </div>
            </div>
          )}
          
          {conversationHistory.map((message, index) => (
            <div
              key={index}
              className={cn(
                "flex gap-4 max-w-3xl",
                message.role === "user" ? "ml-auto flex-row-reverse" : ""
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                message.role === "user" 
                  ? "bg-blue-500 text-white" 
                  : "bg-purple-500 text-white"
              )}>
                {message.role === "user" ? "👤" : "🤖"}
              </div>
              <div className={cn(
                "rounded-2xl px-4 py-3 max-w-xs md:max-w-md lg:max-w-lg",
                message.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-white dark:bg-gray-800 border"
              )}>
                <p className="text-sm md:text-base">{message.content}</p>
                {message.role === "assistant" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-6 px-2 text-xs"
                    onClick={() => handlePlayResponse(message.content)}
                    disabled={isPlaying}
                  >
                    {isPlaying ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                    <span className="ml-1">Play</span>
                  </Button>
                )}
              </div>
            </div>
          ))}
          
          {status === "streaming" && (
            <div className="flex gap-4 max-w-3xl">
              <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center flex-shrink-0">
                🤖
              </div>
              <div className="bg-white dark:bg-gray-800 border rounded-2xl px-4 py-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Voice Input Controls */}
        <div className="text-center">
          {currentTranscript && (
            <div className="mb-4 p-4 bg-white/80 dark:bg-gray-800/80 rounded-2xl border">
              <p className="text-sm text-muted-foreground mb-1">Current transcript:</p>
              <p className="text-lg">{currentTranscript}</p>
            </div>
          )}
          
          <div className="flex items-center justify-center gap-4">
            <VoiceInput
              onTranscript={handleVoiceInput}
              onStart={() => {
                setIsListening(true);
                setCurrentTranscript("");
              }}
              onStop={() => setIsListening(false)}
              onError={handleVoiceError}
              className={cn(
                "w-20 h-20 rounded-full transition-all duration-200",
                isListening 
                  ? "bg-red-500 hover:bg-red-600 scale-110 shadow-lg shadow-red-500/25" 
                  : "bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/25"
              )}
            />
          </div>
          
          <p className="mt-4 text-sm text-muted-foreground">
            {isListening 
              ? "🎤 Listening... Speak now (release button to stop)" 
              : "Hold microphone button to speak"
            }
          </p>
          
          {/* Debug info - remove in production */}
          <div className="mt-2 text-xs text-gray-500 space-y-1">
            <p>Debug: isListening = {isListening.toString()}</p>
            <p>Current transcript: "{currentTranscript}"</p>
          </div>
        </div>
      </div>
    </div>
  );
}
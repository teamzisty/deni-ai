"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Button } from "@workspace/ui/components/button";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ArrowLeft,
  Settings,
} from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GeminiVoiceInput } from "@/components/voice/gemini-voice-input";
import {
  generateSpeech,
  playAudioBlob,
  playBrowserSpeech,
} from "@/components/voice/voice-utils";
import { toast } from "sonner";
import { useChat } from "@ai-sdk/react";
import { useSupabase } from "@/context/supabase-context";

export default function VoiceChatPage() {
  const [isListening, setIsListening] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [conversationHistory, setConversationHistory] = useState<
    Array<{
      role: "user" | "assistant";
      content: string;
      timestamp: Date;
    }>
  >([]);

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
    api: "/api/audio/chat",
    onFinish: async (message) => {
      await clientAddUses("gpt-4o");
      // Auto-play TTS response
      handlePlayResponse(message.content);
    },
  });

  const handleVoiceInput = useCallback(
    (transcript: string) => {
      setCurrentTranscript(transcript);

      handleInputChange({ target: { value: transcript } } as any);
      setTimeout(() => {
        const submitEvent = new Event("submit", {
          bubbles: true,
          cancelable: true,
        });
        Object.defineProperty(submitEvent, "preventDefault", {
          value: () => {},
          writable: false,
        });
        chatHandleSubmit(submitEvent as any);
      }, 100);
    },
    [handleInputChange, chatHandleSubmit],
  );

  const handlePlayResponse = useCallback(async (text: string) => {
    if (!text?.trim()) return;

    setIsPlaying(true);
    try {
      const audioBlob = await generateSpeech(text);
      await playAudioBlob(audioBlob);
    } catch (error) {
      console.error("TTS error:", error);
      // Fallback to browser speech synthesis
      try {
        playBrowserSpeech(text);
      } catch (fallbackError) {
        console.error("Browser TTS also failed:", fallbackError);
        toast.error("Audio playback failed");
      }
    } finally {
      setIsPlaying(false);
    }
  }, []);

  const handleVoiceError = useCallback((error: string) => {
    toast.error(`Voice recognition error: ${error}`);
    setIsListening(false);
  }, []);

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">
            Authentication Required
          </h2>
          <p className="text-muted-foreground mb-4">
            Please log in to use Voice Chat
          </p>
          <Link href="/auth/login">
            <Button>Log In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 min-h-screen w-full">
      {/* Voice Input Controls */}
      <GeminiVoiceInput
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
            : "bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/25",
        )}
      />
    </div>
  );
}

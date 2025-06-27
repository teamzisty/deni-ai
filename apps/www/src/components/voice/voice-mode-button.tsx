"use client";

import { useState, useCallback } from "react";
import { Button } from "@workspace/ui/components/button";
import { Headphones } from "lucide-react";
import { VoiceInput } from "./voice-input";
import { generateSpeech, playAudioBlob, playBrowserSpeech } from "./voice-utils";
import { toast } from "sonner";

interface VoiceModeButtonProps {
  voiceMode: boolean;
  setVoiceMode: (enabled: boolean) => void;
  onVoiceInput?: (transcript: string) => void;
  lastMessage?: string;
  disabled?: boolean;
}

export const VoiceModeButton: React.FC<VoiceModeButtonProps> = ({
  voiceMode,
  setVoiceMode,
  onVoiceInput,
  lastMessage,
  disabled = false,
}) => {
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);

  const handleVoiceTranscript = useCallback((transcript: string) => {
    if (transcript.trim()) {
      onVoiceInput?.(transcript);
    }
  }, [onVoiceInput]);

  const handlePlayLastMessage = useCallback(async () => {
    if (!lastMessage?.trim()) {
      toast.error("No message to play");
      return;
    }

    setIsPlayingTTS(true);
    try {
      // Try Gemini TTS first, fallback to browser TTS if it fails
      const audioBlob = await generateSpeech(lastMessage);
      await playAudioBlob(audioBlob);
    } catch (error) {
      console.error("TTS error:", error);
      toast.error("Using browser TTS fallback");
      // Direct browser TTS fallback
      playBrowserSpeech(lastMessage);
    } finally {
      setIsPlayingTTS(false);
    }
  }, [lastMessage]);

  // Test browser TTS function for debugging
  const handleTestBrowserTTS = useCallback(() => {
    if (!lastMessage?.trim()) {
      toast.error("No message to test");
      return;
    }
    playBrowserSpeech(lastMessage);
    toast.success("Playing with browser TTS");
  }, [lastMessage]);

  const handleVoiceError = useCallback((error: string) => {
    toast.error(`Voice recognition error: ${error}`);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant={voiceMode ? "secondary" : "ghost"}
        onClick={() => setVoiceMode(!voiceMode)}
        className="rounded-full"
        disabled={disabled}
      >
        <Headphones className="h-5 w-5" />
        <div className="hidden md:inline">Voice</div>
      </Button>
      
      {voiceMode && (
        <>
          <VoiceInput
            onTranscript={handleVoiceTranscript}
            onError={handleVoiceError}
            disabled={disabled}
          />
          {lastMessage && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={handlePlayLastMessage}
                disabled={disabled || isPlayingTTS}
                title="Play with Gemini TTS (fallback to browser)"
              >
                🔊
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-full text-xs"
                onClick={handleTestBrowserTTS}
                disabled={disabled}
                title="Test browser TTS directly"
              >
                🗣️
              </Button>
            </>
          )}
        </>
      )}
    </div>
  );
};
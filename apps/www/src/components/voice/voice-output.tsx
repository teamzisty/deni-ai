"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@workspace/ui/components/button";
import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

interface VoiceOutputProps {
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

export const VoiceOutput: React.FC<VoiceOutputProps> = ({
  onError,
  disabled = false,
  className,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const generateSpeech = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      setIsLoading(true);

      try {
        const response = await fetch("/api/audio/tts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = audioUrl;

          audioRef.current.onloadstart = () => setIsLoading(false);
          audioRef.current.onplay = () => setIsPlaying(true);
          audioRef.current.onended = () => {
            setIsPlaying(false);
            URL.revokeObjectURL(audioUrl);
          };
          audioRef.current.onerror = (e) => {
            setIsPlaying(false);
            setIsLoading(false);
            onError?.("Failed to play audio");
            URL.revokeObjectURL(audioUrl);
          };

          await audioRef.current.play();
        }
      } catch (error) {
        console.error("TTS error:", error);
        onError?.(error instanceof Error ? error.message : "TTS failed");
        setIsLoading(false);
      }
    },
    [onError],
  );

  const stopSpeech = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, []);

  return (
    <div className={cn("flex items-center", className)}>
      <audio ref={audioRef} style={{ display: "none" }} />
      <Button
        type="button"
        variant={isPlaying ? "destructive" : "ghost"}
        size="icon"
        className="rounded-full"
        onClick={stopSpeech}
        disabled={disabled || (!isPlaying && !isLoading)}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : isPlaying ? (
          <VolumeX className="h-5 w-5" />
        ) : (
          <Volume2 className="h-5 w-5" />
        )}
      </Button>
    </div>
  );
};

export type { VoiceOutputProps };

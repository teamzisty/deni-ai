"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@workspace/ui/components/button";
import { Mic, MicOff } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import { toast } from "sonner";

interface GeminiVoiceInputProps {
  onTranscript?: (transcript: string) => void;
  onStart?: () => void;
  onStop?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

export const GeminiVoiceInput: React.FC<GeminiVoiceInputProps> = ({
  onTranscript,
  onStart,
  onStop,
  onError,
  disabled = false,
  className,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const requestMicrophonePermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      return stream;
    } catch (error) {
      console.error("Microphone permission denied:", error);
      onError?.("Microphone permission required. Please allow microphone access in your browser.");
      return null;
    }
  }, [onError]);

  const transcribeAudio = useCallback(async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.wav");

      const response = await fetch("/api/audio/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      const transcript = result.transcript?.trim();
      if (transcript) {
        onTranscript?.(transcript);
      } else {
        toast.warning("No speech detected. Please try again.");
      }
    } catch (error) {
      console.error("Transcription error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to transcribe audio";
      onError?.(errorMessage);
      toast.error("Transcription failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [onTranscript, onError]);

  const startRecording = useCallback(async () => {
    const stream = await requestMicrophonePermission();
    if (!stream) return;

    try {
      streamRef.current = stream;
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") 
          ? "audio/webm" 
          : "audio/mp4"
      });
      
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: audioChunksRef.current[0]?.type || "audio/wav" 
        });
        
        if (audioBlob.size > 0) {
          transcribeAudio(audioBlob);
        }
        
        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      onStart?.();
    } catch (error) {
      console.error("Failed to start recording:", error);
      onError?.("Failed to start recording.");
      
      // Clean up on error
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  }, [requestMicrophonePermission, transcribeAudio, onStart, onError]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      onStop?.();
    }
  }, [isRecording, onStop]);

  const handleMouseDown = useCallback(() => {
    if (disabled || isProcessing) return;
    
    setIsHolding(true);
    startRecording();
  }, [disabled, isProcessing, startRecording]);

  const handleMouseUp = useCallback(() => {
    setIsHolding(false);
    stopRecording();
  }, [stopRecording]);

  const handleMouseLeave = useCallback(() => {
    setIsHolding(false);
    stopRecording();
  }, [stopRecording]);

  // Handle touch events for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    handleMouseDown();
  }, [handleMouseDown]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    handleMouseUp();
  }, [handleMouseUp]);

  const isActive = isRecording || isProcessing;

  return (
    <Button
      type="button"
      variant={isActive ? "destructive" : "default"}
      size="icon"
      className={cn(
        "rounded-full select-none transition-all duration-200",
        isHolding && "scale-110 shadow-lg ring-2 ring-blue-400",
        isActive && "animate-pulse",
        isProcessing && "opacity-75",
        className
      )}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      disabled={disabled || isProcessing}
      title={
        isProcessing 
          ? "Processing audio..." 
          : isRecording 
            ? "Recording... Release to transcribe" 
            : "Hold to record and transcribe with Gemini"
      }
    >
      {isActive ? (
        <div className="relative">
          <MicOff className="h-5 w-5" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        </div>
      ) : (
        <Mic className="h-5 w-5" />
      )}
    </Button>
  );
};
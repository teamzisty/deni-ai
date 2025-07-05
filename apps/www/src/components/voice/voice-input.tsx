"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@workspace/ui/components/button";
import { Mic, MicOff } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import { useTranslations } from "@/hooks/use-translations";

interface VoiceInputProps {
  onTranscript?: (transcript: string) => void;
  onStart?: () => void;
  onStop?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({
  onTranscript,
  onStart,
  onStop,
  onError,
  disabled = false,
  className,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isHoldingRef = useRef(false);
  const t = useTranslations();

  useEffect(() => {
    const SpeechRecognition = 
      window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      recognition.continuous = true; // Keep listening while holding
      recognition.interimResults = true;
      recognition.lang = "en-US"; // English
      recognition.maxAlternatives = 1;
      
      // More aggressive settings for better detection
      if ('webkitSpeechRecognition' in window) {
        // @ts-ignore - Chrome specific settings
        recognition.serviceURI = '';
      }
      
      recognition.onstart = () => {
        console.log(t("voice.recognitionStarted"));
        setIsListening(true);
        onStart?.();
      };
      
      recognition.onresult = (event) => {
        let finalTranscript = "";
        let interimTranscript = "";
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result && result[0]) {
            const transcript = result[0].transcript;
            if (result.isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }
        }
        
        console.log("Speech result:", { finalTranscript, interimTranscript });
        
        // Send both final and interim results for better user experience
        const transcript = finalTranscript || interimTranscript;
        if (transcript.trim()) {
          onTranscript?.(transcript);
        }
      };
      
      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        
        // Handle different types of errors
        switch (event.error) {
          case "not-allowed":
            onError?.(t("voice.errors.microphoneAccessDenied"));
            setIsListening(false);
            setIsHolding(false);
            isHoldingRef.current = false;
            break;
          case "no-speech":
            // Don't treat no-speech as a fatal error, just continue if still holding
            console.log("No speech detected, but continuing to listen...");
            if (!isHoldingRef.current) {
              setIsListening(false);
            }
            break;
          case "network":
            onError?.(t("voice.errors.networkError"));
            setIsListening(false);
            setIsHolding(false);
            isHoldingRef.current = false;
            break;
          case "audio-capture":
            onError?.(t("voice.errors.microphoneProblem"));
            setIsListening(false);
            setIsHolding(false);
            isHoldingRef.current = false;
            break;
          default:
            // For other errors, try to continue if user is still holding
            console.error("Other speech recognition error:", event.error);
            if (!isHoldingRef.current) {
              setIsListening(false);
            }
            break;
        }
      };
      
      recognition.onend = () => {
        console.log(t("voice.recognitionEnded"));
        setIsListening(false);
        onStop?.();
        
        // Restart recognition if user is still holding the button
        if (isHoldingRef.current) {
          console.log("User still holding, restarting recognition...");
          setTimeout(() => {
            if (isHoldingRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (error) {
                console.error("Failed to restart recognition:", error);
              }
            }
          }, 100);
        }
      };
    } else {
      onError?.(t("voice.errors.browserNotSupported"));
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (holdTimeoutRef.current) {
        clearTimeout(holdTimeoutRef.current);
      }
    };
  }, [onTranscript, onStart, onStop, onError]);

  const requestMicrophonePermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Stop the stream immediately
      return true;
    } catch (error) {
      console.error("Microphone permission denied:", error);
      onError?.(t("voice.errors.microphonePermissionRequired"));
      return false;
    }
  }, [onError]);

  const startListening = useCallback(async () => {
    if (!recognitionRef.current) return;
    
    // Request microphone permission first
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) return;
    
    try {
      // Only start if not already listening
      if (!isListening) {
        console.log("Starting speech recognition...");
        recognitionRef.current.start();
      }
    } catch (error) {
      console.error("Failed to start recognition:", error);
      if (error instanceof Error && error.message.includes("already started")) {
        // Recognition is already running, just continue
        console.log("Recognition already started, continuing...");
        return;
      }
      onError?.(t("voice.errors.failedToStart"));
    }
  }, [isListening, onError, requestMicrophonePermission]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      console.log("Stopping speech recognition...");
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const handleMouseDown = useCallback(() => {
    if (disabled) return;
    
    console.log("Mouse down - starting to hold");
    setIsHolding(true);
    isHoldingRef.current = true;
    startListening();
  }, [disabled, startListening]);

  const handleMouseUp = useCallback(() => {
    console.log("Mouse up - releasing hold");
    setIsHolding(false);
    isHoldingRef.current = false;
    stopListening();
  }, [stopListening]);

  const handleMouseLeave = useCallback(() => {
    console.log("Mouse leave - releasing hold");
    setIsHolding(false);
    isHoldingRef.current = false;
    stopListening();
  }, [stopListening]);

  // Handle touch events for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    handleMouseDown();
  }, [handleMouseDown]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    handleMouseUp();
  }, [handleMouseUp]);

  if (!isSupported) {
    return (
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={cn("rounded-full opacity-50", className)}
        disabled
        title={t("voice.errors.browserNotSupported")}
      >
        <Mic className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={isListening ? "destructive" : "default"}
      size="icon"
      className={cn(
        "rounded-full select-none transition-all duration-200",
        isHolding && "scale-110 shadow-lg ring-2 ring-blue-400",
        isListening && "animate-pulse",
        className
      )}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      disabled={disabled}
      title={isListening ? t("voice.speakingReleaseToStop") : t("voice.holdToSpeak")}
    >
      {isListening ? (
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
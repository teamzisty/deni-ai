import type { useChat } from "@ai-sdk/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { isReasoningEffort, type ReasoningEffort } from "@/components/chat/chat-composer";

const INITIAL_MESSAGE_STORAGE_KEY = "deni_initial_message";

type SendMessage = ReturnType<typeof useChat>["sendMessage"];

export function useInitialMessage(params: {
  id: string;
  initialMessagesLength: number;
  model: string;
  sendMessage: SendMessage;
  setModel: (model: string) => void;
  setWebSearch: (webSearch: boolean) => void;
  setVideoMode: (videoMode: boolean) => void;
  setImageMode: (imageMode: boolean) => void;
  setReasoningEffort: (effort: ReasoningEffort) => void;
  onMessageSent: () => void;
}) {
  const {
    id,
    initialMessagesLength,
    model,
    sendMessage,
    setModel,
    setWebSearch,
    setVideoMode,
    setImageMode,
    setReasoningEffort,
    onMessageSent,
  } = params;

  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMessageSentRef = useRef(false);

  useEffect(() => {
    if (initialMessageSentRef.current || initialMessagesLength > 0) {
      return;
    }

    // Try to get initial message from sessionStorage first (new method with file support)
    const storedData = sessionStorage.getItem(INITIAL_MESSAGE_STORAGE_KEY);
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData) as {
          text: string;
          files: Array<{
            type: "file";
            filename?: string;
            mediaType: string;
            url: string;
          }>;
          webSearch: boolean;
          model?: string;
          videoMode?: boolean;
          imageMode?: boolean;
          reasoningEffort?: string;
        };

        initialMessageSentRef.current = true;

        // Clear the stored data to prevent re-sending on refresh
        sessionStorage.removeItem(INITIAL_MESSAGE_STORAGE_KEY);

        // Set state from stored data
        if (parsed.webSearch) {
          setWebSearch(true);
        }
        if (parsed.model) {
          setModel(parsed.model);
        }
        if (parsed.videoMode) {
          setVideoMode(true);
        }
        if (parsed.imageMode) {
          setImageMode(true);
        }
        const parsedReasoningEffort =
          parsed.reasoningEffort && isReasoningEffort(parsed.reasoningEffort)
            ? parsed.reasoningEffort
            : "high";
        setReasoningEffort(parsedReasoningEffort);

        // Send the message with files
        Promise.resolve(
          sendMessage(
            {
              text: parsed.text,
              files: parsed.files.length > 0 ? parsed.files : undefined,
            },
            {
              body: {
                model: parsed.model ?? model,
                webSearch: parsed.webSearch,
                reasoningEffort: parsedReasoningEffort,
                video: parsed.videoMode ?? false,
                image: parsed.imageMode ?? false,
                id,
              },
            },
          ),
        ).finally(() => {
          onMessageSent();
        });

        return;
      } catch (e) {
        console.error("Failed to parse initial message from sessionStorage:", e);
        sessionStorage.removeItem(INITIAL_MESSAGE_STORAGE_KEY);
      }
    }

    // Fallback: check query parameters (legacy method, no file support)
    const initialMessage = searchParams.get("message");
    const initialWebSearch = searchParams.get("webSearch") === "true";

    if (initialMessage) {
      initialMessageSentRef.current = true;
      const decodedMessage = decodeURIComponent(initialMessage);

      // Set webSearch state if it was passed from home
      if (initialWebSearch) {
        setWebSearch(true);
      }

      // Remove the query params from URL to prevent re-sending on refresh
      router.replace(`/chat/${id}`, { scroll: false });

      // Send the message with the webSearch setting from query params
      Promise.resolve(
        sendMessage(
          { text: decodedMessage },
          {
            body: {
              model,
              webSearch: initialWebSearch,
              reasoningEffort: "high",
              video: false,
              id,
            },
          },
        ),
      ).finally(() => {
        onMessageSent();
      });
    }
  }, [searchParams, initialMessagesLength, sendMessage, router, id, model, onMessageSent]);
}

"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  memo,
  Suspense,
} from "react";
import { useChat } from "@ai-sdk/react";
import { useUploadThing, uploadResponse } from "@/utils/uploadthing";
import { ChatSession } from "@/hooks/use-chat-sessions"; // Assuming needed, adjust later
import { modelDescriptions, reasoningEffortType } from "@/lib/modelDescriptions";
import { cn } from "@workspace/ui/lib/utils";
import { AlertCircleIcon } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { UIMessage, ChatRequestOptions } from "ai";
import { User } from "firebase/auth"; // Import User type

import logger from "@/utils/logger";
import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
import { Loading } from "@/components/loading";
import HeaderArea from "@/components/HeaderArea";
import { MessageLog } from "@/components/MessageLog";
import ChatInput from "@/components/ChatInput";
import { Footer } from "@/components/footer";
import { useDebouncedCallback } from 'use-debounce'; // Import useDebouncedCallback

interface MessageListProps {
  messages: UIMessage[];
  sessionId: string;
  error?: Error;
  onRegenerate?: () => void;
}

// Keep MemoizedMessageList definition here or move to its own file later
const MemoizedMessageList = memo(
  ({ messages, sessionId, error, onRegenerate }: MessageListProps) => {
    const t = useTranslations();
    return (
      <>
        {messages.map((message, index) => (
          <MessageLog
            sessionId={sessionId}
            key={index}
            message={message}
            onRegenerate={onRegenerate}
          />
        ))}
        {error && (
          <div className="p-2 my-2 flex gap-2 items-center rounded-lg border border-red-400 text-white w-full md:w-[70%] lg:w-[65%]">
            <AlertCircleIcon size={64} className="text-red-400" />
            <h3 className="font-bold">{t("chat.error.occurred")}</h3>
          </div>
        )}
      </>
    );
  },
  (prevProps, nextProps) => {
    if (
      prevProps.sessionId !== nextProps.sessionId ||
      prevProps.error !== nextProps.error
    ) {
      return false;
    }
    if (prevProps.messages.length !== nextProps.messages.length) {
      return false;
    }
    const prevLastMsg = prevProps.messages[prevProps.messages.length - 1];
    const nextLastMsg = nextProps.messages[nextProps.messages.length - 1];
    if (!prevLastMsg || !nextLastMsg) {
      return prevProps.messages.length === nextProps.messages.length;
    }
    return (
      prevLastMsg.id === nextLastMsg.id &&
      prevLastMsg.content === nextLastMsg.content
    );
  }
);
MemoizedMessageList.displayName = "MemoizedMessageList";

interface ChatProps {
  sessionId: string;
  initialSessionData: ChatSession;
  user: User | null;
  authToken: string | null;
  initialModel?: string;
  initialImage?: string;
  initialMessage?: string;
  updateSession: (id: string, updatedSession: ChatSession) => void;
  auth: any; // Pass auth object if needed by useUploadThing headers
}

const Chat: React.FC<ChatProps> = ({
  sessionId,
  initialSessionData,
  user,
  authToken,
  initialModel,
  initialImage,
  initialMessage,
  updateSession,
  auth,
}) => {
  const t = useTranslations();
  const isMobile = useIsMobile();

  // --- State Variables ---
  const [currentSession, setCurrentSession] = useState<ChatSession>(initialSessionData);
  const [image, setImage] = useState<string | null>(initialImage || null);
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [advancedSearch, setAdvancedSearch] = useState(() => {
      if (typeof window !== 'undefined') {
          return window.localStorage.getItem("advancedSearch") === "true";
      }
      return false;
  });
  const [deepResearch, setDeepResearch] = useState(false);
  const [visionRequired, setVisionRequired] = useState(!!initialImage);
  const [availableTools, setAvailableTools] = useState<string[]>([]);
  const [model, setModel] = useState(initialModel || "openai/gpt-4.1-mini-2025-04-14");
  const [reasoningEffort, setReasoningEffort] = useState<reasoningEffortType>("medium");
  const [canvasEnabled, setCanvasEnabled] = useState(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const MAX_RETRIES = 3;

  // --- Refs ---
  const chatLogRef = useRef<HTMLDivElement>(null);
  const sendButtonRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);


  // --- Hooks ---
   const {
    messages,
    input,
    setInput,
    status,
    setMessages,
    reload,
    stop,
    error,
    handleSubmit,
  } = useChat({
    initialMessages: initialSessionData.messages, // Initialize messages
    id: sessionId, // Set chat id to sync with session
    onError: (error) => {
      toast.error(String(error));
    },
    body: {
      toolList: availableTools,
      model,
      reasoningEffort,
    },
  });

  // Ref for tracking previous status (for saving logic)
  // const prevStatusRef = useRef(status); // No longer needed for saving logic

  const { isUploading, startUpload } = useUploadThing("imageUploader", {
    headers: {
      // Use authToken prop
      Authorization: auth && authToken ? authToken : "",
    },
    onClientUploadComplete: (res) => {
      setImage(res[0]?.ufsUrl || null);
    },
    onUploadError: (error: Error) => {
      toast.error(t("chat.error.imageUpload"), {
        description: t("chat.error.errorOccurred", { message: error.message }),
      });
    },
  });


  // --- useEffect Hooks ---

  // Update previous status ref
  // useEffect(() => {
  //   prevStatusRef.current = status;
  // }); // No longer needed for saving logic

  // Handle initial message prop
   useEffect(() => {
     if (initialMessage && messages.length <= initialSessionData.messages.length) {
        // Check if messages haven't increased beyond initial ones
        setInput(initialMessage);
        // Use a flag or check message content to avoid re-sending on remounts?
        // For now, use a simple approach. Might need refinement.
         setTimeout(() => {
           sendButtonRef.current?.click();
           logger.info("Chat Component", "Sending initial message from prop");
         }, 100); // Small delay
     }
   }, [initialMessage, setInput, messages.length, initialSessionData.messages.length]);


  // Scroll chat log
  useEffect(() => {
    if (
      (status === "streaming" || status === "submitted") &&
      chatLogRef.current
    ) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [messages, status]);

  // Debounced function to save session data
  const debouncedUpdateSession = useDebouncedCallback((updatedMessages: UIMessage[]) => {
    if (!currentSession) return;
    const updatedSessionData = {
      ...currentSession,
      messages: updatedMessages, // Save the complete message list
    };
    // Check if local state needs update (optional, useChat should be source of truth)
    // setCurrentSession(updatedSessionData);
    updateSession(sessionId, updatedSessionData);
    console.log("Chat Component: Session updated via debounced call.");
  }, 1000); // Debounce time in milliseconds (e.g., 1000ms = 1 second)

  // Save session whenever messages change (debounced)
  useEffect(() => {
    // Don't save if messages are empty or haven't changed from initial load (optional optimization)
    if (messages.length === 0) return;
    // Avoid saving during initial load if initialMessages is exactly the same
    if (messages === initialSessionData.messages) return;

    debouncedUpdateSession(messages);

    // Cleanup function to cancel debounced call if component unmounts or messages change again quickly
    return () => {
      debouncedUpdateSession.cancel();
    };
  }, [messages, debouncedUpdateSession, initialSessionData.messages]); // Depend on messages array

  // Detect vision requirement based on messages
  useEffect(() => {
    if (
      !visionRequired &&
      messages.some(
        (message) => message.role === "user" && message.experimental_attachments
      )
    ) {
      setVisionRequired(true);
    }
  }, [messages, visionRequired]);

  // Initial model/image sync (if props change, though likely won't)
   useEffect(() => {
     if (initialModel && model !== initialModel) {
       setModel(initialModel);
     }
     if (initialImage && image !== initialImage) {
       setImage(initialImage);
       setVisionRequired(true);
     }
     // This effect should ideally run only once based on initial props.
     // Adding dependencies might cause loops if parent re-renders often.
   }, [initialModel, initialImage]); // Removed model, image deps


  // --- Handler Functions ---

  const canvasToggle = () => {
    setCanvasEnabled((prev) => !prev);
  };

  const handleModelChange = useCallback(
    (newModel: string) => {
      if (!modelDescriptions[newModel]?.vision && image) {
        logger.warn("handleModelChange", "Model doesn't support vision, removing image.");
        setImage(null);
      }
      if (modelDescriptions[newModel]?.toolDisabled) {
         setAvailableTools([]);
      } else {
        // Reset tools based on new model if needed, currently clears if disabled
        setAvailableTools([]); // Example reset, adjust if needed
      }
      logger.info("handleModelChange", "Model changed to " + newModel);
      setModel(newModel);
    },
    [image] // Dependency on image state
  );

  const searchToggle = () => {
    setSearchEnabled((prev) => !prev);
    // Update local storage? Maybe keep that in page.tsx?
  };

   const advancedSearchToggle = () => { // Added for completeness
     setAdvancedSearch((prev) => {
       const newValue = !prev;
       window.localStorage.setItem("advancedSearch", String(newValue));
       return newValue;
     });
   };

  const deepResearchToggle = () => {
    if (!deepResearch) {
      toast.info(t("chat.deepResearch.info"), {
        description: t("chat.deepResearch.description"),
      });
    }
    setDeepResearch((prev) => !prev);
  };

  const baseSendMessage = async (
    event:
      | React.MouseEvent<HTMLButtonElement>
      | React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    // Use component state/props
    if (!currentSession || !input) return;
    if (status === "streaming" || status === "submitted") return;

    const newAvailableTools = [];
    if (searchEnabled) newAvailableTools.push("search");
    if (advancedSearch) newAvailableTools.push("advancedSearch");
    if (deepResearch) newAvailableTools.push("deepResearch");
    if (canvasEnabled) newAvailableTools.push("canvas");
    setAvailableTools(newAvailableTools);

    try {
      const submitOptions: ChatRequestOptions = {
        experimental_attachments: image
          ? [{ url: image, contentType: "image/png" }] // Assume png for now
          : undefined,
      };

      if (auth && authToken) {
          submitOptions.headers = { Authorization: authToken };
      } else if (auth && !authToken && user) {
          // Fallback: try to get token if prop is missing but user exists
          const idToken = await user.getIdToken();
          if (idToken) submitOptions.headers = { Authorization: idToken };
          else throw new Error(t("chat.error.idTokenFailed"));
      } else if (auth) {
           throw new Error(t("chat.error.idTokenFailed"));
      }


      logger.info("Send message", `Sending message: "${input.substring(0, 30)}..."`);
      if (image) logger.info("Send message", "Sending with image attachment");

      handleSubmit(event, submitOptions);
      setImage(null); // Clear image after sending
      setRetryCount(0); // Reset retry count
    } catch (error) {
      toast.error(t("chat.error.messageSendFailed"), {
        description: error instanceof Error ? error.message : t("common.error.unknown"),
      });
    }
  };

  const authReload = async (options?: { regenerateWithModel?: string }) => {
    const submitOptions: ChatRequestOptions = {
      experimental_attachments: image
        ? [{ url: image, contentType: "image/png" }]
        : undefined,
    };
     if (options?.regenerateWithModel) {
        // If regenerating with a specific model, update the model state first
         setModel(options.regenerateWithModel);
         // We might need to update the body of the useChat hook call as well.
         // The `reload` function might not pick up the model change immediately.
         // This might require a more complex setup or using a different approach.
         // For now, just set the model state.
         console.warn("Regenerating with a specific model might not update API call body immediately.");
     }

    if (auth && authToken) {
      submitOptions.headers = { Authorization: authToken };
    } else if (auth && !authToken && user) {
       const idToken = await user.getIdToken();
       if (idToken) submitOptions.headers = { Authorization: idToken };
       else throw new Error(t("chat.error.idTokenFailed"));
    } else if (auth) {
        throw new Error(t("chat.error.idTokenFailed"));
    }

    try {
      reload(submitOptions);
    } catch (error) {
       toast.error(t("chat.error.regenerateFailed"), { // Added specific error message
         description: error instanceof Error ? error.message : t("common.error.unknown"),
       });
    }
  };

  // handleRegenerate needs to be called by MessageLog, let's define it here
  const handleRegenerate = useCallback((modelOverride?: string) => {
     authReload({ regenerateWithModel: modelOverride });
  }, [authReload]); // authReload depends on other states/props

  const handleRetry = async () => {
    if (retryCount >= MAX_RETRIES) {
      toast.error(t("chat.error.maxRetriesReached"));
      return;
    }
    setRetryCount((prev) => prev + 1);
    authReload(); // Use the common reload logic
  };

  const handleSendMessage = async (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    baseSendMessage(event);
  };

  const handleSendMessageKey = async (
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      baseSendMessage(event);
    }
  };

  const uploadImage = useCallback((file?: File): Promise<uploadResponse> => {
      return new Promise((resolve) => {
          if (!file) {
              resolve({ status: "error", error: { message: t("common.error.fileNotSelected"), code: "file_not_selected" } });
              return;
          }
          if (!auth && authToken) { // Need auth token for upload
              resolve({ status: "error", error: { message: t("chat.error.authRequiredUpload"), code: "auth_required" } }); // Add translation
              return;
          }

          // No need for async function wrapper here
          startUpload([new File([file], `${crypto.randomUUID()}.png`, { type: file.type })])
              .then(data => {
                  if (data && data[0]?.ufsUrl) {
                      resolve({ status: "success", data: { url: data[0].ufsUrl } });
                  } else {
                      resolve({ status: "error", error: { message: t("common.error.unknown"), code: "upload_failed" } });
                  }
              })
              .catch(error => {
                  logger.error("uploadImage", `Something went wrong, ${error}`);
                  resolve({ status: "error", error: { message: t("common.error.unknown"), code: "upload_failed" } });
              });
      });
  }, [startUpload, auth, authToken, t]); // Dependencies for uploadImage


  const handleImagePaste = async (
    event: React.ClipboardEvent<HTMLDivElement>
  ) => {
    if (!modelDescriptions[model]?.vision || !event.clipboardData || event.clipboardData.files.length === 0) return;
    const clipboardFile = event.clipboardData.files[0];
    toast.promise(uploadImage(clipboardFile), { // Use useCallback version
      loading: t("common.upload.uploading"),
      success: (res) => {
        if (res.status === 'success' && res.data?.url) {
            setImage(res.data.url);
            return t("common.upload.uploaded");
        }
        // Should not happen if promise resolves successfully with success status
        return t("common.error.unknown");
      },
      error: (res) => {
        logger.error("handleImagePaste", "Upload failed: " + JSON.stringify(res.error));
        return res.error?.message || t("common.error.unknown");
      },
    });
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!modelDescriptions[model]?.vision || !event.target?.files || event.target.files.length === 0) return;
    const file = event.target.files[0];
     toast.promise(uploadImage(file), { // Use useCallback version
      loading: t("common.upload.uploading"),
       success: (res) => {
         if (res.status === 'success' && res.data?.url) {
             setImage(res.data.url);
             return t("common.upload.uploaded");
         }
         return t("common.error.unknown");
       },
       error: (res) => {
         logger.error("handleImageUpload", "Upload failed: " + JSON.stringify(res.error));
         return res.error?.message || t("common.error.unknown");
       },
    });
     // Reset file input to allow uploading the same file again
     if (fileInputRef.current) {
       fileInputRef.current.value = "";
     }
  };


  // --- Render ---
  return (
    <>
      <HeaderArea
        model={model}
        stop={stop}
        generating={status == "submitted" || status == "streaming"}
        handleModelChange={handleModelChange}
        reasoningEffort={reasoningEffort}
        handleReasoningEffortChange={setReasoningEffort}
        // Pass currentSession from state, ensure it's not undefined
        currentSession={currentSession}
        user={user as User} // Use type assertion
        messages={messages}
        chatId={sessionId} // Pass sessionId prop
      />

      <div
        className={cn(
          "flex w-full md:w-9/12 lg:w-7/12 rounded overflow-y-auto scrollbar-thin scrollbar-thumb-primary scrollbar-track-secondary scrollbar-thumb-rounded-md scrollbar-track-rounded-md flex-1 my-2",
          isMobile && "px-1"
        )}
      >
        <div ref={chatLogRef} className="w-full overflow-y-auto">
          <Suspense fallback={<Loading />}>
              <>
                <MemoizedMessageList
                  messages={messages}
                  sessionId={sessionId} // Pass prop
                  error={error}
                  onRegenerate={handleRegenerate} // Pass handler
                />
                {status === "submitted" && (
                  <div className="flex w-full message-log visible">
                    <div className="p-2 my-2 rounded-lg text-muted-foreground w-full">
                      <div className="ml-3 animate-pulse">
                        {modelDescriptions[model]?.reasoning
                          ? t("messageLog.reasoning")
                          : t("messageLog.thinking")}
                      </div>
                    </div>
                  </div>
                )}
                {error && (
                  <div className="flex w-full message-log visible">
                    <div className="p-2 my-2 rounded-lg text-muted-foreground w-full">
                      <div className="ml-3 flex items-center gap-2">
                        <span>{t("chat.error.retryMessage")}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRetry}
                          disabled={retryCount >= MAX_RETRIES}
                        >
                          {t("chat.error.retry")} ({retryCount}/{MAX_RETRIES})
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
          </Suspense>
        </div>
      </div>

      <div className={cn("w-full flex flex-col items-center justify-center shrink-0 pb-1")}>
        <ChatInput
          input={input}
          image={image}
          model={model}
          generating={status === "streaming" || status === "submitted"}
          stop={stop}
          isUploading={isUploading}
          searchEnabled={searchEnabled}
          deepResearch={deepResearch}
          sendButtonRef={sendButtonRef}
          canvasEnabled={canvasEnabled}
          modelDescriptions={modelDescriptions}
          deepResearchToggle={deepResearchToggle}
          searchToggle={searchToggle}
          canvasToggle={canvasToggle}
          handleSendMessage={handleSendMessage}
          handleSendMessageKey={handleSendMessageKey}
          handleInputChange={handleInputChange}
          handleImagePaste={handleImagePaste}
          handleImageUpload={handleImageUpload}
          setImage={setImage}
          fileInputRef={fileInputRef}
        />
        <Footer />
      </div>
    </>
  );
};

export default Chat; 
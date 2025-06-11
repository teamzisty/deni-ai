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
import { ChatSession, useChatSessions } from "@/hooks/use-chat-sessions"; // Assuming needed, adjust later
import {
  modelDescriptions,
  reasoningEffortType,
} from "@/lib/modelDescriptions";
import { cn } from "@workspace/ui/lib/utils";
import { AlertCircleIcon } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { UIMessage, ChatRequestOptions } from "ai";
import { SupabaseClient, User } from "@supabase/supabase-js"; // Import User type

import logger from "@/utils/logger";
import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
import { Loading } from "@/components/loading";
import HeaderArea from "@/components/HeaderArea";
import { MessageLog } from "@/components/MessageLog";
import ChatInput from "@/components/ChatInput";
import { ResearchDepth } from "@/components/DeepResearchButton"; // Import the ResearchDepth type
import { useSettings } from "@/hooks/use-settings";
import { useTitle } from "@/hooks/use-title";
import { useAutoResume } from "@/hooks/use-auto-resume";

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
    console.log("Rendering MemoizedMessageList", {
      messages,
      sessionId,
      error,
      onRegenerate,
    });
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
    // Also compare annotations so that annotation updates trigger re-render
    const sameMessage =
      prevLastMsg.id === nextLastMsg.id &&
      prevLastMsg.content === nextLastMsg.content;
    const prevAnnot = JSON.stringify(prevLastMsg.annotations || []);
    const nextAnnot = JSON.stringify(nextLastMsg.annotations || []);
    const sameAnnotations = prevAnnot === nextAnnot;
    return sameMessage && sameAnnotations;
  },
);
MemoizedMessageList.displayName = "MemoizedMessageList";

interface ChatProps {
  sessionId: string;
  initialSessionData: ChatSession;
  user: User | null;
  authToken: string | null;
  initialModel?: string;
  initialImage?: string;
  initialMessage?: string | null;
}

const Chat: React.FC<ChatProps> = ({
  sessionId,
  initialSessionData,
  user,
  authToken,
  initialMessage,
}) => {
  const t = useTranslations();
  const isMobile = useIsMobile();
  const { updateSessionPartial } = useChatSessions();

  // --- State Variables ---
  const [image, setImage] = useState<string | null>(null);
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [currentSession, setCurrentSession] =
    useState<ChatSession>(initialSessionData);
  const { settings } = useSettings();
  const [deepResearch, setDeepResearch] = useState(false);
  const [researchDepth, setResearchDepth] = useState<ResearchDepth>("deep");
  const { setTitle } = useTitle({ defaultTitle: currentSession.title });
  const [visionRequired, setVisionRequired] = useState(!!image);
  const [availableTools, setAvailableTools] = useState<string[]>([]);
  const [model, setModel] = useState<string>("openai/gpt-4.1-2025-04-14");
  const [reasoningEffort, setReasoningEffort] =
    useState<reasoningEffortType>("medium");
  const [canvasEnabled, setCanvasEnabled] = useState(false);
  const [isInitialMessageSent, setIsInitialMessageSent] = useState(false);
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
    experimental_resume,
    error,
    handleSubmit,
    data,
  } = useChat({
    api: "/api/chat", // Specify the chat API endpoint
    initialMessages: initialSessionData.messages, // Initialize messages
    id: sessionId, // Set chat id to sync with session
    maxSteps: 50,
    onFinish: (message, options) => {
      // Message sent successfully
      console.log("Message sent successfully");
    },
    onError: (error) => {
      console.error("useChat error:", error);
      toast.error(String(error));
    },
    headers: {
      Authorization: authToken || "",
    },
    body: {
      toolList: availableTools || [],
      language: navigator.language,
      botId: currentSession.bot?.id,
      model: model || "openai/gpt-4.1-2025-04-14",
      reasoningEffort: reasoningEffort || "medium",
      sessionId: sessionId,
    },
  });

  // Ref for tracking previous status (for saving logic)
  // const prevStatusRef = useRef(status); // No longer needed for saving logic

  const { isUploading, startUpload } = useUploadThing("imageUploader", {
    headers: {
      // Use authToken prop
      Authorization: authToken || "",
    },
    onClientUploadComplete: (res) => {
      setImage(res[0]?.ufsUrl || null);
    },
    onUploadError: (error: Error) => {
      toast.error(t("chat.error.imageUpload"), {
        description: t("chat.error.errorOccurred", { message: error.message }),
      });
    },
  }); // Scroll chat log
  useEffect(() => {
    if (!settings.autoScroll) return; // Check if auto-scroll is enabled
    if (
      (status === "streaming" || status === "submitted") &&
      chatLogRef.current
    ) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [messages, status]); // Handle initial message from URL parameter
  useEffect(() => {
    if (
      initialMessage &&
      messages.length === 0 &&
      !isInitialMessageSent &&
      (status === "ready" || status === "error")
    ) {
      setInput(initialMessage);
      setIsInitialMessageSent(true);
      // Send the message after a short delay to ensure everything is initialized
      setTimeout(() => {
        if (sendButtonRef.current) {
          sendButtonRef.current.click();
        }
      }, 1900);
    }
  }, [initialMessage, messages.length, isInitialMessageSent, status, setInput]);

  // Detect vision requirement based on messages
  useEffect(() => {
    if (
      !visionRequired &&
      messages.some(
        (message) =>
          message.role === "user" && message.experimental_attachments,
      )
    ) {
      setVisionRequired(true);
    }
  }, [messages, visionRequired]);

  // --- Handler Functions ---

  const canvasToggle = useCallback(() => {
    setCanvasEnabled((prev) => !prev);
  }, []);

  const handleModelChange = useCallback(
    (newModel: string) => {
      if (!modelDescriptions[newModel]?.vision && image) {
        logger.warn(
          "handleModelChange",
          "Model doesn't support vision, removing image.",
        );
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
    [image], // Dependency on image state
  );

  const searchToggle = useCallback(() => {
    setSearchEnabled((prev) => !prev);
    // Update local storage? Maybe keep that in page.tsx?
  }, []);

  const deepResearchToggle = useCallback(() => {
    if (!deepResearch) {
      toast.info(t("chat.deepResearch.info"), {
        description: t("chat.deepResearch.description"),
      });
    }
    setDeepResearch((prev) => !prev);
  }, [t]);

  const handleResearchDepthChange = useCallback((depth: ResearchDepth) => {
    setResearchDepth(depth);
    logger.info(
      "handleResearchDepthChange",
      `Research depth changed to ${depth}`,
    );
  }, []);
  const baseSendMessage = async (
    event:
      | React.MouseEvent<HTMLButtonElement>
      | React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    // Use component state/props
    if (!currentSession || !input) {
      console.log("Early return: missing currentSession or input");
      return;
    }
    if (status === "streaming" || status === "submitted") {
      console.log("Early return: chat is busy, status:", status);
      return;
    }
    if (!model || !reasoningEffort) {
      console.error("Model or reasoningEffort not initialized", {
        model,
        reasoningEffort,
      });
      return;
    }

    const newAvailableTools = [];
    if (searchEnabled) newAvailableTools.push("search");
    if (settings.advancedSearch) newAvailableTools.push("advancedSearch");
    if (deepResearch) {
      if (researchDepth === "shallow") {
        newAvailableTools.push("shallowResearch"); // Add tool for shallow research
        newAvailableTools.push("researchStatus"); // Add status reporting tool
      } else if (researchDepth === "deep") {
        newAvailableTools.push("deepResearch"); // Add tool for deep research
        newAvailableTools.push("researchStatus"); // Add status reporting tool
      } else if (researchDepth === "advanced") {
        newAvailableTools.push("advancedResearch"); // Add tool for advanced research
        newAvailableTools.push("researchStatus"); // Add status reporting tool
      }
    }
    if (canvasEnabled) newAvailableTools.push("canvas");
    setAvailableTools(newAvailableTools);

    try {
      const submitOptions: ChatRequestOptions = {
        experimental_attachments: image
          ? [{ url: image, contentType: "image/png" }] // Assume png for now
          : undefined,
      };
      submitOptions.headers = {
        ...(authToken ? { Authorization: authToken } : {}),
        "Content-Type": "application/json",
      };

      logger.info(
        "Send message",
        `Sending message: "${input.substring(0, 30)}..."`,
      );
      if (image) logger.info("Send message", "Sending with image attachment");

      handleSubmit(event, submitOptions);
      setImage(null); // Clear image after sending
      setRetryCount(0); // Reset retry count
    } catch (error) {
      toast.error(t("chat.error.messageSendFailed"), {
        description:
          error instanceof Error ? error.message : t("common.error.unknown"),
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
      console.warn(
        "Regenerating with a specific model might not update API call body immediately.",
      );
    } // Wait for 1 second before reloading
    if (authToken) {
      submitOptions.headers = { Authorization: authToken };
    }

    await new Promise((resolve) => setTimeout(resolve, 300));

    try {
      reload(submitOptions);
    } catch (error) {
      toast.error(t("chat.error.regenerateFailed"), {
        // Added specific error message
        description:
          error instanceof Error ? error.message : t("common.error.unknown"),
      });
    }
  };

  // handleRegenerate needs to be called by MessageLog, let's define it here
  const handleRegenerate = useCallback(
    (modelOverride?: string) => {
      authReload({ regenerateWithModel: modelOverride });
    },
    [authReload],
  ); // authReload depends on other states/props

  const handleRetry = async () => {
    if (retryCount >= MAX_RETRIES) {
      toast.error(t("chat.error.maxRetriesReached"));
      return;
    }
    setRetryCount((prev) => prev + 1);
    authReload(); // Use the common reload logic
  };

  const handleSendMessage = async (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    baseSendMessage(event);
  };

  const handleSendMessageKey = async (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      baseSendMessage(event);
    }
  };

  const uploadImage = useCallback(
    (file?: File): Promise<uploadResponse> => {
      return new Promise((resolve) => {
        if (!file) {
          resolve({
            status: "error",
            error: {
              message: t("common.error.fileNotSelected"),
              code: "file_not_selected",
            },
          });
          return;
        }
        if (!authToken) {
          // Need auth token for upload
          resolve({
            status: "error",
            error: {
              message: t("chat.error.authRequiredUpload"),
              code: "auth_required",
            },
          }); // Add translation
          return;
        }

        // No need for async function wrapper here
        startUpload([
          new File([file], `${crypto.randomUUID()}.png`, { type: file.type }),
        ])
          .then((data) => {
            if (data && data[0]?.ufsUrl) {
              resolve({ status: "success", data: { url: data[0].ufsUrl } });
            } else {
              resolve({
                status: "error",
                error: {
                  message: t("common.error.unknown"),
                  code: "upload_failed",
                },
              });
            }
          })
          .catch((error) => {
            logger.error("uploadImage", `Something went wrong, ${error}`);
            resolve({
              status: "error",
              error: {
                message: t("common.error.unknown"),
                code: "upload_failed",
              },
            });
          });
      });
    },
    [startUpload, authToken, t],
  ); // Dependencies for uploadImage

  const handleImagePaste = async (
    event: React.ClipboardEvent<HTMLDivElement>,
  ) => {
    if (
      !modelDescriptions[model]?.vision ||
      !event.clipboardData ||
      event.clipboardData.files.length === 0
    )
      return;
    const clipboardFile = event.clipboardData.files[0];
    toast.promise(uploadImage(clipboardFile), {
      // Use useCallback version
      loading: t("common.upload.uploading"),
      success: (res) => {
        if (res.status === "success" && res.data?.url) {
          setImage(res.data.url);
          return t("common.upload.uploaded");
        }
        // Should not happen if promise resolves successfully with success status
        return t("common.error.unknown");
      },
      error: (res) => {
        logger.error(
          "handleImagePaste",
          "Upload failed: " + JSON.stringify(res.error),
        );
        return res.error?.message || t("common.error.unknown");
      },
    });
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (
      !modelDescriptions[model]?.vision ||
      !event.target?.files ||
      event.target.files.length === 0
    )
      return;
    const file = event.target.files[0];
    toast.promise(uploadImage(file), {
      // Use useCallback version
      loading: t("common.upload.uploading"),
      success: (res) => {
        if (res.status === "success" && res.data?.url) {
          setImage(res.data.url);
          return t("common.upload.uploaded");
        }
        return t("common.error.unknown");
      },
      error: (res) => {
        logger.error(
          "handleImageUpload",
          "Upload failed: " + JSON.stringify(res.error),
        );
        return res.error?.message || t("common.error.unknown");
      },
    });
    // Reset file input to allow uploading the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    if (!currentSession) return;
    if (status === "streaming" || status === "submitted") return;

    updateSessionPartial(sessionId, {
      messages: messages,
    });
  }, [messages, status]);

  useAutoResume({
    autoResume: true,
    initialMessages: messages,
    experimental_resume,
    data,
    setMessages,
  });

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
      />
      <div
        className={cn(
          "flex w-full md:w-9/12 lg:w-7/12 rounded overflow-y-auto scrollbar-thin scrollbar-thumb-primary scrollbar-track-secondary scrollbar-thumb-rounded-md scrollbar-track-rounded-md flex-1 my-2",
          isMobile && "px-1",
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
              {status === "submitted" ||
                (status === "streaming" &&
                  !messages[messages.length - 1]?.content && (
                    <div className="flex w-full message-log visible">
                      <div className="p-2 my-2 rounded-lg text-muted-foreground w-full">
                        <span className="animate-pulse">
                          {modelDescriptions[model]?.reasoning
                            ? t("messageLog.reasoning")
                            : t("messageLog.thinking")}
                        </span>
                      </div>
                    </div>
                  ))}
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
          </Suspense>{" "}
        </div>
      </div>{" "}
      <div
        className={cn(
          "w-full flex flex-col items-center justify-center shrink-0 pb-1",
        )}
      >
        <ChatInput
          className="w-full md:max-w-9/12 lg:max-w-7/12"
          input={input}
          image={image}
          model={model}
          generating={status === "streaming" || status === "submitted"}
          stop={stop}
          isUploading={isUploading}
          searchEnabled={searchEnabled}
          deepResearch={deepResearch}
          researchDepth={researchDepth}
          sendButtonRef={sendButtonRef}
          canvasEnabled={canvasEnabled}
          modelDescriptions={modelDescriptions}
          bot={currentSession.bot}
          deepResearchToggle={deepResearchToggle}
          onResearchDepthChange={handleResearchDepthChange}
          searchToggle={searchToggle}
          canvasToggle={canvasToggle}
          handleSendMessage={handleSendMessage}
          handleSendMessageKey={handleSendMessageKey}
          handleInputChange={handleInputChange}
          handleImagePaste={handleImagePaste}
          handleImageUpload={handleImageUpload}
          setImage={setImage}
          fileInputRef={fileInputRef}
          messages={messages}
        />
      </div>
    </>
  );
};

export default Chat;

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
import { User } from "@supabase/supabase-js"; // Import User type

import logger from "@/utils/logger";
import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
import { Loading } from "@/components/loading";
import HeaderArea from "@/components/HeaderArea";
import { MessageLog } from "@/components/MessageLog";
import ChatInput from "@/components/ChatInput";
import { useDebouncedCallback } from "use-debounce"; // Import useDebouncedCallback
import { ResearchDepth } from "@/components/DeepResearchButton"; // Import the ResearchDepth type
import { useSettings } from "@/hooks/use-settings";
import { useTitle } from "@/hooks/use-title";

interface MessageListProps {
  messages: UIMessage[];
  sessionId: string;
  error?: Error;
  onRegenerate?: () => void;
}

// Keep MemoizedMessageList definition here or move to its own file later
const MemoizedMessageList = memo(
  ({
    messages,
    sessionId,
    error,
    onRegenerate,
  }: MessageListProps) => {
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
    // Also compare annotations so that annotation updates trigger re-render
    const sameMessage =
      prevLastMsg.id === nextLastMsg.id &&
      prevLastMsg.content === nextLastMsg.content;
    const prevAnnot = JSON.stringify(prevLastMsg.annotations || []);
    const nextAnnot = JSON.stringify(nextLastMsg.annotations || []);
    const sameAnnotations = prevAnnot === nextAnnot;
    return sameMessage && sameAnnotations;
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
}) => {
  const t = useTranslations();
  const isMobile = useIsMobile();

  // --- State Variables ---
  const [image, setImage] = useState<string | null>(initialImage || null);
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [currentSession, setCurrentSession] = useState<ChatSession>(initialSessionData);
  const { settings } = useSettings();
  const [deepResearch, setDeepResearch] = useState(false);
  const [researchDepth, setResearchDepth] = useState<ResearchDepth>("deep");
  const { setTitle } = useTitle({ defaultTitle: currentSession.title });
  const [visionRequired, setVisionRequired] = useState(!!initialImage);
  const [availableTools, setAvailableTools] = useState<string[]>([]);
  const [model, setModel] = useState<string>(
    initialModel || "openai/gpt-4.1-2025-04-14"
  );
  const [reasoningEffort, setReasoningEffort] =
    useState<reasoningEffortType>("medium");
  const [canvasEnabled, setCanvasEnabled] = useState(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const MAX_RETRIES = 3;

  // --- Refs ---
  const chatLogRef = useRef<HTMLDivElement>(null);
  const sendButtonRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  let authTokenTemp;

  const handleAuthToken = async () => {
    if (authToken) {
      authTokenTemp = authToken;
    } else {
      throw new Error(t("chat.error.idTokenFailed"));
    }
  }

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
    maxSteps: 50,
    onError: (error) => {
      toast.error(String(error));
    },    headers: {
      Authorization: authToken || "",
    },
    async onToolCall({ toolCall }) {
      if (toolCall.toolName === "setTitle") {
        updateSession(sessionId, {
          ...currentSession,
          title: (toolCall.args as { title: string }).title,
        });
        setCurrentSession((prev) => ({
          ...prev,
          title: (toolCall.args as { title: string }).title,
        }));
        await handleAuthToken();
        return "OK";
      }
    },
    body: {
      toolList: availableTools,
      language: navigator.language,
      botId: currentSession.bot?.id,
      model,
      reasoningEffort,
    },
  });

  // Ref for tracking previous status (for saving logic)
  // const prevStatusRef = useRef(status); // No longer needed for saving logic

  const { isUploading, startUpload } = useUploadThing("imageUploader", {
    headers: {        // Use authToken prop
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
  });

  // --- useEffect Hooks ---

  // Update previous status ref
  // useEffect(() => {
  //   prevStatusRef.current = status;
  // }); // No longer needed for saving logic

  // Handle initial message prop
  useEffect(() => {
    if (
      initialMessage &&
      messages.length <= initialSessionData.messages.length
    ) {
      // Check if messages haven't increased beyond initial ones
      setInput(initialMessage);
      // Use a flag or check message content to avoid re-sending on remounts?
      // For now, use a simple approach. Might need refinement.
      setTimeout(() => {
        sendButtonRef.current?.click();
        logger.info("Chat Component", "Sending initial message from prop");
      }, 100); // Small delay
    }
  }, [
    initialMessage,
    setInput,
    messages.length,
    initialSessionData.messages.length,
  ]);

  // Scroll chat log
  useEffect(() => {
    if (!settings.autoScroll) return; // Check if auto-scroll is enabled
    if (
      (status === "streaming" || status === "submitted") &&
      chatLogRef.current
    ) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [messages, status]);

  // Debounced function to save session data
  const debouncedUpdateSession = useDebouncedCallback(
    (updatedMessages: UIMessage[]) => {
      if (!currentSession) return; // Ensure currentSession is defined

      // Explicitly create plain objects for Firestore compatibility
      const messagesToSave = updatedMessages.map((message) => {
        // 1. Create plain message object
        const plainMessage: any = {
          // Use 'any' for flexibility, ensure properties exist
          id: message.id,
          role: message.role,
          content: message.content, // Keep the top-level content
          createdAt: message.createdAt, // Keep as Date obj, assume use-chat-sessions handles Timestamp
        };

        // 2. Process Parts -> Plain Parts
        if (message.parts && message.parts.length > 0) {
          plainMessage.parts = message.parts.map((part) => {
            const plainPart: any = { type: part.type };

            if (part.type === "text" && part.text) {
              plainPart.text = part.text;
            } else if (part.type === "reasoning" && part.reasoning) {
              plainPart.reasoning = part.reasoning; // Include reasoning if present
            } else if (part.type === "tool-invocation") {
              // Create plain toolInvocation object
              const plainToolInvocation: any = {
                toolCallId: part.toolInvocation.toolCallId,
                toolName: part.toolInvocation.toolName,
              };
              // Copy args if they exist (should be serializable JSON)
              if (part.toolInvocation.args) {
                plainToolInvocation.args = part.toolInvocation.args;
              }

              // Handle state and potentially modified result
              plainToolInvocation.state = part.toolInvocation.state;
              let resultString =
                part.toolInvocation.state === "result"
                  ? part.toolInvocation.result
                  : undefined;

              // Modify search result string if necessary
              if (
                plainToolInvocation.toolName === "search" &&
                plainToolInvocation.state === "result" &&
                resultString
              ) {
                try {
                  const result = JSON.parse(resultString);
                  if (result && Array.isArray(result.searchResults)) {
                    const modifiedSearchResults = result.searchResults.map(
                      (searchResult: any) => {
                        const { content, ...rest } = searchResult; // Remove content
                        return rest;
                      }
                    );
                    // Re-stringify with modified results
                    resultString = JSON.stringify({
                      ...result,
                      searchResults: modifiedSearchResults,
                    });
                  }
                } catch (e) {
                  console.error(
                    "Failed to parse/modify search result for saving:",
                    e
                  );
                  // Keep original result string if error occurs
                }
              }
              // Add the result string if it exists
              if (resultString !== undefined) {
                plainToolInvocation.result = resultString;
              }

              plainPart.toolInvocation = plainToolInvocation;
            }
            // Add other part types if necessary (e.g., 'step-start', 'step-end')
            else if (part.type === "step-start") {
              // Include step-start specific data if needed, otherwise just type is fine
            }
            // ... other part types like step-end, ui ...

            return plainPart;
          });
        } else {
          // Ensure parts array exists even if empty, or handle null case if preferred
          plainMessage.parts = [];
        }

        // 3. Process Annotations -> Plain Annotations
        if (message.annotations && message.annotations.length > 0) {
          // Ensure annotations are plain objects
          plainMessage.annotations = message.annotations
            .map((annotation) => {
              // Check if annotation is a non-null object before spreading
              if (annotation && typeof annotation === "object") {
                return { ...annotation };
              }
              // Return null or handle non-object annotations if necessary
              // For now, returning null to filter them out later
              return null;
            })
            .filter(Boolean); // Filter out any null values from the map
        } else {
          plainMessage.annotations = []; // Ensure array exists
        }

        // Add revisionId if it exists
        if ((message as any).revisionId) {
          plainMessage.revisionId = (message as any).revisionId;
        }

        // Add experimental_attachments if it exists and is serializable
        if (
          message.experimental_attachments &&
          message.experimental_attachments.length > 0
        ) {
          // Assuming attachments are already plain objects with url/contentType
          plainMessage.experimental_attachments =
            message.experimental_attachments.map((att) => ({ ...att }));
        }

        // Return the fully plain message object
        return plainMessage as UIMessage; // Cast back to UIMessage for consistency if needed downstream
      });

      // Create the final session object with plain messages
      const updatedSessionData = {
        ...currentSession,
        messages: messagesToSave,
      }; // Update the session in the parent/storage
      updateSession(sessionId, updatedSessionData); // Pass the updated session data
    },
    1000 // Debounce time
  );

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

  // Periodic refresh for annotation updates (e.g., generationTime)
  useEffect(() => {
    const interval = setInterval(() => {
      if (messages.length > 0) {
        const lastMsg = messages[messages.length - 1];
        // Trigger re-render by replacing last message with a shallow clone
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [messages, setMessages]);

  // --- Handler Functions ---

  const canvasToggle = useCallback(() => {
    setCanvasEnabled((prev) => !prev);
  }, []);

  const handleModelChange = useCallback(
    (newModel: string) => {
      if (!modelDescriptions[newModel]?.vision && image) {
        logger.warn(
          "handleModelChange",
          "Model doesn't support vision, removing image."
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
    [image] // Dependency on image state
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
      `Research depth changed to ${depth}`
    );
  }, []);

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
      };      if (authToken) {
        submitOptions.headers = { Authorization: authToken };
      }

      logger.info(
        "Send message",
        `Sending message: "${input.substring(0, 30)}..."`
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
        "Regenerating with a specific model might not update API call body immediately."
      );
    }    // Wait for 1 second before reloading
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
    [authReload]
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
        }        if (!authToken) {
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
      });    },
    [startUpload, authToken, t]
  ); // Dependencies for uploadImage

  const handleImagePaste = async (
    event: React.ClipboardEvent<HTMLDivElement>
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
          "Upload failed: " + JSON.stringify(res.error)
        );
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
          "Upload failed: " + JSON.stringify(res.error)
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
    console.log(status, "Status changed to: ", status);
  }, [status]); // Add status as dependency

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
          </Suspense>
        </div>
      </div>

      <div
        className={cn(
          "w-full flex flex-col items-center justify-center shrink-0 pb-1"
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
        />
      </div>
    </>
  );
};

export default Chat;

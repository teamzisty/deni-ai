"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  memo,
  Suspense,
  useMemo,
} from "react";
import { useChat } from "@ai-sdk/react";
import { useUploadThing, uploadResponse } from "@/utils/uploadthing";
import { ChatSession } from "@/hooks/use-chat-sessions";
import {
  modelDescriptions,
  reasoningEffortType,
} from "@/lib/modelDescriptions";
import { cn } from "@workspace/ui/lib/utils";
import { AlertCircleIcon } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { UIMessage, ChatRequestOptions, CreateMessage } from "ai";
import { User } from "@supabase/supabase-js";

import logger from "@/utils/logger";
import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
import { Loading } from "@/components/loading";
import IntellipulseMessageLog from "@/components/IntellipulseMessageLog";
import ChatInput from "@/components/ChatInput";
import { useAuth } from "@/context/AuthContext";
import { useDebouncedCallback } from "use-debounce";
import { UseChatHelpers } from "@ai-sdk/react";
import { getModelDisplayName, isModelPremium } from "@/lib/usage-client";
import { useSettings } from "@/hooks/use-settings";

interface MemoizedMessageLogProps {
  message: UIMessage;
  onRegenerate?: (model: string) => void;
  isExecuting?: boolean;
  allowExecution: boolean;
  onExecuteSteps: (steps: any[]) => void;
}

const MemoizedMessageLog = memo(
  ({
    message,
    onRegenerate,
    isExecuting,
    allowExecution,
    onExecuteSteps,
  }: MemoizedMessageLogProps) => {
    const t = useTranslations();
    return (
      <>
        <IntellipulseMessageLog
          message={message}
          onRegenerate={onRegenerate}
          isExecuting={isExecuting}
          allowExecution={allowExecution}
          onExecuteSteps={onExecuteSteps}
        />
      </>
    );
  },
);
MemoizedMessageLog.displayName = "MemoizedMessageLog";

// 仮想スクロールのためのコンポーネント
const VirtualizedMessageList = memo(
  ({
    messages,
    sessionId,
    onRegenerate,
    handleExecuteSteps,
  }: {
    messages: UIMessage[];
    sessionId: string;
    onRegenerate: (model?: string) => void;
    handleExecuteSteps: (steps: any[]) => void;
  }) => {
    const [visibleRange, setVisibleRange] = useState({
      start: 0,
      end: Math.min(messages.length, 10),
    });
    const containerRef = useRef<HTMLDivElement>(null);

    // Debounced scroll handler to prevent excessive state updates
    const handleScroll = useDebouncedCallback(() => {
      const container = containerRef.current;
      if (!container) return;

      const scrollTop = container.scrollTop;
      const viewportHeight = container.clientHeight;

      // --- 推定高さとバッファ ---
      const estimatedItemHeight = 200;
      const bufferItems = 3;

      const startIndex = Math.max(
        0,
        Math.floor(scrollTop / estimatedItemHeight) - bufferItems,
      );
      const endIndex = Math.min(
        messages.length,
        Math.ceil((scrollTop + viewportHeight) / estimatedItemHeight) +
          bufferItems,
      );

      // Only update if there's an actual change
      setVisibleRange((prev) => {
        if (prev.start === startIndex && prev.end === endIndex) {
          return prev;
        }
        return { start: startIndex, end: endIndex };
      });
    }, 100); // 100ms debounce

    // Set up scroll listener
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      console.log("VirtualizedMessageList mounted, setting up scroll listener");

      // Initial calculation
      handleScroll();

      container.addEventListener("scroll", handleScroll);
      return () => {
        container.removeEventListener("scroll", handleScroll);
        handleScroll.cancel(); // Cancel any pending debounced calls
      };
    }, [handleScroll]);

    // Reset range when messages change significantly
    useEffect(() => {
      // Only reset if the message count has changed
      console.log("Messages length changed, resetting visible range");
      setVisibleRange((prev) => {
        const newEnd = Math.min(messages.length, 10);
        if (prev.end > messages.length || messages.length <= 10) {
          return { start: 0, end: newEnd };
        }
        return prev;
      });
    }, [messages.length]);

    // Memoize visible messages to prevent unnecessary recalculations
    const visibleMessages = useMemo(
      () => messages.slice(visibleRange.start, visibleRange.end),
      [messages, visibleRange.start, visibleRange.end],
    );

    // Calculate total height
    const totalHeight = messages.length * 200;

    return (
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto"
        style={{ position: "relative", height: "100%" }}
      >
        <div style={{ height: `${totalHeight}px`, position: "relative" }}>
          <div
            style={{
              position: "absolute",
              top: `${visibleRange.start * 200}px`,
              width: "100%",
            }}
          >
            {visibleMessages.map((message, index) => (
              <IntellipulseMessageLog
                key={`${message.id || index + visibleRange.start}`}
                message={message}
                onRegenerate={onRegenerate}
                allowExecution={true}
                onExecuteSteps={handleExecuteSteps}
              />
            ))}
          </div>
        </div>
      </div>
    );
  },
);
VirtualizedMessageList.displayName = "VirtualizedMessageList";

interface IntellipulseChatProps {
  sessionId: string;
  authToken: string | null;
  initialModel?: string;
  initialImage?: string;
  initialMessage?: string;
  onAnnotation?: (annotation: any) => void;
  updateSession: (id: string, updatedSession: ChatSession) => void;
  messages: UIMessage[];
  setMessages: (messages: UIMessage[]) => void;
  input: string;
  setInput: (input: string) => void;
  status: UseChatHelpers["status"];
  reload: UseChatHelpers["reload"];
  stop: UseChatHelpers["stop"];
  error: UseChatHelpers["error"];
  handleSubmit: UseChatHelpers["handleSubmit"];
  append: UseChatHelpers["append"];
  model: string;
  reasoningEffort: reasoningEffortType;
  handleModelChange: (newModel: string) => void;
  handleReasoningEffortChange: (value: reasoningEffortType) => void;
  startUpload: (files: File[], input?: any) => Promise<any>;
  isUploading: boolean;
}

const IntellipulseChat: React.FC<IntellipulseChatProps> = memo(
  ({
    sessionId,
    authToken,
    initialModel,
    initialImage,
    initialMessage,
    onAnnotation,
    updateSession,
    messages,
    setMessages,
    input,
    setInput,
    status,
    reload,
    stop,
    error,
    handleSubmit,
    append,
    model,
    reasoningEffort,
    handleModelChange,
    handleReasoningEffortChange,
    startUpload,
    isUploading,
  }) => {
    const t = useTranslations();
    const isMobile = useIsMobile();
    const { settings } = useSettings();

    const { user } = useAuth();

    const [image, setImage] = useState<string | null>(initialImage || null);
    const [searchEnabled, setSearchEnabled] = useState(false);
    const [advancedSearch, setAdvancedSearch] = useState(() => {
      if (typeof window !== "undefined") {
        return window.localStorage.getItem("advancedSearch") === "true";
      }
      return false;
    });
    const [deepResearch, setDeepResearch] = useState(false);
    const [visionRequired, setVisionRequired] = useState(!!initialImage);
    const [availableTools, setAvailableTools] = useState<string[]>([
      "webcontainer",
    ]);
    const [canvasEnabled, setCanvasEnabled] = useState(false);
    const [retryCount, setRetryCount] = useState<number>(0);
    const [modelUsage, setModelUsage] = useState<{
      canUse: boolean;
      remaining: number;
      isPremium: boolean;
      displayName: string;
    } | null>(null);
    const [usageLoading, setUsageLoading] = useState(false);
    const MAX_RETRIES = 3;
    // Auto-scroll state
    const [autoScrollDisabled, setAutoScrollDisabled] = useState(false);

    const chatLogRef = useRef<HTMLDivElement>(null);
    const sendButtonRef = useRef<HTMLButtonElement>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Usage check function
    const checkModelUsage = useCallback(async (modelKey: string) => {
      if (!authToken || !user) return;
      
      setUsageLoading(true);
      try {
        const response = await fetch('/api/uses', {
          headers: {
            'Authorization': authToken,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          const usage = data.usage?.find((u: any) => u.model === modelKey);
          
          if (usage) {
            setModelUsage({
              canUse: usage.canUse,
              remaining: usage.remaining,
              isPremium: usage.isPremium,
              displayName: usage.displayName,
            });
          } else {
            // Model not in usage data, assume unlimited
            setModelUsage({
              canUse: true,
              remaining: -1,
              isPremium: isModelPremium(modelKey),
              displayName: getModelDisplayName(modelKey),
            });
          }
        }
      } catch (error) {
        console.error('Failed to check model usage:', error);
      } finally {
        setUsageLoading(false);
      }
    }, [authToken, user]);

    // セッションを保存するデバウンス関数（一時的に無効化）
    /*
  const debouncedSaveSession = useDebouncedCallback(
    useCallback(() => {
      if (!sessionId || !updateSession) return;
      
      try {
        // 更新するフィールドのみを含むオブジェクトを作成
        const updates = {
          model,
          reasoningEffort,
          searchEnabled,
          advancedSearch,
          deepResearch,
          canvasEnabled,
          updatedAt: Date.now(),
        };
        
        // updateSessionには完全なChatSessionオブジェクトが必要な場合、
        // 親コンポーネントで既存のセッションとマージする必要があります
        updateSession(sessionId, updates as any);
        logger.info("Session saved", `Session ${sessionId} updated successfully`);
      } catch (error) {
        logger.error("Session save failed", error);
        console.error("Failed to save session:", error);
      }
    }, [sessionId, updateSession, model, reasoningEffort, searchEnabled, advancedSearch, deepResearch, canvasEnabled]),
    1000 // 1秒のデバウンス
  );
  */

    // メッセージが更新されたときにセッションを保存（無効化）
    /*
  useEffect(() => {
    // メッセージの保存は親コンポーネントで管理されるべきなので、
    // ここではモデルや設定の変更のみを保存
    return;
  }, [messages, debouncedSaveSession, sessionId]);
  */

    // モデルや設定が変更されたときにセッションを保存（無効化）
    /*
  useEffect(() => {
    if (sessionId) {
      debouncedSaveSession();
    }
  }, [model, reasoningEffort, searchEnabled, advancedSearch, deepResearch, canvasEnabled, debouncedSaveSession, sessionId]);
  */

    useEffect(() => {
      if (initialMessage && messages.length === 0) {
        console.log("IntellipulseChat: Initial message set", initialMessage);
        setInput(initialMessage);
        setTimeout(() => {
          sendButtonRef.current?.click();
          logger.info(
            "Chat Component",
            t("intellipulseChat.initialMessageSent"),
          );
        }, 100);
      }
    }, [initialMessage, setInput, messages.length]);

    // Check model usage when component mounts or model changes
    useEffect(() => {
      if (model && authToken && user) {
        checkModelUsage(model);
      }
    }, [model, authToken, user, checkModelUsage]);

    // Auto-scroll logic
    useEffect(() => {
      if (!settings.autoScroll || autoScrollDisabled) return; // Check if auto-scroll is enabled and not manually disabled
      if (
        (status === "streaming" || status === "submitted") &&
        chatLogRef.current
      ) {
        chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
      }
    }, [messages, status, settings.autoScroll, autoScrollDisabled]);

    // Handle manual scroll detection
    useEffect(() => {
      const chatContainer = chatLogRef.current;
      if (!chatContainer) return;

      const handleScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = chatContainer;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50; // 50px threshold
        
        // If user scrolled away from bottom, disable auto-scroll
        if (!isAtBottom && !autoScrollDisabled) {
          setAutoScrollDisabled(true);
        }
      };

      chatContainer.addEventListener('scroll', handleScroll);
      return () => chatContainer.removeEventListener('scroll', handleScroll);
    }, [autoScrollDisabled]);

    // Re-enable auto-scroll when a new generation starts
    useEffect(() => {
      if (status === "streaming" || status === "submitted") {
        setAutoScrollDisabled(false);
      }
    }, [status]);

    // ──────────────────────────────────────────────
    // Each assistant message should be annotated once only
    const processedMessagesRef = useRef<Set<string>>(new Set());
    // 各 stepId を一度だけ実行させるためのセット
    const executedStepIdsRef = useRef<Set<string>>(new Set());

    useEffect(() => {
      if (
        !visionRequired &&
        messages.some(
          (message) =>
            message.role === "user" && message.experimental_attachments,
        )
      ) {
        console.log(
          "IntellipulseChat: Vision required due to user attachments",
        );
        setVisionRequired(true);
      }
    }, [messages, visionRequired]);

    useEffect(() => {
      if (initialModel && model !== initialModel) {
        console.log("IntellipulseChat: Initial model set", initialModel);
        handleModelChange(initialModel);
      }
      if (initialImage && image !== initialImage) {
        console.log("IntellipulseChat: Initial image set", initialImage);
        setImage(initialImage);
        setVisionRequired(true);
      }
    }, [initialModel, initialImage]);

    useEffect(() => {
      // Check for annotations in the most recent message
      if (messages.length > 0) {
        const lastMsg = messages[messages.length - 1];
        const lastMsgId = String(lastMsg?.id ?? messages.length - 1);

        if (
          lastMsg &&
          lastMsg.role === "assistant" &&
          lastMsg.annotations &&
          !processedMessagesRef.current.has(lastMsgId) // already handled?
        ) {
          console.log(
            "IntellipulseChat: Processing annotations for message",
            lastMsgId,
          );

          processedMessagesRef.current.add(lastMsgId);

          lastMsg.annotations.forEach((annotation: any) => {
            if (!annotation) return;

            // ----------------------------------------
            // ① 親に通知（従来の挙動）
            if (onAnnotation) onAnnotation(annotation);

            // ----------------------------------------
            // ② steps の自動実行を完全に停止
            //    （無限ループ防止のため UI ボタン経由でのみ実行）
            //    ここではステップ情報を保持するだけで何もしない
            if (
              annotation.webcontainerAction?.action === "steps" &&
              Array.isArray(annotation.webcontainerAction.steps)
            ) {
              console.debug(
                "IntellipulseChat: steps annotation received. Execution is disabled until user clicks the run‑all button.",
              );
            }
          });
        }
      }
    }, [messages, onAnnotation]);

    useEffect(() => {
      // Set available tools on mount - make sure webcontainer tool is always available
      setAvailableTools((prevTools) => {
        console.log("IntellipulseChat: Setting available tools", prevTools);
        if (!prevTools.includes("webcontainer")) {
          return [...prevTools, "webcontainer"];
        }
        return prevTools;
      });
    }, []);

    const canvasToggle = useCallback(() => {
      setCanvasEnabled((prev) => !prev);
    }, []);

    const searchToggle = useCallback(() => {
      setSearchEnabled((prev) => !prev);
    }, []);

    const advancedSearchToggle = useCallback(() => {
      const newValue = !advancedSearch;
      setAdvancedSearch(newValue);
      localStorage.setItem("advancedSearch", String(newValue));
    }, [advancedSearch]);

    const deepResearchToggle = useCallback(() => {
      if (!deepResearch) {
        toast.info(t("chat.deepResearch.info"), {
          description: t("chat.deepResearch.description"),
        });
      }
      setDeepResearch((prev) => !prev);
    }, [deepResearch, t]);

    const baseSendMessage = useCallback(
      async (
        event:
          | React.MouseEvent<HTMLButtonElement>
          | React.KeyboardEvent<HTMLTextAreaElement>,
      ) => {
        if (!input) return;
        if (status === "streaming" || status === "submitted") return;

        // Always include webcontainer in available tools
        const newAvailableTools = ["webcontainer"];

        // Add optional tools based on UI state
        if (searchEnabled) newAvailableTools.push("search");
        if (advancedSearch) newAvailableTools.push("advancedSearch");
        if (deepResearch) newAvailableTools.push("deepResearch");
        if (canvasEnabled) newAvailableTools.push("canvas");

        setAvailableTools(newAvailableTools);

        try {
          const submitOptions: ChatRequestOptions = {
            experimental_attachments: image
              ? [{ url: image, contentType: "image/png" }]
              : undefined,
          };
          if (authToken) {
            submitOptions.headers = { Authorization: authToken };
          } else if (user) {
            // For Supabase, we use session tokens handled at the API level
            // Just pass user ID for authentication
            submitOptions.headers = { "x-user-id": user.id };
          }

          logger.info(
            "Send message",
            t("intellipulseChat.sendMessageLog", {
              message: input.substring(0, 30),
            }),
          );
          if (image)
            logger.info("Send message", t("intellipulseChat.sendImageLog"));

          handleSubmit(event as any, submitOptions);
          setImage(null);
          setRetryCount(0);

          // Refresh usage data after message submission
          if (model && authToken && user) {
            // Add a small delay to allow the API to process the usage update
            setTimeout(() => {
              checkModelUsage(model);
            }, 1000);
          }

          // メッセージ送信後にセッションを即座に保存（無効化）
          // debouncedSaveSession.flush();

          console.log("a");
        } catch (error) {
          console.error("Error sending message:", error);
          toast.error(t("chat.error.messageSendFailed"), {
            description:
              error instanceof Error
                ? error.message
                : t("common.error.unknown"),
          });
        }
      },
      [
        handleSubmit,
        model,
        reasoningEffort,
        image,
        user,
        authToken,
        append,
        availableTools,
        t,
      ],
    );

    const authReload = useCallback(
      async (options?: { regenerateWithModel?: string }) => {
        const submitOptions: ChatRequestOptions = {
          experimental_attachments: image
            ? [{ url: image, contentType: "image/png" }]
            : undefined,
        };
        if (options?.regenerateWithModel) {
          handleModelChange(options.regenerateWithModel);
          console.warn(t("intellipulseChat.regenerateWarning"));
        }
        if (authToken) {
          submitOptions.headers = { Authorization: authToken };
        } else if (user) {
          // For Supabase, we use session tokens handled at the API level
          // Just pass user ID for authentication
          submitOptions.headers = { "x-user-id": user.id };
        }

        try {
          reload(submitOptions);
        } catch (error) {
          toast.error(t("chat.error.regenerateFailed"), {
            description:
              error instanceof Error
                ? error.message
                : t("common.error.unknown"),
          });
        }
      },
      [
        reload,
        model,
        reasoningEffort,
        append,
        availableTools,
        authToken,
        handleModelChange,
        t,
      ],
    );

    const handleRegenerate = useCallback(
      (modelOverride?: string) => {
        authReload({ regenerateWithModel: modelOverride });
      },
      [authReload],
    );

    const handleRetry = useCallback(async () => {
      if (retryCount >= MAX_RETRIES) {
        toast.error(t("chat.error.maxRetriesReached"));
        return;
      }
      setRetryCount(retryCount + 1);
      await authReload();
    }, [retryCount, authReload, t]);

    const handleSendMessage = useCallback(
      async (event: React.MouseEvent<HTMLButtonElement>) => {
        await baseSendMessage(event);
      },
      [baseSendMessage],
    );

    const handleSendMessageKey = useCallback(
      async (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === "Enter" && !event.shiftKey && !isMobile) {
          event.preventDefault();
          await baseSendMessage(event);
        }
      },
      [baseSendMessage, isMobile],
    );

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
          if (!user) {
            resolve({
              status: "error",
              error: {
                message: t("chat.error.authRequiredUpload"),
                code: "auth_required",
              },
            });
            return;
          }

          startUpload([
            new File([file], `${crypto.randomUUID()}.png`, { type: file.type }),
          ])
            .then((data) => {
              if (data && data[0]?.data?.url) {
                resolve({ status: "success", data: { url: data[0].data.url } });
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
      [startUpload, user, authToken, t],
    );

    const handleImagePaste = useCallback(
      async (event: React.ClipboardEvent<HTMLDivElement>) => {
        if (
          !modelDescriptions[model]?.vision ||
          !event.clipboardData ||
          event.clipboardData.files.length === 0
        )
          return;
        const clipboardFile = event.clipboardData.files[0];
        toast.promise(uploadImage(clipboardFile), {
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
              "handleImagePaste",
              "Upload failed: " + JSON.stringify(res.error),
            );
            return res.error?.message || t("common.error.unknown");
          },
        });
      },
      [startUpload, setImage, t],
    );

    const handleInputChange = useCallback(
      (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(event.target.value);
      },
      [setInput],
    );

    const handleImageUpload = useCallback(
      async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (
          !modelDescriptions[model]?.vision ||
          !event.target?.files ||
          event.target.files.length === 0
        )
          return;
        const file = event.target.files[0];
        toast.promise(uploadImage(file), {
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
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      },
      [startUpload, setImage, t],
    );

    // thinking中のレンダリング最適化用に状態を安定化
    const isThinking = status === "submitted";
    const isStreaming = status === "streaming";
    const memoizedStatus = useMemo(
      () => ({ isThinking, isStreaming }),
      [isThinking, isStreaming],
    );

    // 最適化されたThinking表示コンポーネント
    const ThinkingIndicator = memo(() => {
      const t = useTranslations();
      return (
        <div className="flex w-full message-log visible">
          <div className="p-2 my-2 rounded-lg text-muted-foreground w-full">
            <div className="ml-3 animate-pulse">
              {modelDescriptions[model]?.reasoning
                ? t("messageLog.reasoning")
                : t("messageLog.thinking")}
            </div>
          </div>
        </div>
      );
    });
    ThinkingIndicator.displayName = "ThinkingIndicator";

    // 最適化されたエラー表示コンポーネント
    const ErrorMessage = memo(
      ({
        onRetry,
        retryCount,
        maxRetries,
      }: {
        onRetry: () => void;
        retryCount: number;
        maxRetries: number;
      }) => {
        const t = useTranslations();
        return (
          <div className="flex w-full message-log visible">
            <div className="p-2 my-2 rounded-lg text-muted-foreground w-full">
              <div className="ml-3 flex items-center gap-2">
                <span>{t("chat.error.retryMessage")}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  disabled={retryCount >= maxRetries}
                >
                  {t("chat.error.retry")} ({retryCount}/{maxRetries})
                </Button>
              </div>
            </div>
          </div>
        );
      },
    );
    ErrorMessage.displayName = "ErrorMessage";

    // IntellipulseChat 本体内 (Hooks 定義より下に追加) ----------------------------
    /** 「順番に実行」ボタンから渡ってきた steps を実行 */
    const handleExecuteSteps = useCallback((steps: any[]) => {
      console.debug(
        "IntellipulseChat: handleExecuteSteps called with steps:",
        steps,
      );
      const event = new CustomEvent("executeSteps", { detail: { steps } });
      window.dispatchEvent(event);
    }, []);
    // ---------------------------------------------------------------------

    return (
      <div className="flex flex-col h-[95%]">
        <div
          ref={chatLogRef}
          className={cn(
            "flex-1 overflow-y-auto scrollbar-thin scrollbar-track-secondary scrollbar-thumb-primary p-2",
            isMobile ? "px-1" : "px-4",
          )}
        >
          <div className="flex flex-col space-y-4 pb-4">
            {/* 最適化したメッセージリスト表示 */}
            {messages.length > 15 ? (
              <VirtualizedMessageList
                messages={messages}
                sessionId={sessionId}
                onRegenerate={handleRegenerate}
                handleExecuteSteps={handleExecuteSteps}
              />
            ) : (
              messages.map((message, index) => (
                <IntellipulseMessageLog
                  key={`${message.id || index}`}
                  message={message}
                  onRegenerate={handleRegenerate}
                  allowExecution={true}
                  onExecuteSteps={handleExecuteSteps}
                />
              ))
            )}

            {memoizedStatus.isThinking && <ThinkingIndicator />}

            {error && (
              <ErrorMessage
                onRetry={handleRetry}
                retryCount={retryCount}
                maxRetries={MAX_RETRIES}
              />
            )}
          </div>
        </div>

        <div className="flex justify-center pb-6 pt-2">
          <div className="w-full px-4">
            <ChatInput
              input={input}
              image={image}
              model={model}
              generating={
                memoizedStatus.isThinking || memoizedStatus.isStreaming
              }
              stop={stop}
              intellipulse={true}
              isUploading={isUploading}
              searchEnabled={searchEnabled}
              deepResearch={deepResearch}
              sendButtonRef={sendButtonRef}
              canvasEnabled={canvasEnabled}
              modelDescriptions={modelDescriptions}
              modelUsage={modelUsage}
              usageLoading={usageLoading}
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
              messages={messages}
            />
          </div>
        </div>
      </div>
    );
  },
);

IntellipulseChat.displayName = "IntellipulseChat";

export default IntellipulseChat;

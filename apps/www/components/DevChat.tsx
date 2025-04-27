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
import { User } from "firebase/auth";

import logger from "@/utils/logger";
import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
import { Loading } from "@/components/loading";
import DevMessageLog from "@/components/DevMessageLog";
import ChatInput from "@/components/ChatInput";
import { useAuth } from "@/context/AuthContext";
import { useDebouncedCallback } from "use-debounce";
import { UseChatHelpers } from "@ai-sdk/react";

interface MemoizedMessageLogProps {
  message: UIMessage;
  onRegenerate?: (model: string) => void;
  isExecuting?: boolean;
  allowExecution: boolean;
  onExecuteSteps: (steps: any[]) => void;
}

const MemoizedMessageLog = memo(
  ({ message, onRegenerate, isExecuting, allowExecution, onExecuteSteps }: MemoizedMessageLogProps) => {
    const t = useTranslations();
    return (
      <>
        <DevMessageLog
          message={message}
          onRegenerate={onRegenerate}
          isExecuting={isExecuting}
          allowExecution={allowExecution}
          onExecuteSteps={onExecuteSteps}
        />
      </>
    );
  }
);
MemoizedMessageLog.displayName = "MemoizedMessageLog";

// 仮想スクロールのためのコンポーネント
const VirtualizedMessageList = memo(({ messages, sessionId, onRegenerate, handleExecuteSteps }: {
  messages: UIMessage[];
  sessionId: string;
  onRegenerate: (model?: string) => void;
  handleExecuteSteps: (steps: any[]) => void;
}) => {
  const [visibleRange, setVisibleRange] = useState({
    start: 0,
    end: Math.min(messages.length, 10)
  });
  const containerRef = useRef<HTMLDivElement>(null);
  
  // スクロール位置に基づいて表示するメッセージ範囲を計算
  useEffect(() => {
    if (!containerRef.current) return;

    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;

      const scrollTop = container.scrollTop;
      const viewportHeight = container.clientHeight;

      // --- 推定高さとバッファ ---
      const estimatedItemHeight = 200;
      const bufferItems = 3;

      const startIndex = Math.max(
        0,
        Math.floor(scrollTop / estimatedItemHeight) - bufferItems
      );
      const endIndex = Math.min(
        messages.length,
        Math.ceil((scrollTop + viewportHeight) / estimatedItemHeight) +
          bufferItems
      );

      // 変更がある時だけ state を更新
      setVisibleRange(prev =>
        prev.start === startIndex && prev.end === endIndex
          ? prev
          : { start: startIndex, end: endIndex }
      );
    };
    
    // 初期設定
    handleScroll();
    
    const container = containerRef.current;
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [messages.length]);
  
  // メッセージ数が変わったときに範囲を更新
  useEffect(() => {
    setVisibleRange(prev => ({
      start: 0,
      end: Math.min(messages.length, 10)
    }));
  }, [messages.length]);
  
  // 表示領域のサイズを計算（非表示メッセージの高さを確保するため）
  const totalHeight = messages.length * 200; // 推定高さを使用
  const visibleMessages = messages.slice(visibleRange.start, visibleRange.end);
  
  return (
    <div 
      ref={containerRef} 
      className="flex-1 overflow-y-auto"
      style={{ position: 'relative', height: '100%' }}
    >
      <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
        <div style={{ 
          position: 'absolute', 
          top: `${visibleRange.start * 200}px`,
          width: '100%' 
        }}>
          {visibleMessages.map((message, index) => (
            <DevMessageLog
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
});
VirtualizedMessageList.displayName = "VirtualizedMessageList";

interface DevChatProps {
  sessionId: string;
  authToken: string | null;
  initialModel?: string;
  initialImage?: string;
  initialMessage?: string;
  auth: any;
  onAnnotation?: (annotation: any) => void;
  updateSession: (id: string, updatedSession: ChatSession) => void;
  messages: UIMessage[];
  setMessages: (messages: UIMessage[]) => void;
  input: string;
  setInput: (input: string) => void;
  status: UseChatHelpers['status'];
  reload: UseChatHelpers['reload'];
  stop: UseChatHelpers['stop'];
  error: UseChatHelpers['error'];
  handleSubmit: UseChatHelpers['handleSubmit'];
  append: UseChatHelpers['append'];
  model: string;
  reasoningEffort: reasoningEffortType;
  handleModelChange: (newModel: string) => void;
  handleReasoningEffortChange: (value: reasoningEffortType) => void;
  startUpload: (files: File[], input?: any) => Promise<any>;
  isUploading: boolean;
}

const DevChat: React.FC<DevChatProps> = memo(({
  sessionId,
  authToken,
  initialModel,
  initialImage,
  initialMessage,
  auth,
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
  const MAX_RETRIES = 3;

  const chatLogRef = useRef<HTMLDivElement>(null);
  const sendButtonRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (
      initialMessage &&
      messages.length === 0 
    ) {
      setInput(initialMessage);
      setTimeout(() => {
        sendButtonRef.current?.click();
        logger.info("Chat Component", t('devChat.initialMessageSent'));
      }, 100);
    }
  }, [
    initialMessage,
    setInput,
    messages.length,
  ]);

  useEffect(() => {
    if (
      (status === "streaming" || status === "submitted") &&
      chatLogRef.current
    ) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [messages, status]);

  // ──────────────────────────────────────────────
  // Each assistant message should be annotated once only
  const processedMessagesRef = useRef<Set<string>>(new Set());
  // 各 stepId を一度だけ実行させるためのセット
  const executedStepIdsRef   = useRef<Set<string>>(new Set());

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

  useEffect(() => {
    if (initialModel && model !== initialModel) {
      handleModelChange(initialModel);
    }
    if (initialImage && image !== initialImage) {
      setImage(initialImage);
      setVisionRequired(true);
    }
  }, [initialModel, initialImage]);

  useEffect(() => {
    // Check for annotations in the most recent message
    if (messages.length > 0) {
      const lastMsg   = messages[messages.length - 1];
      const lastMsgId = String(lastMsg?.id ?? messages.length - 1);

      if (
        lastMsg &&
        lastMsg.role === "assistant" &&
        lastMsg.annotations &&
        !processedMessagesRef.current.has(lastMsgId) // already handled?
      ) {
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
              "DevChat: steps annotation received. Execution is disabled until user clicks the run‑all button."
            );
          }

          // （任意）run コマンド等のログ出力はそのまま
          if (
            annotation.webcontainerAction?.action === "run" &&
            annotation.webcontainerAction.command
          ) {
            console.log(
              `Command execution initiated: ${annotation.webcontainerAction.command}`
            );
          }
        });
      }
    }
  }, [messages, onAnnotation]);

  useEffect(() => {
    // Set available tools on mount - make sure webcontainer tool is always available
    setAvailableTools(prevTools => {
      if (!prevTools.includes('webcontainer')) {
        return [...prevTools, 'webcontainer'];
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

  const baseSendMessage = useCallback(async (
    event:
      | React.MouseEvent<HTMLButtonElement>
      | React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (!input) return;
    if (status === "streaming" || status === "submitted") return;

    // Always include webcontainer in available tools
    const newAvailableTools = ['webcontainer'];
    
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

      if (auth && authToken) {
        submitOptions.headers = { Authorization: authToken };
      } else if (auth && !authToken && user) {
        const idToken = await user.getIdToken(true);
        if (idToken) submitOptions.headers = { Authorization: idToken };
        else {
          console.error("idToken", idToken);
          throw new Error(t("chat.error.idTokenFailed"));
        }
      } else if (auth) {
        console.error("authaas", user);
        throw new Error(t("chat.error.idTokenFailed"));
      }

      logger.info(
        "Send message",
        t('devChat.sendMessageLog', { message: input.substring(0, 30) })
      );
      if (image) logger.info("Send message", t('devChat.sendImageLog'));

      handleSubmit(event as any, submitOptions);
      setImage(null);
      setRetryCount(0);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(t("chat.error.messageSendFailed"), {
        description:
          error instanceof Error ? error.message : t("common.error.unknown"),
      });
    }
  }, [handleSubmit, model, reasoningEffort, image, user, auth, authToken, append, availableTools, t]);

  const authReload = useCallback(async (options?: { regenerateWithModel?: string }) => {
    const submitOptions: ChatRequestOptions = {
      experimental_attachments: image
        ? [{ url: image, contentType: "image/png" }]
        : undefined,
    };
    if (options?.regenerateWithModel) {
      handleModelChange(options.regenerateWithModel);
      console.warn(
        t('devChat.regenerateWarning')
      );
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
      toast.error(t("chat.error.regenerateFailed"), {
        description:
          error instanceof Error ? error.message : t("common.error.unknown"),
      });
    }
  }, [reload, model, reasoningEffort, append, availableTools, auth, authToken, handleModelChange, t]);

  const handleRegenerate = useCallback(
    (modelOverride?: string) => {
      authReload({ regenerateWithModel: modelOverride });
    },
    [authReload]
  );

  const handleRetry = useCallback(async () => {
    if (retryCount >= MAX_RETRIES) {
      toast.error(t("chat.error.maxRetriesReached"));
      return;
    }
    setRetryCount(retryCount + 1);
    await authReload();
  }, [retryCount, authReload, t]);

  const handleSendMessage = useCallback(async (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    await baseSendMessage(event);
  }, [baseSendMessage]);

  const handleSendMessageKey = useCallback(async (
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (event.key === "Enter" && !event.shiftKey && !isMobile) {
      event.preventDefault();
      await baseSendMessage(event);
    }
  }, [baseSendMessage, isMobile]);

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
        if (!auth && authToken) {
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
    [startUpload, auth, authToken, t]
  );

  const handleImagePaste = useCallback(async (
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
          "Upload failed: " + JSON.stringify(res.error)
        );
        return res.error?.message || t("common.error.unknown");
      },
    });
  }, [startUpload, setImage, t]);

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
  }, [setInput]);

  const handleImageUpload = useCallback(async (
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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [startUpload, setImage, t]);

  // thinking中のレンダリング最適化用に状態を安定化
  const isThinking = status === "submitted";
  const isStreaming = status === "streaming";
  const memoizedStatus = useMemo(() => ({ isThinking, isStreaming }), [isThinking, isStreaming]);

  // 最適化されたThinking表示コンポーネント
  const ThinkingIndicator = memo(() => {
    const t = useTranslations();
    return (
      <div className="flex w-full message-log visible">
        <div className="p-2 my-2 rounded-lg text-muted-foreground w-full">
          <div className="ml-3 animate-pulse">
            {modelDescriptions[model]?.reasoning
              ? t("devChat.reasoning")
              : t("devChat.thinking")}
          </div>
        </div>
      </div>
    );
  });
  ThinkingIndicator.displayName = "ThinkingIndicator";

  // 最適化されたエラー表示コンポーネント
  const ErrorMessage = memo(({ onRetry, retryCount, maxRetries }: { 
    onRetry: () => void, 
    retryCount: number, 
    maxRetries: number 
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
  });
  ErrorMessage.displayName = "ErrorMessage";

  // DevChat 本体内 (Hooks 定義より下に追加) ----------------------------
  /** 「順番に実行」ボタンから渡ってきた steps を実行 */
  const handleExecuteSteps = useCallback((steps: any[]) => {
    console.log("DevChat: Executing steps", steps);
    const event = new CustomEvent("executeSteps", { detail: { steps } });
    window.dispatchEvent(event);
  }, []);
  // ---------------------------------------------------------------------

  return (
    <div className="flex flex-col h-full">
      <div
        ref={chatLogRef}
        className={cn(
          "flex-1 overflow-y-auto scrollbar-thin scrollbar-track-secondary scrollbar-thumb-primary p-2",
          isMobile ? "px-1" : "px-4"
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
              <DevMessageLog
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
            generating={memoizedStatus.isThinking || memoizedStatus.isStreaming}
            stop={stop}
            devMode={true}
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
        </div>
      </div>
    </div>
  );
});

DevChat.displayName = "DevChat";

export default DevChat;

"use client";

import { cn } from "@workspace/ui/lib/utils";
import { AlertCircleIcon, CheckCircleIcon, Share2 } from "lucide-react";
import { MessageLog } from "@/components/MessageLog";
import { useChatSessions, ChatSession } from "@/hooks/use-chat-sessions";
import { useParams, useSearchParams } from "next/navigation";
import {
  modelDescriptions,
  reasoningEffortType,
} from "@/lib/modelDescriptions";
import { useRouter } from "@/i18n/navigation";
import { Footer } from "@/components/footer";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import { Loading } from "@/components/loading";
import { useChat } from "@ai-sdk/react";
import { uploadResponse, useUploadThing } from "@/utils/uploadthing";
import {
  useRef,
  useState,
  useEffect,
  Suspense,
  memo,
  useCallback,
} from "react";
import ChatInput from "@/components/ChatInput";
import HeaderArea from "@/components/HeaderArea";
import { ChatRequestOptions, UIMessage } from "ai";
import logger from "@/utils/logger";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";
import React from "react";
import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
import { User } from "firebase/auth";
interface MessageListProps {
  messages: UIMessage[];
  sessionId: string;
  error?: Error;
  onRegenerate?: () => void;
}

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
    // セッションIDとエラーの比較
    if (
      prevProps.sessionId !== nextProps.sessionId ||
      prevProps.error !== nextProps.error
    ) {
      return false;
    }

    // メッセージ配列の長さが異なる場合は再レンダリング
    if (prevProps.messages.length !== nextProps.messages.length) {
      return false;
    }

    // 最後のメッセージだけを比較（チャットでは通常最後のメッセージだけが変更される）
    const prevLastMsg = prevProps.messages[prevProps.messages.length - 1];
    const nextLastMsg = nextProps.messages[nextProps.messages.length - 1];

    if (!prevLastMsg || !nextLastMsg) {
      return prevProps.messages.length === nextProps.messages.length;
    }

    // 最後のメッセージのIDと内容を比較
    return (
      prevLastMsg.id === nextLastMsg.id &&
      prevLastMsg.content === nextLastMsg.content
    );
  }
);

MemoizedMessageList.displayName = "MemoizedMessageList";

const ChatApp: React.FC = () => {
  const {
    updateSession,
    getSession,
    isLoading: isSessionsLoading,
    sessions,
  } = useChatSessions();
  const { user, isLoading, auth } = useAuth();

  const t = useTranslations();

  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [currentSession, setCurrentSessionData] = useState<
    ChatSession | undefined
  >(undefined);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [image, setImage] = useState<string | null>(null);
  const router = useRouter();

  const [searchEnabled, setSearchEnabled] = useState(false);
  const [advancedSearch, setAdvancedSearch] = useState(false);
  const [deepResearch, setDeepResearch] = useState(false);

  const isMobile = useIsMobile();

  const [currentAuthToken, setCurrentAuthToken] = useState<string | null>(null);

  const [visionRequired, setVisionRequired] = useState(false);

  const [availableTools, setAvailableTools] = useState<string[]>([]);

  const [model, setModel] = useState("gpt-4o-2024-11-20");
  const [reasoningEffort, setReasoningEffort] =
    useState<reasoningEffortType>("medium");
  const [isLogged, setIsLogged] = useState(false);

  const chatLogRef = useRef<HTMLDivElement>(null);
  const sendButtonRef = useRef<HTMLButtonElement>(null);

  const [retryCount, setRetryCount] = useState<number>(0);
  const MAX_RETRIES = 3;

  // Track if we've processed the params
  const [paramsProcessed, setParamsProcessed] = useState(false);

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
    onError: (error) => {
      toast.error(String(error));
    },
    body: {
      toolList: availableTools,
      model,
      reasoningEffort,
    },
  });

  const { isUploading, startUpload } = useUploadThing("imageUploader", {
    headers: {
      Authorization: auth ? currentAuthToken || "" : "",
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

  const [canvasEnabled, setCanvasEnabled] = useState(false);

  const canvasToggle = () => {
    setCanvasEnabled((prev) => !prev);
  };

  const [isRedirecting, setIsRedirecting] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  // 再読み込み時にセッションが消えるのを防ぐために、getSessionをメモ化する
  const getCurrentSession = useCallback(() => {
    // isSessionsLoadingが完了していないなら、nullを返す
    if (isSessionsLoading) {
      return null;
    }
    const session = getSession(params.id);
    return session;
  }, [getSession, params.id, isSessionsLoading, sessions?.length]);

  // Handle URL query parameters
  useEffect(() => {
    if (paramsProcessed || !searchParams || !isLogged) return;

    // Handle initial model from URL
    const modelParam = searchParams.get("model");
    if (modelParam && modelDescriptions[modelParam]) {
      setModel(modelParam);
      logger.info("URL Params", `Set model to ${modelParam}`);
    }

    // Handle initial image from URL
    const imgParam = searchParams.get("img");
    if (imgParam) {
      setImage(imgParam);
      setVisionRequired(true);
      logger.info("URL Params", "Found image in URL params");
    }

    // Mark params as processed
    setParamsProcessed(true);
  }, [searchParams, isLogged, paramsProcessed]);

  useEffect(() => {
    // 認証中は何もしない
    if (isLoading || isSessionsLoading || sessionChecked || isRedirecting) {
      return;
    }

    // 少し遅延を入れて、確実にセッションデータが読み込まれるようにする
    const timer = setTimeout(() => {
      const session = getCurrentSession();

      // セッションが見つからない場合のみリダイレクト
      if (!session) {
        setIsRedirecting(true);
        router.push("/home");
        return;
      }

      setCurrentSessionData(session);
      setSessionChecked(true);
      setAdvancedSearch(
        window.localStorage.getItem("advancedSearch") === "true"
      );
      setMessages(session.messages);
      logger.info("Init", "Loaded Messages");
    }, 1000); // 1000msの遅延を追加

    return () => clearTimeout(timer);
  }, [
    isLoading,
    isSessionsLoading,
    getCurrentSession,
    router,
    setMessages,
    params.id,
    isRedirecting,
    sessionChecked,
  ]);

  useEffect(() => {
    if (!auth) return;

    if (!isLoading && !user) {
      router.push("/login");
      return;
    }

    if (!isLoading && user) {
      setIsLogged(true);

      if (!user.displayName) {
        router.push("/getting-started");
        return;
      }
    }
  }, [isLoading, user, router, auth]);

  // 初期メッセージを別のuseEffectで処理
  useEffect(() => {
    if (!isLogged || !currentSession || !paramsProcessed) return;

    const initialMessage = searchParams.get("i");

    if (initialMessage && !messages.length) {
      // メッセージが空の場合のみ初期メッセージを送信
      setInput(initialMessage);
      // 一度だけ実行されるフラグを使用
      const hasSubmitted = sessionStorage.getItem(`submitted_${params.id}`);
      if (!hasSubmitted) {
        sessionStorage.setItem(`submitted_${params.id}`, "true");
        // 非同期でhandleSubmitを実行
        setTimeout(() => {
          // inputの値を設定してからhandleSubmitを呼び出す
          logger.info(
            "Initial message",
            `Sending initial message: ${initialMessage}`
          );

          const sendInitialMessage = async () => {
            try {
              sendButtonRef.current?.click();
            } catch (error) {
              logger.error(
                "Initial message",
                `Failed to send initial message: ${error}`
              );
              toast.error(t("chat.error.messageSendFailed"), {
                description:
                  error instanceof Error
                    ? error.message
                    : t("common.error.unknown"),
              });
            }
          };

          // 送信を実行
          sendInitialMessage();
        }, 500); // タイミングを更に調整
      }
    }
  }, [
    isLogged,
    currentSession,
    messages.length,
    setInput,
    params.id,
    handleSubmit,
    image,
    searchParams,
    paramsProcessed,
    auth,
    user,
    t,
  ]);

  useEffect(() => {
    if (
      (status === "streaming" || status === "submitted") &&
      chatLogRef.current
    ) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [messages, status]);

  // Monitor input value changes

  useEffect(() => {
    if (!currentSession) return;
    if (status === "streaming" || status === "submitted") return;
    if (messages.length === 0) return;

    // メッセージの更新を遅延させる
    const timeoutId = setTimeout(() => {
      // 前回のメッセージと比較して変更があった場合のみ更新
      const prevMessages = currentSession.messages;

      // 最適化: JSON.stringifyを使わずに比較
      let hasChanges = prevMessages.length !== messages.length;

      if (!hasChanges && messages.length > 0) {
        const lastPrevMsg = prevMessages[prevMessages.length - 1];
        const lastNewMsg = messages[messages.length - 1];

        // NULLチェックと厳密な比較
        hasChanges =
          !lastPrevMsg ||
          !lastNewMsg ||
          lastPrevMsg.id !== lastNewMsg.id ||
          lastPrevMsg.content !== lastNewMsg.content;
      }

      if (hasChanges) {
        updateSession(params.id, {
          ...currentSession,
          messages: messages,
        });
      }
    }, 500); // 500ms遅延

    return () => clearTimeout(timeoutId);
  }, [currentSession, messages, params.id, status, updateSession]);

  // 画像メッセージの検出を分離
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

  const handleModelChange = useCallback(
    (newModel: string) => {
      if (!modelDescriptions[newModel]?.vision) {
        logger.warn(
          "handleModelChange",
          "Model does not support vision, deleting currently uploaded image..."
        );
        setImage(null);
      }

      if (!modelDescriptions[newModel]?.toolDisabled) {
        setAvailableTools([]);
        logger.info("handleModelChange", "Tools disabled");
      }

      logger.info("handleModelChange", "Model changed to" + newModel);
      setModel(newModel);
    },
    [setModel]
  );

  const searchToggle = () => {
    setSearchEnabled((prev) => !prev);
  };

  const deepResearchToggle = () => {
    if (!deepResearch) {
      toast.info(t("chat.deepResearch.info"), {
        description: t("chat.deepResearch.description"),
      });
    }
    setDeepResearch((prev) => !prev);
  };

  const handleRegenerate = () => {
    authReload();
  };

  const baseSendMessage = async (
    event:
      | React.MouseEvent<HTMLButtonElement>
      | React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (!currentSession || !input) return;
    if (status === "streaming" || status === "submitted") return;

    const newAvailableTools = [];

    if (searchEnabled) {
      newAvailableTools.push("search");
    }

    if (advancedSearch) {
      newAvailableTools.push("advancedSearch");
    }

    if (deepResearch) {
      newAvailableTools.push("deepResearch");
    }

    if (canvasEnabled) {
      newAvailableTools.push("canvas");
    }

    setAvailableTools(newAvailableTools);

    try {
      const submitOptions: ChatRequestOptions = {
        experimental_attachments: image
          ? [{ url: image, contentType: "image/png" }]
          : undefined,
      };

      if (auth) {
        if (user) {
          const idToken = await user.getIdToken();
          if (!idToken) {
            throw new Error(t("chat.error.idTokenFailed"));
          }
          submitOptions.headers = { Authorization: idToken };
        }
      }

      logger.info(
        "Send message",
        `Sending message with input: "${input.substring(0, 30)}..."`
      );
      if (image) {
        logger.info("Send message", "Sending with image attachment");
      }

      handleSubmit(event, submitOptions);
      setImage(null);
      setRetryCount(0); // Reset retry count on successful send
    } catch (error) {
      toast.error(t("chat.error.messageSendFailed"), {
        description:
          error instanceof Error ? error.message : t("common.error.unknown"),
      });
    }
  };

  const authReload = async () => {
    const submitOptions: ChatRequestOptions = {
      experimental_attachments: image
        ? [{ url: image, contentType: "image/png" }]
        : undefined,
    };

    if (auth && user) {
      const idToken = await user.getIdToken();
      if (!idToken) {
        throw new Error(t("chat.error.idTokenFailed"));
      }
      submitOptions.headers = { Authorization: idToken };
    }

    reload(submitOptions);
  };

  const handleRetry = async () => {
    if (retryCount >= MAX_RETRIES) {
      toast.error(t("chat.error.maxRetriesReached"));
      return;
    }

    setRetryCount((prev) => prev + 1);
    authReload();
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

  const uploadImage = (file?: File) => {
    return new Promise<uploadResponse>((resolve) => {
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

      async function upload() {
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

        let idToken;

        if (auth && user) {
          idToken = await user.getIdToken();
        }

        if (idToken) {
          setCurrentAuthToken(idToken);
        }

        setTimeout(async () => {
          try {
            const data = await startUpload([
              new File([file], `${crypto.randomUUID()}.png`, {
                type: file.type,
              }),
            ]);

            if (!data) {
              resolve({
                status: "error",
                error: {
                  message: t("common.error.unknown"),
                  code: "upload_failed",
                },
              });
              return;
            }

            if (data[0]?.ufsUrl) {
              resolve({
                status: "success",
                data: {
                  url: data[0].ufsUrl,
                },
              });
            } else {
              resolve({
                status: "error",
                error: {
                  message: t("common.error.unknown"),
                  code: "upload_failed",
                },
              });
            }
          } catch (error) {
            logger.error("uploadImage", `Something went wrong, ${error}`);
            resolve({
              status: "error",
              error: {
                message: t("common.error.unknown"),
                code: "upload_failed",
              },
            });
          }
        }, 1000);
      }
      upload();
    });
  };

  const handleImagePaste = async (
    event: React.ClipboardEvent<HTMLDivElement>
  ) => {
    if (!modelDescriptions[model]?.vision) return;
    if (!event.clipboardData) return;

    const clipboardData = event.clipboardData;
    if (clipboardData) {
      if (clipboardData.files.length === 0) return;
      const clipboardFile = clipboardData.files[0];
      toast.promise<uploadResponse>(uploadImage(clipboardFile), {
        loading: t("common.upload.uploading"),
        success: (uploadResponse: uploadResponse) => {
          if (!uploadResponse.data) return;
          setImage(uploadResponse.data?.url);
          return t("common.upload.uploaded");
        },
        error: (uploadResponse: uploadResponse) => {
          logger.error(
            "handleImagePaste",
            "Something went wrong, " + JSON.stringify(uploadResponse.error)
          );
          return uploadResponse.error?.message || t("common.error.unknown");
        },
      });
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!modelDescriptions[model]?.vision) return;

    const files = event.target?.files;
    if (!files) return;

    toast.promise<uploadResponse>(uploadImage(files[0]), {
      loading: t("common.upload.uploading"),
      success: (uploadResponse: uploadResponse) => {
        if (!uploadResponse.data) return;
        setImage(uploadResponse.data?.url);
        return t("common.upload.uploaded");
      },
      error: (uploadResponse: uploadResponse) => {
        logger.error(
          "handleImagePaste",
          "Something went wrong, " + JSON.stringify(uploadResponse.error)
        );
        return uploadResponse.error?.message || t("common.error.unknown");
      },
    });
  };

  if (isLoading || isSessionsLoading || isRedirecting || !sessionChecked) {
    return <Loading />;
  }

  return (
    <main
      className={cn(
        "flex flex-col w-full mr-0 p-4 items-center overflow-hidden justify-between h-[100dvh]"
      )}
    >
      <HeaderArea
        model={model}
        stop={stop}
        generating={status == "submitted" || status == "streaming"}
        handleModelChange={handleModelChange}
        reasoningEffort={reasoningEffort}
        handleReasoningEffortChange={setReasoningEffort}
        currentSession={currentSession as ChatSession}
        user={user as User}
        messages={messages}
        chatId={params.id}
      />
      {/* Chat Log */}
      {/* <StatusAlert
        type="success"
        title="Issues are fixed!"
        className="md:w-9/12 lg:w-7/12"
        description="All models are available again. You can use them without any issues!"
        show={showSystemAlert}
        onClose={() => setShowSystemAlert(false)}
      /> */}

      <div
        className={cn(
          "flex w-full md:w-9/12 lg:w-7/12 rounded overflow-y-auto scrollbar-thin scrollbar-thumb-primary scrollbar-track-secondary scrollbar-thumb-rounded-md scrollbar-track-rounded-md flex-1 my-2",
          isMobile && "px-1"
        )}
        ref={chatLogRef}
      >
        <div className="w-full overflow-y-auto">
          <Suspense fallback={<Loading />}>
            {currentSession && (
              <>
                <MemoizedMessageList
                  messages={messages}
                  sessionId={params.id}
                  error={error}
                  onRegenerate={handleRegenerate}
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
            )}
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
    </main>
  );
};

export default ChatApp;

"use client";

import { Message, useChat, UseChatOptions } from "@ai-sdk/react";
import { useEffect, useRef, useState, useCallback, useMemo, memo } from "react";
import ChatInput from "./chat/input";
import { MobileModelSelector } from "./chat/input-components";
import { redirect } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { AlertTriangle, Dot, Loader2 } from "lucide-react";
import { ERROR_MAPPING, loading_words } from "@/lib/constants";
import Messages from "./chat/messages";
import { Conversation } from "@/lib/conversations";
import { useConversations } from "@/hooks/use-conversations";
import { useSupabase } from "@/context/supabase-context";
import { useUploadThing } from "@/lib/uploadthing";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";
import { BranchTree } from "./chat/branch-tree";
import { ShareButton } from "./chat/share-button";
import { useTranslations } from "@/hooks/use-translations";

interface MainChatProps {
  initialConversation?: Conversation;
  initialInput?: string;
}

const MainChat = memo<MainChatProps>(
  ({ initialConversation, initialInput }) => {
    const [model, setModel] = useState("gpt-4o");
    const [canvas, setCanvas] = useState<boolean>(false);
    const [search, setSearch] = useState<boolean>(false);
    const { supabase, loading, user, ssUserData, clientAddUses } =
      useSupabase();
    const [thinkingEffort, setThinkingEffort] = useState<
      "disabled" | "low" | "medium" | "high"
    >("disabled");
    const [researchMode, setResearchMode] = useState<
      "disabled" | "shallow" | "deep" | "deeper"
    >("disabled");
    const { updateConversationTitle } = useConversations();
    const [titleApplied, setTitleApplied] = useState(false);
    const t = useTranslations();

    const [loadingWord, setLoadingWord] = useState<string>("");

    const messagesRef = useRef<HTMLDivElement>(null);
    const [authToken, setAuthToken] = useState<string>("");

    const [image, setImage] = useState<string | null>(null);

    const router = useRouter();

    const { isUploading, startUpload } = useUploadThing("imageUploader", {
      headers: {
        // Use authToken prop
        Authorization: authToken || "",
      },
      onClientUploadComplete: (res) => {
        setImage(res[0]?.ufsUrl || null);
      },
      onUploadError: (error: Error) => {
        toast.error(t("chat.imageUpload.failed"), {
          description: `${t("chat.imageUpload.errorOccurred")}: ${error.message}`,
        });
      },
    });

    useEffect(() => {
      const getAuthToken = async () => {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setAuthToken(session?.access_token || "");
      };
      getAuthToken();
    }, []);

    const chatConfig = useMemo(
      () =>
        ({
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          sendExtraMessageFields: true,
          body: {
            id: initialConversation?.id || "",
            thinkingEffort,
            botId: initialConversation?.bot?.id,
            model,
            canvas,
            search,
            researchMode,
          },
          initialMessages: initialConversation?.messages || [],
          initialInput: initialInput || "",
          onFinish: async (message, options) => {
            if (options.finishReason === "stop") {
              await clientAddUses(model);
            }
          },
        }) as UseChatOptions,
      [
        authToken,
        initialConversation?.id,
        model,
        thinkingEffort,
        canvas,
        search,
        researchMode,
      ],
    );

    const {
      messages,
      error,
      data,
      handleSubmit,
      handleInputChange,
      status,
      input,
    } = useChat(chatConfig);

    const checkAuth = useCallback(async () => {
      if (!user && !loading) {
        router.push("/auth/login");
      }

      if (user && !loading) {
        // Send message
        if (initialInput && initialConversation?.messages.length === 0) {
          // Prevent sending if there are existing messages
          handleSubmit({
            preventDefault: () => {},
          });
        }
      }
    }, [supabase, loading, initialInput]);

    useEffect(() => {
      checkAuth();
    }, [checkAuth]);

    const scrollToBottom = useCallback(() => {
      setTimeout(() => {
        if (messagesRef.current) {
          messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
        }
      }, 0);
    }, []);

    useEffect(() => {
      scrollToBottom();
    }, [messages, scrollToBottom]);

    useEffect(() => {
      if (data && initialConversation && !titleApplied) {
        const title = (data.find((item) => item) as any).title;
        if (!title) return;
        setTitleApplied(true);
        updateConversationTitle(
          initialConversation.id,
          (title as string) || t("chat.message.untitledConversation"),
        );
      }
    }, [data]);

    useEffect(() => {
      setLoadingWord(
        loading_words[Math.floor(Math.random() * loading_words.length)] ||
          t("common.loading"),
      );
    }, [t]);

    const handleImageUpload = useCallback(
      async (file: File) => {
        if (!file) return;

        try {
          await startUpload([file]);
        } catch (error) {
          toast.error(t("chat.imageUpload.failed"), {
            description: `${t("chat.imageUpload.errorOccurred")}: ${error}`,
          });
        }
      },
      [startUpload, t],
    );

    if (!initialConversation) {
      redirect("/chat");
    }

    const welcomeMessage = useMemo(() => {
      if (researchMode !== "disabled") {
        return t("chat.welcome.research");
      }
      if (search) {
        return t("chat.welcome.search");
      }
      if (canvas) {
        return t("chat.welcome.canvas");
      }
      return t("chat.welcome.default");
    }, [researchMode, search, canvas, t]);

    if (loading && loadingWord) {
      return (
        <div className="h-full w-full flex items-center justify-center">
          <Loader2 className="animate-spin" />
          <span className="ml-2">{loadingWord}</span>
        </div>
      );
    }

    return (
      <main className="h-full flex flex-col relative">
        {/* Mobile model selector at top center */}
        <MobileModelSelector model={model} setModel={setModel} />

        {messages.length === 0 && (
          <div className="text-center mb-12 w-full h-full flex items-center justify-center flex-col">
            <h1
              key={welcomeMessage}
              className="!mb-1 text-4xl font-bold bg-gradient-to-r from-lime-400 via-sky-500 to-fuchsia-600 bg-clip-text text-transparent animate-welcome"
            >
              {welcomeMessage}
            </h1>
            {ssUserData?.plan && ssUserData?.plan !== "free" && (
              <span className="font-semibold opacity-80 hover:opacity-100 transition-all">
                <span className="bg-gradient-to-r from-pink-400 to-sky-500 bg-clip-text text-transparent capitalize">
                  {ssUserData?.plan}
                </span>{" "}
                {t("chat.welcome.planActive")}
              </span>
            )}
            {(!ssUserData?.plan ||
              !ssUserData ||
              ssUserData?.plan === "free") && (
              <div className="flex items-center font-semibold text-sm">
                {t("chat.welcome.freePlan")}{" "}
                <Dot size={16} className="text-foreground" />{" "}
                <Link
                  href="/upgrade"
                  className="text-blue-500 dark:text-blue-400 underline-offset-3 hover:underline"
                >
                  {t("chat.welcome.upgradePlan")}
                </Link>
              </div>
            )}
          </div>
        )}
        <div className="flex-1 overflow-y-auto" ref={messagesRef}>
          {/* Sidebar toggle, branch tree and share button */}
          <div className="w-full max-w-4xl mx-auto mb-4">
            <div className="flex items-center justify-between pl-12 md:pl-0">
              {messages.length > 0 && initialConversation?.id && (
                <BranchTree
                  conversationId={initialConversation.id}
                  currentConversationId={initialConversation.id}
                />
              )}
              {messages.length > 0 && initialConversation?.id && (
                <ShareButton
                  conversation={initialConversation}
                  user={user}
                  messages={messages}
                  authToken={authToken}
                />
              )}
            </div>
          </div>
          <Messages
            messages={messages}
            conversationId={initialConversation?.id}
          />
          {error && (
            <div className="flex items-center gap-2 p-4 pl-0 w-full max-w-4xl mx-auto">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive/15">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-destructive">
                  {t("common.error.title")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {ERROR_MAPPING[error.message] || error.message}
                </p>
              </div>
            </div>
          )}
          {status === "submitted" && (
            <div className="flex items-center p-4 w-full max-w-4xl mx-auto text-sm">
              <Loader2 className="animate-spin" />
              <span className="ml-2">{loadingWord}</span>
            </div>
          )}
        </div>
        <div className="w-full max-w-4xl mx-auto">
          <ChatInput
            model={model}
            setModel={setModel}
            canvas={canvas}
            setCanvas={setCanvas}
            search={search}
            setSearch={setSearch}
            researchMode={researchMode}
            setResearchMode={setResearchMode}
            handleSubmit={handleSubmit}
            handleInputChange={handleInputChange}
            input={input}
            thinkingEffort={thinkingEffort}
            setThinkingEffort={setThinkingEffort}
            image={image}
            setImage={setImage}
            handleImageUpload={handleImageUpload}
            isUploading={isUploading}
          />
          {initialConversation?.bot && (
            <div className="text-center text-sm mt-2 text-muted-foreground">
              {t("chat.botSession.message")}
            </div>
          )}
        </div>
      </main>
    );
  },
);

MainChat.displayName = "MainChat";

export default MainChat;

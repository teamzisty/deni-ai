"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { cn } from "@workspace/ui/lib/utils";
import { useChatSessions } from "@/hooks/use-chat-sessions";
import { useRouter } from "@/i18n/navigation";
import { Footer } from "@/components/footer";
import { auth } from "@workspace/firebase-config/client";
import { Loading } from "@/components/loading";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { modelDescriptions } from "@/lib/modelDescriptions";
import ChatInput from "@/components/ChatInput";
import { uploadResponse, useUploadThing } from "@/utils/uploadthing";
import logger from "@/utils/logger";
import { useAuth } from "@/context/AuthContext";
import { ExampleQuestion } from "@/components/ExampleQuestion";

const ChatApp: React.FC = () => {
  const t = useTranslations();
  const {
    createSession,
    isLoading: isSessionsLoading,
  } = useChatSessions();
  const [isLoading, setIsLoading] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [selectedModel, setSelectedModel] = useState<string>(
    "openai/gpt-4.1-mini-2025-04-14"
  );
  const [image, setImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [deepResearch, setDeepResearch] = useState(false);
  const [canvasEnabled, setCanvasEnabled] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [currentAuthToken, setCurrentAuthToken] = useState<string | null>(null);
  const { user } = useAuth();

  const router = useRouter();

  // Setup uploadthing for image uploads
  const { isUploading: uploading, startUpload } = useUploadThing(
    "imageUploader",
    {
      headers: {
        Authorization: auth ? currentAuthToken || "" : "",
      },
      onClientUploadComplete: (res) => {
        setImage(res[0]?.ufsUrl || null);
      },
      onUploadError: (error: Error) => {
        toast.error(t("chat.error.imageUpload"), {
          description: t("chat.error.errorOccurred", {
            message: error.message,
          }),
        });
      },
    }
  );

  useEffect(() => {
    if (uploading) {
      setIsUploading(true);
    } else {
      setIsUploading(false);
    }
  }, [uploading]);

  const handleNewSession = () => {
    // Create new session
    const session = createSession();

    // Get input value and image to send to chat page
    const queryParams = new URLSearchParams();

    if (inputValue.trim()) {
      queryParams.set("i", inputValue.trim());
    }

    if (image) {
      queryParams.set("img", image);
    }

    if (selectedModel) {
      queryParams.set("model", selectedModel);
    }

    // Build the URL with query parameters
    const url = `/chat/${session.id}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

    router.push(url);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  const handleSendMessage = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (inputValue.trim() || image) {
      handleNewSession();
    }
  };

  const handleSendMessageKey = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    e.preventDefault();
    if (inputValue.trim() || image) {
      handleNewSession();
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
    if (!modelDescriptions[selectedModel]?.vision) return;
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

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!modelDescriptions[selectedModel]?.vision) return;

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
          "handleImageUpload",
          "Something went wrong, " + JSON.stringify(uploadResponse.error)
        );
        return uploadResponse.error?.message || t("common.error.unknown");
      },
    });
  };

  const handleModelChange = useCallback(
    (model: string) => {
      if (!modelDescriptions[model]?.vision && image) {
        setImage(null);
        toast.warning(
          t("chat.warning.modelDoesNotSupportVision") ||
            "Selected model doesn't support images"
        );
      }
      setSelectedModel(model);
    },
    [image, t]
  );

  const searchToggle = useCallback(() => {
    setSearchEnabled((prev) => !prev);
  }, []);

  const deepResearchToggle = useCallback(() => {
    setDeepResearch((prev) => !prev);
  }, []);

  const canvasToggle = useCallback(() => {
    setCanvasEnabled((prev) => !prev);
  }, []);

  useEffect(() => {
    if (!auth) {
      setIsLoading(false);
      return;
    }

    const event = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      setIsLoading(false);
    });
    return () => {
      event();
    };
  }, [router]);

  if (isLoading || isSessionsLoading) {
    return <Loading />;
  }

  return (
    <main className="w-full flex">
      {/* Main Chat Area */}
      <div
        className={cn(
          "flex flex-col flex-1 w-full md:w-9/12 mr-0 md:mr-16 ml-3 p-4 h-screen"
        )}
      >
        <br />

        {/* Input Area */}
        <div className="flex items-center flex-col w-full md:w-7/12 m-auto">
          <h1 className="m-auto text-xl lg:text-3xl mb-1 font-bold">
            {t("home.title")}
          </h1>
          <p className="text-muted-foreground mb-2">{t("home.subtitle")}</p>

          {/* Example Questions */}
          <div className="mt-2 space-y-3 max-w-lg mx-auto">
            <ExampleQuestion onClick={() => setInputValue("What is Deni AI?")}>
              What is Deni AI?
            </ExampleQuestion>
            <ExampleQuestion
              onClick={() => setInputValue("Generate image with cute cat")}
            >
              Generate image with cute cat
            </ExampleQuestion>
            <ExampleQuestion
              onClick={() =>
                setInputValue('Search the Latest News on US')
              }
            >
              Search the Latest News on US
            </ExampleQuestion>
          </div>

          <ChatInput
            input={inputValue}
            image={image}
            model={selectedModel}
            isUploading={isUploading}
            stop={() => {}}
            className="w-full md:w-full lg:w-full"
            generating={false}
            searchEnabled={searchEnabled}
            deepResearch={deepResearch}
            canvasEnabled={canvasEnabled}
            modelDescriptions={modelDescriptions}
            handleInputChange={handleInputChange}
            deepResearchToggle={deepResearchToggle}
            canvasToggle={canvasToggle}
            handleSendMessage={handleSendMessage}
            handleSendMessageKey={handleSendMessageKey}
            handleImagePaste={handleImagePaste}
            searchToggle={searchToggle}
            handleImageUpload={handleImageUpload}
            setImage={setImage}
            fileInputRef={fileInputRef}
          />
        </div>

        <Footer />
      </div>
    </main>
  );
};

export default ChatApp;

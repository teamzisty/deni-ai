"use client";

import { toast } from "sonner";
import { Button } from "@repo/ui/components/button";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "@/i18n/navigation";
import { Loading } from "@/components/loading";
import { updateProfile } from "firebase/auth";
import { Input } from "@repo/ui/components/input";
import { Switch } from "@repo/ui/components/switch";
import { useChatSessions } from "@/hooks/use-chat-sessions";
import { uploadResponse, useUploadThing } from "@/utils/uploadthing";
import logger from "@/utils/logger";
import React from "react";
import { useTranslations } from "next-intl";
import { auth, firestore } from "@repo/firebase-config/client";

export default function AccountSettings() {
  const { user, isLoading } = useAuth();
  const { syncSessions, isLoading: isSessionsLoading } = useChatSessions();
  const [isLogged, setIsLogged] = useState(false);
  const [name, setName] = useState("");
  const [privacyMode, setPrivacyMode] = useState(false);
  const t = useTranslations();
  const [isSyncing, setIsSyncing] = useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [authToken, setAuthToken] = useState<string | null>(null);

  const { isUploading, startUpload } = useUploadThing("imageUploader", {
    headers: {
      Authorization: authToken || "",
    },
    onUploadError: (error: Error) => {
      toast.error(t("account.uploadFailed"), {
        description: `${t("account.error")}: ${error.message}`,
      });
    },
  });

  const handleSync = async () => {
    // Check if Firebase auth is initialized
    if (!auth) {
      toast.error(t("account.error"), {
        description: t("account.authDisabled") || "Authentication service is not available. Please check your Firebase configuration."
      });
      return;
    }

    // 明示的なFirestoreの初期化とデバッグテスト
    console.log("Firestore check in handleSync:", { firestore });
    
    // Check if user is logged in
    if (!user) {
      toast.error(t("account.error"), {
        description: "You need to be logged in to sync sessions"
      });
      return;
    }
    
    setIsSyncing(true);
    try {
      await syncSessions();
      toast.success(t("account.syncedConversations"));
    } catch (error: unknown) {
      console.error("Sync error:", error);
      const errorMessage =
        error instanceof Error ? error.message : t("common.error.unknown");
      toast.error(t("account.error"), {
        description: errorMessage,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const router = useRouter();

  useEffect(() => {
    // 初期値の設定
    const privacyMode = window.localStorage.getItem("privacyMode");
    setPrivacyMode(privacyMode === "true");

    if (!auth && !isLoading) {
      toast.error(t("account.error"), {
        description: t("account.authDisabled"),
      });

      router.push("/home");
      return;
    }

    if (!user && !isLoading) {
      router.push("/");
    }

    if (user && !isLoading) {
      setIsLogged(true);
      setName(privacyMode ? user.displayName || "" : "");
    }
  }, [user, isLoading, router, t]);

  const uploadImage = (file?: File) => {
    return new Promise<uploadResponse>((resolve) => {
      if (!file) {
        resolve({
          status: "error",
          error: {
            message: t("account.fileNotSelected"),
            code: "file_not_selected",
          },
        });
        return;
      }

      user?.getIdToken().then((idToken) => {
        if (idToken) {
          setAuthToken(idToken);
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
      });
    });
  };

  const handleChangeName = async () => {
    if (!user) return;

    if (!name) {
      toast.error(t("settings.popupMessages.enterName"));
      return;
    }

    try {
      await updateProfile(user, {
        displayName: name,
      });

      toast.success(t("settings.popupMessages.nameChanged"));
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : t("common.error.unknown");
      toast.error(t("account.nameChangeFailed"), {
        description: errorMessage,
      });
    }
  };

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!user) return;

    const files = event.target?.files;
    if (!files) return;

    toast.promise<uploadResponse>(uploadImage(files[0]), {
      loading: t("account.changingAvatar"),
      success: async (uploadResponse: uploadResponse) => {
        if (!uploadResponse.data) return;

        try {
          await updateProfile(user, {
            photoURL: uploadResponse.data.url,
          });

          return t("account.avatarChanged");
        } catch (error: unknown) {
          logger.error(
            "handleImagePaste",
            "Something went wrong, " + JSON.stringify(error)
          );
          return error instanceof Error
            ? error.message
            : t("common.error.unknown");
        }
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

  function togglePrivacyMode() {
    const newValue = !privacyMode;
    window.localStorage.setItem("privacyMode", newValue ? "true" : "false");
    setPrivacyMode(newValue);
    // カスタムイベントをディスパッチ
    window.dispatchEvent(
      new CustomEvent("privacyModeChange", { detail: newValue })
    );
  }

  if (isLoading || isSessionsLoading) {
    return <Loading />;
  }

  return (
    isLogged && (
      <div className="space-y-6">
        <div className="bg-card/50 border border-border/30 rounded-md overflow-hidden">
          <div className="p-5">
            <div className="flex-grow mb-2">
              <h3 className="text-lg font-bold">
                {t("settings.account.name.title")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("settings.account.name.description")}
              </p>
            </div>
            <div className="flex gap-2">
              <Input
                value={name}
                placeholder={t("settings.account.name.placeholder")}
                onChange={(e) => setName(e.target?.value)}
                className="min-w-[180px]"
              />
              <Button
                onClick={handleChangeName}
                variant="outline"
                className="w-fit ml-auto"
              >
                {t("settings.account.name.action")}
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-card/50 border border-border/30 rounded-md overflow-hidden">
          <div className="flex p-5 items-center gap-4">
            <div className="flex-grow">
              <h3 className="text-lg font-bold">
                {t("settings.account.avatar.title")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("settings.account.avatar.description")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                className="hidden"
              />
              <Button
                variant="outline"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {t("settings.account.avatar.action")}
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-card/50 border border-border/30 rounded-md overflow-hidden">
          <div className="flex p-5 items-center gap-4">
            <div className="flex-grow">
              <h3 className="text-lg font-bold">
                {t("settings.account.privacyMode.title")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("settings.account.privacyMode.description")}
              </p>
            </div>
            <div>
              <Switch
                className="scale-125"
                checked={privacyMode}
                onCheckedChange={togglePrivacyMode}
              />
            </div>
          </div>
        </div>

        <div className="bg-card/50 border border-border/30 rounded-md overflow-hidden">
          <div className="flex p-5 items-center gap-4">
            <div className="flex-grow">
              <h3 className="text-lg font-bold">
                {t("settings.account.sync.title")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("settings.account.sync.description")}
              </p>
            </div>
            <div>
              <Button
                onClick={handleSync}
                disabled={isSyncing}
                variant="outline"
              >
                {isSyncing
                  ? t("settings.account.sync.syncing")
                  : t("settings.account.sync.action")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  );
}
